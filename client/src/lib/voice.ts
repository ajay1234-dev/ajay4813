export interface VoiceOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
  lang?: string;
}

export class VoiceService {
  private static instance: VoiceService;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'speechSynthesis' in window;
  }

  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  // Check if speech synthesis is supported
  isVoiceSupported(): boolean {
    return this.isSupported;
  }

  // Get available voices
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported) return [];
    return speechSynthesis.getVoices();
  }

  // Find voice by language
  findVoiceByLanguage(lang: string): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    return voices.find(voice => voice.lang.startsWith(lang)) || null;
  }

  // Speak text with options
  speak(text: string, options: VoiceOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set options
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 0.8;
      utterance.lang = options.lang || 'en-US';
      
      if (options.voice) {
        utterance.voice = options.voice;
      } else if (options.lang) {
        const voice = this.findVoiceByLanguage(options.lang);
        if (voice) utterance.voice = voice;
      }

      // Set up event handlers
      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      // Start speaking
      this.currentUtterance = utterance;
      speechSynthesis.speak(utterance);
    });
  }

  // Stop current speech
  stop(): void {
    if (this.isSupported && this.currentUtterance) {
      speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  // Pause current speech
  pause(): void {
    if (this.isSupported && speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
    }
  }

  // Resume paused speech
  resume(): void {
    if (this.isSupported && speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  }

  // Check if currently speaking
  isSpeaking(): boolean {
    return this.isSupported && speechSynthesis.speaking;
  }

  // Check if speech is paused
  isPaused(): boolean {
    return this.isSupported && speechSynthesis.paused;
  }

  // Speak medical report summary
  speakReportSummary(analysis: any, language = 'en-US'): Promise<void> {
    if (!analysis) {
      return this.speak("Report analysis is not available.", { lang: language });
    }

    let summary = "";
    
    if (analysis.summary) {
      summary += analysis.summary + ". ";
    }

    if (analysis.keyFindings && analysis.keyFindings.length > 0) {
      summary += "Key findings include: ";
      analysis.keyFindings.forEach((finding: any, index: number) => {
        summary += `${finding.parameter} is ${finding.value}, which is ${finding.status}`;
        if (index < analysis.keyFindings.length - 1) {
          summary += ". ";
        }
      });
      summary += ". ";
    }

    if (analysis.recommendations && analysis.recommendations.length > 0) {
      summary += "Recommendations include: ";
      summary += analysis.recommendations.join(". ") + ".";
    }

    return this.speak(summary, { lang: language });
  }

  // Speak medication reminder
  speakMedicationReminder(medication: any, language = 'en-US'): Promise<void> {
    const reminder = `It's time to take your ${medication.name}, ${medication.dosage}. ${medication.instructions || ''}`;
    return this.speak(reminder, { lang: language });
  }

  // Speak timeline event
  speakTimelineEvent(event: any, language = 'en-US'): Promise<void> {
    let summary = `${event.title}. `;
    
    if (event.description) {
      summary += event.description + ". ";
    }

    if (event.metrics) {
      summary += "Key metrics include: ";
      Object.entries(event.metrics).forEach(([key, value], index, array) => {
        summary += `${key.replace('_', ' ')} is ${value}`;
        if (index < array.length - 1) {
          summary += ", ";
        }
      });
      summary += ".";
    }

    return this.speak(summary, { lang: language });
  }
}

// Export singleton instance
export const voiceService = VoiceService.getInstance();

// Language mappings for medical terms
export const medicalTermTranslations: { [key: string]: { [key: string]: string } } = {
  'en-US': {
    'blood_pressure': 'blood pressure',
    'blood_sugar': 'blood sugar',
    'cholesterol': 'cholesterol',
    'hemoglobin': 'hemoglobin',
    'normal': 'normal',
    'abnormal': 'abnormal',
    'borderline': 'borderline',
    'high': 'high',
    'low': 'low',
  },
  'es-ES': {
    'blood_pressure': 'presión arterial',
    'blood_sugar': 'azúcar en sangre',
    'cholesterol': 'colesterol',
    'hemoglobin': 'hemoglobina',
    'normal': 'normal',
    'abnormal': 'anormal',
    'borderline': 'límite',
    'high': 'alto',
    'low': 'bajo',
  },
  'hi-IN': {
    'blood_pressure': 'रक्तचाप',
    'blood_sugar': 'रक्त शर्करा',
    'cholesterol': 'कोलेस्ट्रॉल',
    'hemoglobin': 'हीमोग्लोबिन',
    'normal': 'सामान्य',
    'abnormal': 'असामान्य',
    'borderline': 'सीमा रेखा',
    'high': 'उच्च',
    'low': 'कम',
  },
};

// Helper function to translate medical terms
export const translateMedicalTerm = (term: string, language: string): string => {
  const translations = medicalTermTranslations[language];
  return translations?.[term] || term;
};
