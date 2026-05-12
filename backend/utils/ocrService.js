const Tesseract = require('tesseract.js');

/**
 * Extracts text from an image (PNG, JPG, JPEG) using OCR.
 * Basic handwriting OCR supported using Tesseract.
 * 
 * @param {string} filePath - Absolute path to the image file
 * @returns {Promise<{ extractedText: string, confidence: number }>}
 */
async function extractTextFromImage(filePath) {
  try {
    const worker = await Tesseract.createWorker('eng');
    
    // Recognize text in the image
    const { data: { text, confidence } } = await worker.recognize(filePath);
    
    // Terminate worker to free up memory
    await worker.terminate();

    return {
      extractedText: text.trim(),
      confidence: confidence
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image via OCR.');
  }
}

module.exports = { extractTextFromImage };
