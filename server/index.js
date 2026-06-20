// server/index.js
// Application entry point: configures middleware/routes, initializes Gemini, and starts HTTP server.

require('dotenv').config();

const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
}

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const path = require('path');
const socketIo = require('socket.io');
const logger = require('./src/utils/logger');
const authRoutes = require('./src/routes/authRoutes');
const intervieweeDashboardRoutes = require('./src/routes/intervieweeDashboardRoutes');
const resumeRoutes = require('./src/routes/resumeRoutes');
const skillsRoutes = require('./src/routes/skillsRoutes');
const interviewHistoryRoutes = require('./src/routes/interviewHistoryRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const { initializeGemini } = require('./src/utils/geminiService');
const { initializeInterviewSocket } = require('./src/handlers/interviewHandler');
const { globalErrorHandler } = require('./src/utils/errorHandler');
const rateLimit = require('express-rate-limit');

const app = express();
// Trust proxy is required to read correct client IPs behind cloud load balancers (like Render/Railway)
app.set('trust proxy', 1);
const server = http.createServer(app);
const isProduction = process.env.NODE_ENV === 'production';
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');

const parseOrigins = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  ...parseOrigins(process.env.CLIENT_URLS),
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
};

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  }
});

// Rate limiting configurations
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 800, // Limit each IP to 800 requests per 15 minutes
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 auth attempts per 15 minutes
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Strict limit for AI endpoints
  message: {
    success: false,
    error: 'Too many AI requests. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Global middleware for CORS, Security, Compression, and JSON/form parsing.
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiter to all API endpoints
app.use('/api', globalLimiter);

// Serve uploaded resume files when the runtime supports persistent local storage.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API route registration by bounded context.
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/interviewee', intervieweeDashboardRoutes);
app.use('/api/resumes', aiLimiter, resumeRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/interviews', aiLimiter, interviewHistoryRoutes);

// Health endpoint for load balancers and deployment probes.
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

// In production, serve the built client if it exists so the app can run as one deployable unit.
if (isProduction && fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get(/^(?!\/api).*/, (req, res, next) => {
    if (req.method !== 'GET') {
      next();
      return;
    }

    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Development home route for quick API availability checks.
  app.get('/', (req, res) => {
    res.send('Welcome to SkillWise API');
  });
}

// 404 handler - catch all undefined routes
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Sentry error handler - must be before our global error handler
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Global error handler - MUST be last middleware
app.use(globalErrorHandler);

// Initialize interview Socket.IO handlers
initializeInterviewSocket(io);

const PORT = Number(process.env.PORT) || 3000;

// Startup pipeline: initialize AI dependencies first, then bind server port.
(async () => {
  try {
    // Initialize Gemini AI for resume analysis
    const geminiInitialized = await initializeGemini();
    if (!geminiInitialized) {
      logger.warn('⚠️  Gemini AI initialization failed - resume analysis features will be unavailable');
    }

    server.listen(PORT, () => {
      logger.info(`✓ Server is running on port ${PORT}`);
      logger.info(`✓ Socket.IO initialized`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
})();

// Graceful Shutdown
const shutdown = async () => {
  logger.info('SIGTERM/SIGINT received. Shutting down gracefully...');
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      const db = require('./src/config/db');
      await db.end();
      logger.info('Database pool closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during database pool shutdown', err);
      process.exit(1);
    }
  });
  
  // Force exit if hanging
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
