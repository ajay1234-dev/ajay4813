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
  let worker;
  let timeoutId: NodeJS.Timeout;
  
  try {
    console.log('Creating Tesseract worker...');
    worker = await createWorker('eng');
    
    // Configure Tesseract for medical documents
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:/%-() ',
      preserve_interword_spaces: '1',
    });

    console.log('Running OCR recognition...');
    
    // Add timeout with proper cleanup to prevent hanging
    const { data } = await new Promise<any>((resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('OCR timeout after 30 seconds'));
      }, 30000);
      
      worker.recognize(imageBuffer)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
    
    console.log('OCR completed successfully');
    await worker.terminate();

    return {
      text: data.text || 'No text detected',
      confidence: data.confidence || 0,
      words: data.words?.map((word: any) => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox
      })) || []
    };
  } catch (error) {
    console.error('OCR processing failed:', error);
    
    // Clear timeout if it exists
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Safely terminate worker if it exists
    if (worker) {
      try {
        await worker.terminate();
      } catch (terminateError) {
        console.error('Failed to terminate worker:', terminateError);
      }
    }
    
    // Throw error to be handled by calling function
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    console.log('Parsing PDF... Buffer size:', pdfBuffer.length);
    
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    });
    
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    console.log('PDF parsing completed successfully. Extracted text length:', fullText.length);
    return fullText.trim() || 'No text found in PDF';
  } catch (error) {
    console.error('PDF text extraction failed. Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw new Error(`PDF text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
