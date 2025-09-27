import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "default_key" 
});

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
  try {
    const prompt = `
    You are a medical AI assistant. Analyze the following medical report and provide a structured analysis.
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
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a medical AI assistant specializing in report analysis. Always provide accurate, helpful information while noting that this is for informational purposes and not a substitute for professional medical advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as MedicalAnalysis;
  } catch (error) {
    throw new Error(`Failed to analyze medical report: ${error.message}`);
  }
}

export async function extractMedicationInfo(prescriptionText: string): Promise<MedicationInfo[]> {
  try {
    const prompt = `
    Extract medication information from the following prescription text.
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
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a pharmaceutical AI assistant. Extract accurate medication information and provide safety details."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"medications": []}');
    return result.medications || [];
  } catch (error) {
    throw new Error(`Failed to extract medication info: ${error.message}`);
  }
}

export async function generateHealthSummary(reports: any[], medications: any[]): Promise<string> {
  try {
    const prompt = `
    Generate a comprehensive health summary based on the following medical reports and current medications.
    Make it suitable for sharing with healthcare providers.
    
    Recent Reports: ${JSON.stringify(reports)}
    Current Medications: ${JSON.stringify(medications)}
    
    Provide a clear, professional summary that includes:
    - Current health status
    - Key trends and changes
    - Current medication regimen
    - Areas of concern or improvement
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a medical summary AI. Create professional, comprehensive health summaries for healthcare provider communication."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    throw new Error(`Failed to generate health summary: ${error.message}`);
  }
}

export async function translateMedicalText(text: string, targetLanguage: string): Promise<string> {
  try {
    const prompt = `
    Translate the following medical text to ${targetLanguage}.
    Maintain medical accuracy and use appropriate medical terminology in the target language.
    
    Text to translate:
    ${text}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a medical translator. Translate medical content accurately to ${targetLanguage} while preserving medical meaning and terminology.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    return response.choices[0].message.content || text;
  } catch (error) {
    console.error(`Translation failed: ${error.message}`);
    return text; // Return original text if translation fails
  }
}
