import { createWorker } from 'tesseract.js';

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

export async function extractTextFromImage(imageBuffer: Buffer): Promise<OCRResult> {
  const worker = await createWorker();
  
  try {
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    // Configure Tesseract for medical documents
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:/%-() ',
      preserve_interword_spaces: '1',
    });

    const { data } = await worker.recognize(imageBuffer);
    
    await worker.terminate();

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
    await worker.terminate();
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  // For PDF processing, we'll use a simple text extraction
  // In a real implementation, you might want to use pdf-parse or similar
  try {
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(pdfBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

export function detectDocumentType(text: string): 'blood_test' | 'prescription' | 'x-ray' | 'general' {
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
}
