import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "hi", name: "हिन्दी" },
  { code: "de", name: "Deutsch" },
  { code: "zh", name: "中文" },
];

export default function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const { toast } = useToast();

  const translateMutation = useMutation({
    mutationFn: async ({ text, targetLanguage }: { text: string; targetLanguage: string }) => {
      const response = await apiRequest("POST", "/api/translate", { text, targetLanguage });
      return response.json();
    },
    onSuccess: (data) => {
      // This would be used to translate content on the page
      console.log("Translation:", data.translatedText);
    },
    onError: (error) => {
      toast({
        title: "Translation Error",
        description: "Failed to translate content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    
    // Here you would implement actual translation logic
    // For now, we'll just show a toast
    const selectedLang = languages.find(lang => lang.code === languageCode);
    if (selectedLang) {
      toast({
        title: "Language Changed",
        description: `Interface language changed to ${selectedLang.name}`,
      });
    }
  };

  return (
    <div className="relative">
      <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger 
          className="w-32 text-sm" 
          data-testid="language-selector"
        >
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem 
              key={language.code} 
              value={language.code}
              data-testid={`language-${language.code}`}
            >
              {language.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
