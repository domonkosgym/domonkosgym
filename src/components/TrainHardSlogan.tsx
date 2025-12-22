import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface SloganContent {
  text: string;
}

export const TrainHardSlogan = () => {
  const { language, t } = useLanguage();

  const { data: content } = useQuery({
    queryKey: ["train-hard-section", language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .eq('section_key', 'train_hard')
        .maybeSingle();

      if (error || !data) return null;

      const langSuffix = language === 'hu' ? '_hu' : language === 'en' ? '_en' : '_es';
      const contentField = `content${langSuffix}` as keyof typeof data;
      
      try {
        const rawContent = data[contentField] as string;
        if (rawContent) {
          return JSON.parse(rawContent) as SloganContent;
        }
      } catch {
        // fallback
      }
      return null;
    },
    staleTime: 0,
  });

  // Parse the text to split into two parts for styling
  const displayText = content?.text || `${t('hero.trainHard')} ${t('hero.liveBetter')}`;
  const parts = displayText.split(/(!|\.|¡)/);
  
  // Find where to split for the primary color
  const firstPart = parts.length > 1 ? parts.slice(0, 2).join('') : displayText.split(' ').slice(0, 2).join(' ');
  const secondPart = parts.length > 1 ? parts.slice(2).join('') : displayText.split(' ').slice(2).join(' ');

  return (
    <div className="bg-background py-12 md:py-20 px-4 md:px-12">
      <h2 className="text-[clamp(1.25rem,5vw,3.5rem)] font-black uppercase leading-tight text-center px-4">
        {firstPart} <span className="text-primary">{secondPart}</span>
      </h2>
    </div>
  );
};
