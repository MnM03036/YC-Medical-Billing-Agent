import { createWorker } from 'tesseract.js';

export async function processFileForOCR(file: File, setProgress?: (msg: string) => void): Promise<string> {
  const isPdf = file.type === 'application/pdf';
  let imageSource: string | File = file;

  if (isPdf) {
    if (setProgress) setProgress("Converting PDF to Image...");
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    
    // Using a Uint8Array prevents some Next.js polyfill errors with raw ArrayBuffer
    const data = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const page = await pdf.getPage(1); // Extracting text primarily from the first page containing the line items
    
    // High scale ensures Tesseract has enough pixel density to read the text
    const viewport = page.getViewport({ scale: 2.5 }); 
    
    // Create an off-screen canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) throw new Error("Could not create canvas context");
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext: any = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;
    
    // Fallback to textContent extraction as well if we want later, but Tesseract handles strict scanned PDFs better
    imageSource = canvas.toDataURL('image/png');
  }

  if (setProgress) setProgress("Initializing OCR Engine...");

  
  // Create Tesseract Worker with logger for progress
  const worker = await createWorker('eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text' && setProgress) {
        setProgress(`Extracting Text: ${Math.round(m.progress * 100)}%`);
      }
    }
  });

  const ret = await worker.recognize(imageSource);
  await worker.terminate();
  
  if (setProgress) setProgress("Extraction Complete");
  return ret.data.text;
}

// Quick validation logic (Task 2.3 - Basic Parsing Logic)
// This will parse the OCR dump for basic entities to pass to the AI
export function extractStructuredData(ocrText: string) {
  // Medical codes usually resemble 5 digits (CPT) e.g. 99213, or J-codes e.g. J1745
  const cptCodeRegex = /\b([A-Z]?\d{4}[A-Z0-9]?)\b/g;
  const amountsRegex = /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
  const datesRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g;

  const codes = [...ocrText.matchAll(cptCodeRegex)].map(m => m[1]);
  const amounts = [...ocrText.matchAll(amountsRegex)].map(m => m[1]);
  const dates = [...ocrText.matchAll(datesRegex)].map(m => m[1]);

  return {
    rawText: ocrText,
    extractedCodes: [...new Set(codes)], // remove duplicates
    extractedAmounts: amounts,
    dates: dates
  };
}
