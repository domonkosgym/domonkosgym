import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'hu' as const, flag: '🇭🇺', name: 'Magyar' },
    { code: 'en' as const, flag: '🇬🇧', name: 'English' },
    { code: 'es' as const, flag: '🇪🇸', name: 'Español' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as 'hu' | 'en' | 'es')}>
      <SelectTrigger className="w-[60px] h-8 sm:h-9 text-base sm:text-lg bg-background border-border">
        <SelectValue>
          <span className="text-base sm:text-lg">
            {currentLanguage?.flag}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-card border-border z-50">
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code} className="cursor-pointer">
            <span className="flex items-center gap-2 text-base">
              {lang.flag} {lang.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
