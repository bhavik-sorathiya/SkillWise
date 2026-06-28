/**
 * Gemini AI Service
 * Handles initialization and API calls to Google Gemini for resume analysis
 * Utility Layer - Reusable across different controllers
 */

const { GoogleGenAI, HarmCategory, HarmBlockThreshold } = require('@google/genai');
const resumeSchema = require('./geminiSchema');

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
  const maxAttemptsPerKey = 2;
  const baseDelay = 1000;
  const { timeout = 30000, systemPrompt = '', apiKey = null } = options;

  let targetClient1 = aiClient1;
  let targetClient2 = aiClient2;

  if (apiKey) {
    targetClient1 = new GoogleGenAI({ apiKey });
    targetClient2 = null;
  } else if (!isInitialized()) {
    return { success: false, analysis: null, error: 'Gemini AI is not initialized and no API key was provided.', tokens: null };
  }

  if (!resumeText || typeof resumeText !== 'string') {
    return { success: false, analysis: null, error: 'Resume text must be a non-empty string', tokens: null };
  }

  const attemptWithKey = async (client, keyLabel) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const config = {
        responseMimeType: 'application/json',
        temperature: options.temperature || 1.0,
        topK: options.topK || 40,
        topP: options.topP || 0.95,
        maxOutputTokens: options.maxTokens || 4096,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ]
      };

      let finalContent = resumeText;
      if (systemPrompt) {
        finalContent = `${systemPrompt}\n\n========== RESUME TEXT ==========\n\n${resumeText}`;
      }

      const response = await Promise.race([
        client.models.generateContent({
          model: modelName,
          contents: finalContent,
          config: config
        }),
        new Promise((_, reject) =>
          controller.signal.addEventListener('abort', () =>
            reject(new Error(`Resume analysis timed out after ${timeout}ms`))
          )
        )
      ]);

      clearTimeout(timeoutId);

      // Handle the new SDK response format which might return undefined or throw if blocked
      let analysisText;
      try {
        analysisText = typeof response.text === 'function' ? response.text() : response.text;
      } catch (err) {
        console.error(`[Gemini] Response text getter threw an error. Raw Response:`, JSON.stringify(response, null, 2));
        throw new Error(`AI response blocked or empty: ${err.message}`);
      }

      if (!analysisText) {
        console.error(`[Gemini] AI returned empty text. Raw Response:`, JSON.stringify(response, null, 2));
        throw new Error('AI returned an empty response. It may have been blocked by safety filters.');
      }

      let analysis = null;
      try {
        // Handle both pure JSON and markdown-wrapped JSON
        const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : analysisText;
        analysis = JSON.parse(jsonString);
      } catch (parseError) {
        console.error(`[Gemini] Failed to parse response as JSON from ${keyLabel}:`, parseError.message);
        console.error(`[Gemini] Raw Response:`, analysisText.substring(0, 500) + '...');
        return { success: false, error: `Failed to parse AI response as JSON: ${parseError.message}`, isRateLimit: false };
      }

      const tokens = response.usageMetadata
        ? {
            prompt: response.usageMetadata.promptTokenCount || 0,
            completion: response.usageMetadata.candidatesTokenCount || 0
          }
        : null;

      return { success: true, analysis, tokens };
    } catch (error) {
      clearTimeout(timeoutId);
      const isRateLimit = error.message?.includes('429') || 
                          error.message?.includes('RESOURCE_EXHAUSTED') ||
                          error.message?.includes('quota') ||
                          error.message?.includes('rate limit');
      return { success: false, error: `Gemini API error: ${error.message}`, isRateLimit };
    }
  };

  const runClientWithRetries = async (client, keyLabel) => {
    let attempt = 1;
    while (attempt <= maxAttemptsPerKey) {
      console.log(`[Gemini] Attempting analysis with ${keyLabel} (Attempt ${attempt}/${maxAttemptsPerKey})...`);
      const result = await attemptWithKey(client, keyLabel);
      if (result.success) {
        console.log(`[Gemini] ✓ Success with ${keyLabel}`);
        return result;
      }
      if (!result.success && attempt < maxAttemptsPerKey) {
        attempt++;
        const waitTime = result.isRateLimit ? baseDelay * Math.pow(2, attempt) : 500;
        console.warn(`[Gemini] ${keyLabel} failed (${result.isRateLimit ? 'Rate Limited' : 'Error'}). Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      return result; // return failed result
    }
  };

  const primaryResult = await runClientWithRetries(targetClient1, apiKey ? 'Custom User Key' : 'Primary Key (GEMINI_API_KEY_1)');
  
  if (primaryResult.success) {
    return { success: true, analysis: primaryResult.analysis, error: null, tokens: primaryResult.tokens };
  }

  // Fallback to secondary key on ANY error, not just rate limits (as requested by user)
  if (!primaryResult.success && targetClient2 && !apiKey) {
    console.warn(`[Gemini] Primary key failed (${primaryResult.error}). Falling back to secondary key...`);
    const fallbackResult = await runClientWithRetries(targetClient2, 'Fallback Key (GEMINI_API_KEY_2)');
    if (fallbackResult.success) {
      return { success: true, analysis: fallbackResult.analysis, error: null, tokens: fallbackResult.tokens };
    }
    return { success: false, analysis: null, error: fallbackResult.error, tokens: null };
  }

  return { success: false, analysis: null, error: primaryResult.error, tokens: null };
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
  const maxAttemptsPerKey = 2;
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

  const attemptWithKey = async (client, keyLabel) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
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
      return { success: true, text: response.text };
    } catch (error) {
      clearTimeout(timeoutId);
      const isRateLimit = error.message?.includes('429') || 
                          error.message?.includes('RESOURCE_EXHAUSTED') ||
                          error.message?.includes('rate limit') ||
                          error.message?.includes('quota');
      return { success: false, error, isRateLimit };
    }
  };

  const runClientWithRetries = async (client, keyLabel) => {
    let attempt = 1;
    while (attempt <= maxAttemptsPerKey) {
      console.log(`[Gemini] Attempting text generation with ${keyLabel} (Attempt ${attempt}/${maxAttemptsPerKey})...`);
      const result = await attemptWithKey(client, keyLabel);
      if (result.success) {
        console.log(`[Gemini] ✓ Success with ${keyLabel}`);
        return result;
      }
      if (!result.success && attempt < maxAttemptsPerKey) {
        attempt++;
        const waitTime = result.isRateLimit ? baseDelay * Math.pow(2, attempt) : 500;
        console.warn(`[Gemini] ${keyLabel} failed (${result.isRateLimit ? 'Rate Limited' : 'Error'}). Retrying in ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }
      return result;
    }
  };

  const primaryResult = await runClientWithRetries(targetClient1, apiKey ? 'Custom User Key' : 'Primary Key (GEMINI_API_KEY_1)');
  
  if (primaryResult.success) {
    return primaryResult.text;
  }

  if (primaryResult.isRateLimit && targetClient2) {
    console.warn(`[Gemini] Primary key rate limited, falling back to secondary key...`);
    const fallbackResult = await runClientWithRetries(targetClient2, 'Fallback Key (GEMINI_API_KEY_2)');
    if (fallbackResult.success) {
      return fallbackResult.text;
    }
    throw fallbackResult.error || new Error('All API keys exhausted');
  }

  throw primaryResult.error || new Error('Unknown error in generateText');
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
