import { createWorker, Worker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

let worker: Worker | null = null;

// Initialize Tesseract worker
export const initializeOCR = async (): Promise<Worker> => {
  if (worker) return worker;

  worker = await createWorker();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  
  // Configure for medical documents
  await worker.setParameters({
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:/%-() ',
    preserve_interword_spaces: '1',
  });

  return worker;
};

// Extract text from image file
export const extractTextFromImage = async (file: File): Promise<OCRResult> => {
  try {
    const worker = await initializeOCR();
    
    const { data } = await worker.recognize(file);
    
    return {
      text: data.text,
      confidence: data.confidence,
      words: data.words.map(word => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox
      }))
    };
  } catch (error) {
    throw new Error(`OCR processing failed: ${error.message}`);
  }
};

// Extract text from PDF using canvas
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    // For client-side PDF processing, we would need pdf.js
    // This is a simplified implementation that assumes server-side processing
    console.warn('PDF processing should be handled server-side for better performance');
    
    // Convert first page to image and process with OCR
    return await convertPDFToImageAndOCR(file);
  } catch (error) {
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
};

// Helper function to convert PDF to image for OCR
const convertPDFToImageAndOCR = async (file: File): Promise<string> => {
  // This would require pdf.js integration
  // For now, we'll throw an error suggesting server-side processing
  throw new Error('PDF processing requires server-side handling');
};

// Detect document type based on extracted text
export const detectDocumentType = (text: string): 'blood_test' | 'prescription' | 'x-ray' | 'general' => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('prescription') || lowerText.includes('medication') || lowerText.includes('dosage')) {
    return 'prescription';
  }
  
  if (lowerText.includes('blood') || lowerText.includes('glucose') || lowerText.includes('cholesterol') || 
      lowerText.includes('hemoglobin') || lowerText.includes('platelet')) {
    return 'blood_test';
  }
  
  if (lowerText.includes('x-ray') || lowerText.includes('radiograph') || lowerText.includes('imaging')) {
    return 'x-ray';
  }
  
  return 'general';
};

// Clean up worker when done
export const terminateOCR = async (): Promise<void> => {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
};

// Progress callback type for OCR processing
export type OCRProgressCallback = (progress: number) => void;

// Process multiple files with progress tracking
export const processMultipleFiles = async (
  files: File[], 
  onProgress?: OCRProgressCallback
): Promise<OCRResult[]> => {
  const results: OCRResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      const result = await extractTextFromImage(file);
      results.push(result);
      
      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100);
      }
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error);
      // Continue with other files
    }
  }
  
  return results;
};
