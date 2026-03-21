/**
 * Gemini AI Service
 * Handles initialization and API calls to Google Gemini for resume analysis
 * Utility Layer - Reusable across different controllers
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;
let apiKey1 = null;
let apiKey2 = null;

/**
 * Initialize Gemini AI client and model
 * Call this once during app startup
 * Supports dual API keys for rate limiting fallback
 * @returns {Promise<boolean>} True if initialization successful
 */
const initializeGemini = async () => {
  try {
    // Primary API key (required)
    apiKey1 = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_1;
    // Fallback API key (optional, for rate limiting fallback)
    apiKey2 = process.env.GEMINI_API_KEY_2;

    const modelName = 'gemini-2.5-flash';

    if (!apiKey1) {
      console.error('❌ GEMINI_API_KEY or GEMINI_API_KEY_1 is not set in environment variables');
      return false;
    }

    genAI = new GoogleGenerativeAI(apiKey1);
    model = genAI.getGenerativeModel({ model: modelName });

    if (apiKey2) {
      console.log(`✓ Gemini AI initialized with model: ${modelName} (Dual-key mode: Primary + Fallback)`);
    } else {
      console.log(`✓ Gemini AI initialized with model: ${modelName} (Single-key mode)`);
    }
    return true;
  } catch (error) {
    console.error('❌ Gemini AI initialization failed:', error.message);
    return false;
  }
};

/**
 * Check if Gemini is initialized
 * @returns {boolean} True if initialized and ready
 */
const isInitialized = () => {
  return genAI !== null && model !== null;
};

/**
 * Analyze resume using Gemini AI
 * Sends extracted resume text to Gemini with a structured prompt
 * @param {string} resumeText - Extracted text from resume (prepared for AI)
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Request timeout in ms (default: 30000)
 * @param {string} options.systemPrompt - Custom system instruction (optional)
 * @returns {Promise<{success: boolean, analysis: Object|null, error: string|null, tokens: {prompt: number, completion: number}|null}>}
 */
const analyzeResume = async (resumeText, options = {}) => {
  try {
    if (!isInitialized()) {
      return {
        success: false,
        analysis: null,
        error: 'Gemini AI is not initialized. Please initialize before calling analyze.',
        tokens: null
      };
    }

    if (!resumeText || typeof resumeText !== 'string') {
      return {
        success: false,
        analysis: null,
        error: 'Resume text must be a non-empty string',
        tokens: null
      };
    }

    const { timeout = 30000, systemPrompt = '' } = options;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Combine system prompt with user content if system prompt exists
      let userContent = resumeText;
      if (systemPrompt) {
        userContent = `${systemPrompt}\n\n${resumeText}`;
      }

      // Send request to Gemini (without systemInstruction parameter)
      const response = await Promise.race([
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userContent }] }]
        }),
        new Promise((_, reject) =>
          controller.signal.addEventListener('abort', () =>
            reject(new Error(`Resume analysis timed out after ${timeout}ms`))
          )
        )
      ]);

      clearTimeout(timeoutId);

      // Extract response text
      const analysisText = response.response.text();

      // Parse JSON from response
      let analysis = null;
      try {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : analysisText;
        analysis = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse Gemini response as JSON:', analysisText);
        return {
          success: false,
          analysis: null,
          error: `Failed to parse AI response as JSON: ${parseError.message}`,
          tokens: null
        };
      }

      // Extract token usage if available
      const tokens = response.response.usageMetadata
        ? {
            prompt: response.response.usageMetadata.promptTokenCount || 0,
            completion: response.response.usageMetadata.candidateCount || 0
          }
        : null;

      return {
        success: true,
        analysis,
        error: null,
        tokens
      };
    } catch (abortError) {
      clearTimeout(timeoutId);
      throw abortError;
    }
  } catch (error) {
    console.error('Error analyzing resume with Gemini:', error.message);
    return {
      success: false,
      analysis: null,
      error: `Gemini API error: ${error.message}`,
      tokens: null
    };
  }
};

/**
 * Generate text using Gemini AI with dual API key fallback support
 * Used by interview system for real-time question evaluation and generation
 * @param {string} prompt - The prompt to send to Gemini
 * @param {number} timeout - Request timeout in ms (default: 30000)
 * @returns {Promise<string>} The generated text response
 * @throws {Error} If both API keys fail or generation fails
 */
const generateText = async (prompt, timeout = 30000) => {
  if (!isInitialized()) {
    throw new Error('Gemini AI is not initialized');
  }

  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt must be a non-empty string');
  }

  // Helper function to attempt generation with a specific API key
  const attemptWithKey = async (key, keyLabel) => {
    try {
      console.log(`[Gemini] Attempting with ${keyLabel}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const tempGenAI = new GoogleGenerativeAI(key);
      const tempModel = tempGenAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const response = await Promise.race([
        tempModel.generateContent(prompt),
        new Promise((_, reject) =>
          controller.signal.addEventListener('abort', () =>
            reject(new Error(`Request timed out after ${timeout}ms`))
          )
        )
      ]);

      clearTimeout(timeoutId);
      const text = response.response.text();
      console.log(`[Gemini] ✓ Success with ${keyLabel}`);
      return text;
    } catch (error) {
      // Check if error is due to rate limiting
      const isRateLimit = error.message.includes('429') || 
                         error.message.includes('RESOURCE_EXHAUSTED') ||
                         error.message.includes('rate limit') ||
                         error.message.includes('quota');
      
      return { error, isRateLimit, keyLabel };
    }
  };

  // Try primary API key first
  const primaryResult = await attemptWithKey(apiKey1, 'Primary Key (GEMINI_API_KEY_1)');
  if (typeof primaryResult === 'string') {
    return primaryResult;
  }

  // If primary key failed due to rate limiting and fallback key exists, try it
  if (primaryResult.isRateLimit && apiKey2) {
    console.warn(`[Gemini] Primary key rate limited, falling back to secondary key...`);
    const fallbackResult = await attemptWithKey(apiKey2, 'Fallback Key (GEMINI_API_KEY_2)');
    
    if (typeof fallbackResult === 'string') {
      return fallbackResult;
    }
    
    // Both failed
    console.error(`[Gemini] Both API keys failed:`, fallbackResult.error);
    throw new Error(`All API keys exhausted: ${fallbackResult.error.message}`);
  }

  // Primary key failed without rate limit, or no fallback key available
  if (primaryResult.error) {
    console.error(`[Gemini] Primary key error without fallback:`, primaryResult.error);
    throw primaryResult.error;
  }

  throw new Error('Unknown error in generateText');
};

/**
 * Test Gemini connection and API key validity
 * @returns {Promise<{connected: boolean, message: string}>}
 */
const testConnection = async () => {
  try {
    if (!isInitialized()) {
      return {
        connected: false,
        message: 'Gemini AI is not initialized'
      };
    }

    const response = await model.generateContent('Test');

    if (response.response.text()) {
      return {
        connected: true,
        message: 'Gemini API connection successful'
      };
    } else {
      return {
        connected: false,
        message: 'Gemini API returned empty response'
      };
    }
  } catch (error) {
    return {
      connected: false,
      message: `Gemini API connection failed: ${error.message}`
    };
  }
};

module.exports = {
  initializeGemini,
  isInitialized,
  analyzeResume,
  generateText,
  testConnection
};
