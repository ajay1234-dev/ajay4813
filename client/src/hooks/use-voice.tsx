import { createContext, useContext, useState, ReactNode } from "react";

interface VoiceContext {
  isVoiceEnabled: boolean;
  toggleVoice: () => void;
  speak: (text: string) => void;
  stop: () => void;
}

const VoiceContext = createContext<VoiceContext | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    if (isVoiceEnabled) {
      stop();
    }
  };

  const speak = (text: string) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;

    // Stop any current speech
    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onend = () => {
      setCurrentUtterance(null);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setCurrentUtterance(null);
    };

    setCurrentUtterance(utterance);
    speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (currentUtterance) {
      speechSynthesis.cancel();
      setCurrentUtterance(null);
    }
  };

  return (
    <VoiceContext.Provider
      value={{
        isVoiceEnabled,
        toggleVoice,
        speak,
        stop,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
}
