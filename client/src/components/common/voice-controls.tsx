import { Button } from "@/components/ui/button";
import { useVoice } from "@/hooks/use-voice";
import { Volume2, VolumeX } from "lucide-react";

export default function VoiceControls() {
  const { isVoiceEnabled, toggleVoice } = useVoice();

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleVoice}
        title={isVoiceEnabled ? "Disable Voice Narration" : "Enable Voice Narration"}
        data-testid="voice-toggle"
      >
        {isVoiceEnabled ? (
          <Volume2 className="h-5 w-5 text-primary" />
        ) : (
          <VolumeX className="h-5 w-5" />
        )}
      </Button>
      
      {isVoiceEnabled && (
        <div className="voice-indicator flex items-center space-x-2">
          <Volume2 className="h-4 w-4 pulse-slow" />
          <span className="text-sm font-medium">Voice Active</span>
        </div>
      )}
    </div>
  );
}
