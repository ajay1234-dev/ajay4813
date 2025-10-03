import { GoogleGenAI } from "@google/genai";

let gemini: GoogleGenAI | null = null;

if (process.env.GEMINI_API_KEY) {
  gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} else {
  console.warn('Warning: GEMINI_API_KEY not set - AI analysis will be disabled');
}

export interface MedicalAnalysis {
  keyFindings: Array<{
    parameter: string;
    value: string;
    normalRange: string;
    status: 'normal' | 'abnormal' | 'borderline';
    explanation: string;
  }>;
  summary: string;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  nextSteps: string[];
}

export interface MedicationInfo {
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  sideEffects: string[];
  interactions: string[];
  genericAlternatives: string[];
}

export async function analyzeMedicalReport(reportText: string): Promise<MedicalAnalysis> {
  if (!gemini) {
    return createFallbackAnalysis(reportText);
  }

  try {
    const systemInstruction = "You are a medical AI assistant specializing in report analysis. Always provide accurate, helpful information while noting that this is for informational purposes and not a substitute for professional medical advice.";
    
    const prompt = `You are a medical AI assistant. Analyze the following medical report and provide a structured analysis.
Extract key findings, identify abnormal values, and provide plain language explanations.

Medical Report Text:
${reportText}

Please respond with JSON in this exact format:
{
  "keyFindings": [
    {
      "parameter": "parameter name",
      "value": "actual value",
      "normalRange": "normal range",
      "status": "normal|abnormal|borderline",
      "explanation": "simple explanation"
    }
  ],
  "summary": "overall summary in plain language",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "riskLevel": "low|medium|high",
  "nextSteps": ["next step 1", "next step 2"]
}`;

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            keyFindings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  parameter: { type: "string" },
                  value: { type: "string" },
                  normalRange: { type: "string" },
                  status: { type: "string" },
                  explanation: { type: "string" }
                },
                required: ["parameter", "value", "normalRange", "status", "explanation"]
              }
            },
            summary: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } },
            riskLevel: { type: "string" },
            nextSteps: { type: "array", items: { type: "string" } }
          },
          required: ["keyFindings", "summary", "recommendations", "riskLevel", "nextSteps"]
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || '{}');
    return result as MedicalAnalysis;
  } catch (error) {
    console.error('Gemini analysis failed:', error instanceof Error ? error.message : 'Unknown error');
    return createFallbackAnalysis(reportText);
  }
}

function createFallbackAnalysis(reportText: string): MedicalAnalysis {
  const lines = reportText.toLowerCase().split('\n').filter(line => line.trim());
  
  return {
    keyFindings: [{
      parameter: 'Document Analysis',
      value: 'Text extracted successfully',
      normalRange: 'N/A',
      status: 'normal',
      explanation: 'Document was processed and text was extracted. Manual review recommended for detailed analysis.'
    }],
    summary: `Medical document processed containing ${lines.length} lines of text. Professional medical review recommended for detailed analysis.`,
    recommendations: [
      'Consult with your healthcare provider for professional interpretation',
      'Keep this document for your medical records'
    ],
    riskLevel: 'low',
    nextSteps: [
      'Schedule appointment with healthcare provider if needed',
      'Ask questions about any values you don\'t understand'
    ]
  };
}

export async function extractMedicationInfo(prescriptionText: string): Promise<MedicationInfo[]> {
  if (!gemini) {
    return createFallbackMedications(prescriptionText);
  }

  try {
    const systemInstruction = "You are a pharmaceutical AI assistant. Extract accurate medication information and provide safety details.";
    
    const prompt = `Extract medication information from the following prescription text.
For each medication, provide detailed information including dosage, frequency, and safety information.

Prescription Text:
${prescriptionText}

Please respond with JSON in this exact format:
{
  "medications": [
    {
      "name": "medication name",
      "dosage": "dosage amount",
      "frequency": "how often to take",
      "instructions": "special instructions",
      "sideEffects": ["side effect 1", "side effect 2"],
      "interactions": ["interaction 1", "interaction 2"],
      "genericAlternatives": ["generic 1", "generic 2"]
    }
  ]
}`;

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            medications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  dosage: { type: "string" },
                  frequency: { type: "string" },
                  instructions: { type: "string" },
                  sideEffects: { type: "array", items: { type: "string" } },
                  interactions: { type: "array", items: { type: "string" } },
                  genericAlternatives: { type: "array", items: { type: "string" } }
                },
                required: ["name", "dosage", "frequency", "instructions", "sideEffects", "interactions", "genericAlternatives"]
              }
            }
          },
          required: ["medications"]
        }
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || '{"medications": []}');
    return result.medications || [];
  } catch (error) {
    console.error('Gemini medication extraction failed:', error instanceof Error ? error.message : 'Unknown error');
    return createFallbackMedications(prescriptionText);
  }
}

function createFallbackMedications(prescriptionText: string): MedicationInfo[] {
  const lines = prescriptionText.split('\n').filter(line => line.trim());
  const medications: MedicationInfo[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length > 5 && !trimmedLine.toLowerCase().includes('doctor') && !trimmedLine.toLowerCase().includes('patient')) {
      medications.push({
        name: trimmedLine.split(' ')[0] || 'Unknown Medication',
        dosage: 'As prescribed',
        frequency: 'As directed by physician',
        instructions: 'Please consult your healthcare provider for detailed instructions',
        sideEffects: ['Consult your pharmacist or doctor for side effect information'],
        interactions: ['Check with your healthcare provider for drug interactions'],
        genericAlternatives: ['Ask your pharmacist about generic alternatives']
      });
    }
  }

  return medications;
}

export async function generateHealthSummary(reports: any[], medications: any[]): Promise<string> {
  if (!gemini) {
    return `Health Summary\n\nRecent Reports: ${reports.length}\nCurrent Medications: ${medications.length}\n\nNote: AI-powered summaries require Gemini API key configuration.`;
  }

  try {
    const systemInstruction = "You are a medical summary AI. Create professional, comprehensive health summaries for healthcare provider communication.";
    
    const prompt = `Generate a comprehensive health summary based on the following medical reports and current medications.
Make it suitable for sharing with healthcare providers.

Recent Reports: ${JSON.stringify(reports)}
Current Medications: ${JSON.stringify(medications)}

Provide a clear, professional summary that includes:
- Current health status
- Key trends and changes
- Current medication regimen
- Areas of concern or improvement`;

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction
      },
      contents: prompt,
    });

    return response.text || '';
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate health summary: ${errorMessage}`);
  }
}

export async function translateMedicalText(text: string, targetLanguage: string): Promise<string> {
  if (!gemini) {
    console.warn('Translation requires Gemini API key');
    return text;
  }

  try {
    const systemInstruction = `You are a medical translator. Translate medical content accurately to ${targetLanguage} while preserving medical meaning and terminology.`;
    
    const prompt = `Translate the following medical text to ${targetLanguage}.
Maintain medical accuracy and use appropriate medical terminology in the target language.

Text to translate:
${text}`;

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction
      },
      contents: prompt,
    });

    return response.text || text;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Translation failed: ${errorMessage}`);
    return text;
  }
}
