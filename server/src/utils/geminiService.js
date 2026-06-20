/**
 * Gemini AI Service
 * Handles initialization and API calls to Google Gemini for resume analysis
 * Utility Layer - Reusable across different controllers
 */

const { GoogleGenAI } = require('@google/genai');

let aiClient1 = null;
let aiClient2 = null;
let apiKey1 = null;
let apiKey2 = null;
const modelName = 'gemini-3.1-flash-lite';

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

    if (!apiKey1) {
      console.error('❌ GEMINI_API_KEY or GEMINI_API_KEY_1 is not set in environment variables');
      return false;
    }

    aiClient1 = new GoogleGenAI({ apiKey: apiKey1 });

    if (apiKey2) {
      aiClient2 = new GoogleGenAI({ apiKey: apiKey2 });
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
  return aiClient1 !== null;
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
const delay = ms => new Promise(res => setTimeout(res, ms));

const analyzeResume = async (resumeText, options = {}) => {
  let attempt = 0;
  const maxRetries = 2;
  const baseDelay = 1000;

  while (attempt <= maxRetries) {
    try {
    const { timeout = 30000, systemPrompt = '', apiKey = null } = options;

    let targetClient1 = aiClient1;
    let targetClient2 = aiClient2;

    if (apiKey) {
      // Use custom API key instead of initialized clients
      targetClient1 = new GoogleGenAI({ apiKey });
      targetClient2 = null; // No fallback for custom key
    } else if (!isInitialized()) {
      return {
        success: false,
        analysis: null,
        error: 'Gemini AI is not initialized and no API key was provided.',
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

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Send request to Gemini
      const response = await Promise.race([
        targetClient1.models.generateContent({
          model: modelName,
          contents: resumeText,
          config: systemPrompt ? { systemInstruction: systemPrompt } : undefined
        }),
        new Promise((_, reject) =>
          controller.signal.addEventListener('abort', () =>
            reject(new Error(`Resume analysis timed out after ${timeout}ms`))
          )
        )
      ]);

      clearTimeout(timeoutId);

      // Extract response text
      const analysisText = response.text;

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
      const tokens = response.usageMetadata
        ? {
            prompt: response.usageMetadata.promptTokenCount || 0,
            completion: response.usageMetadata.candidatesTokenCount || 0
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
    const isRateLimit = error.message?.includes('429') || 
                        error.message?.includes('RESOURCE_EXHAUSTED') ||
                        error.message?.includes('quota');
    
    if (isRateLimit && attempt < maxRetries) {
      attempt++;
      const waitTime = baseDelay * Math.pow(2, attempt);
      console.warn(`[Gemini] Rate limited on resume analysis. Retrying in ${waitTime}ms (Attempt ${attempt}/${maxRetries})...`);
      await delay(waitTime);
      continue;
    }
    
    console.error(`[Gemini] Error analyzing resume (Attempt ${attempt}):`, error.message);
    return {
      success: false,
      analysis: null,
      error: `Gemini API error: ${error.message}`,
      tokens: null
    };
  }
  } // End while
};

/**
 * Generate text using Gemini AI with dual API key fallback support
 * Used by interview system for real-time question evaluation and generation
 * @param {string} prompt - The prompt to send to Gemini
 * @param {Object|number} options - Configuration options or timeout
 * @param {number} options.timeout - Request timeout in ms (default: 30000)
 * @param {string} options.apiKey - Custom API key to use (optional)
 * @returns {Promise<string>} The generated text response
 * @throws {Error} If both API keys fail or generation fails
 */
const generateText = async (prompt, options = {}) => {
  let attempt = 0;
  const maxRetries = 2;
  const baseDelay = 1000;
  let timeout = 30000;
  let apiKey = null;

  if (typeof options === 'number') {
    timeout = options;
  } else if (typeof options === 'object' && options !== null) {
    timeout = options.timeout || 30000;
    apiKey = options.apiKey || null;
  }

  let targetClient1 = aiClient1;
  let targetClient2 = aiClient2;

  if (apiKey) {
    targetClient1 = new GoogleGenAI({ apiKey });
    targetClient2 = null;
  } else if (!isInitialized()) {
    throw new Error('Gemini AI is not initialized and no API key was provided');
  }

  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt must be a non-empty string');
  }

  // Helper function to attempt generation with a specific API key client
  const attemptWithKey = async (client, keyLabel) => {
    try {
      console.log(`[Gemini] Attempting with ${keyLabel}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await Promise.race([
        client.models.generateContent({
          model: modelName,
          contents: prompt
        }),
        new Promise((_, reject) =>
          controller.signal.addEventListener('abort', () =>
            reject(new Error(`Request timed out after ${timeout}ms`))
          )
        )
      ]);

      clearTimeout(timeoutId);
      const text = response.text;
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

  while (attempt <= maxRetries) {
    // Try primary API key first
    const primaryResult = await attemptWithKey(targetClient1, apiKey ? 'Custom User Key' : 'Primary Key (GEMINI_API_KEY_1)');
    if (typeof primaryResult === 'string') {
      return primaryResult;
    }

    // If primary key failed due to rate limiting and fallback client exists, try it
    if (primaryResult.isRateLimit && targetClient2) {
      console.warn(`[Gemini] Primary key rate limited, falling back to secondary key...`);
      const fallbackResult = await attemptWithKey(targetClient2, 'Fallback Key (GEMINI_API_KEY_2)');
      
      if (typeof fallbackResult === 'string') {
        return fallbackResult;
      }
      
      // Both failed - if we still have retries, backoff and retry loop
      if (attempt < maxRetries) {
        attempt++;
        const waitTime = baseDelay * Math.pow(2, attempt);
        console.warn(`[Gemini] Both keys rate limited. Retrying in ${waitTime}ms (Attempt ${attempt}/${maxRetries})...`);
        await delay(waitTime);
        continue;
      }

      console.error(`[Gemini] Both API keys exhausted:`, fallbackResult.error);
      throw new Error(`All API keys exhausted: ${fallbackResult.error.message}`);
    }

    // If rate limited but no fallback key, backoff and retry primary
    if (primaryResult.isRateLimit && attempt < maxRetries) {
      attempt++;
      const waitTime = baseDelay * Math.pow(2, attempt);
      console.warn(`[Gemini] Rate limited. Retrying in ${waitTime}ms (Attempt ${attempt}/${maxRetries})...`);
      await delay(waitTime);
      continue;
    }

    // Primary key failed without rate limit, or retries exhausted
    if (primaryResult.error) {
      console.error(`[Gemini] Primary key error:`, primaryResult.error);
      throw primaryResult.error;
    }

    throw new Error('Unknown error in generateText');
  } // end while
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

    const response = await aiClient1.models.generateContent({
      model: modelName,
      contents: 'Test'
    });

    if (response.text) {
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
