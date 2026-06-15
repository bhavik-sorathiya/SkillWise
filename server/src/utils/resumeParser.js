/**
 * Resume Parser Utility
 * Handles text extraction from DOCX resume files
 * Utility Layer - Reusable logic for different controllers
 */

const fs = require('fs');
const path = require('path');

/**
 * Extracts text content from a DOCX file buffer using mammoth library
 * @param {Buffer} fileBuffer - The buffer of the DOCX file
 * @returns {Promise<{success: boolean, text: string, characterCount: number, wordCount: number, error?: string}>}
 */
const extractTextFromDocx = async (fileBuffer) => {
  try {
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      return {
        success: false,
        text: '',
        characterCount: 0,
        wordCount: 0,
        error: 'Invalid file buffer provided'
      };
    }

    // Dynamic require for mammoth to avoid hard dependency
    let mammoth;
    try {
      mammoth = require('mammoth');
    } catch (err) {
      console.error('Mammoth library not installed. Install with: npm install mammoth');
      return {
        success: false,
        text: '',
        characterCount: 0,
        wordCount: 0,
        error: 'Resume text extraction service is not available. Please contact support.'
      };
    }

    // Extract text from DOCX buffer
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    
    // Handle extraction errors
    if (result.messages && result.messages.length > 0) {
      console.warn('Mammoth extraction warnings:', result.messages);
    }

    const extractedText = result.value || '';

    // Clean up text: remove extra whitespace but preserve paragraph structure
    const cleanedText = extractedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    // Calculate statistics
    const characterCount = cleanedText.length;
    const wordCount = cleanedText.split(/\s+/).filter(word => word.length > 0).length;

    return {
      success: true,
      text: cleanedText,
      characterCount,
      wordCount,
      rawText: extractedText // Keep raw text as backup
    };
  } catch (error) {
    console.error('Error extracting text from resume:', error);
    return {
      success: false,
      text: '',
      characterCount: 0,
      wordCount: 0,
      error: `Failed to extract resume text: ${error.message}`
    };
  }
};

/**
 * Validates extracted resume text for minimum content requirements
 * @param {string} text - Extracted text from resume
 * @param {number} minCharacters - Minimum required characters (default: 100)
 * @returns {Object} Validation result with validity status and message
 */
const validateExtractedText = (text = '', minCharacters = 100) => {
  if (!text || typeof text !== 'string') {
    return {
      isValid: false,
      message: 'No text content found in resume'
    };
  }

  const trimmedText = text.trim();
  
  if (trimmedText.length < minCharacters) {
    return {
      isValid: false,
      message: `Resume content is too short. Minimum ${minCharacters} characters required, found ${trimmedText.length}`
    };
  }

  return {
    isValid: true,
    message: 'Resume text is valid'
  };
};

/**
 * Prepares extracted text for GenAI processing
 * Truncates to a reasonable size and ensures proper formatting
 * @param {string} text - Extracted resume text
 * @param {number} maxLength - Maximum length to send to AI (default: 10000 chars for cost optimization)
 * @returns {string} Prepared text for GenAI API
 */
const prepareTextForAI = (text = '', maxLength = 10000) => {
  if (!text) return '';

  let prepared = text.trim();

  // Truncate if too long
  if (prepared.length > maxLength) {
    prepared = prepared.substring(0, maxLength) + '\n\n[Text truncated for processing...]';
  }

  return prepared;
};

module.exports = {
  extractTextFromDocx,
  validateExtractedText,
  prepareTextForAI
};
