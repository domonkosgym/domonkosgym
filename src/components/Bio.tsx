import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface BioContent {
  text1: string;
  text2: string;
}

const defaultContent: Record<string, BioContent> = {
  hu: {
    text1: "Domonkos Zsolt vagyok, táplálkozási és teljesítmény-coach. Segítek úgy összeállítani az étrendedet és az edzéstervedet, hogy illeszkedjen a napjaidhoz – bonyolítás nélkül.",
    text2: "Ha szükséges, a laboreredményeidet is átbeszéljük, és ezek alapján finomítunk. A célom, hogy 14 napon belül kézhez kapd a személyre szabott tervedet, és közben érthető, emberi kommunikációra számíthass."
  },
  en: {
    text1: "I'm Zsolt Domonkos, a nutrition and performance coach. I help you create a diet and training plan that fits into your daily life – without complications.",
    text2: "If necessary, we'll review your lab results and refine accordingly. My goal is to deliver your personalized plan within 14 days, with clear and human communication throughout."
  },
  es: {
    text1: "Soy Zsolt Domonkos, entrenador de nutrición y rendimiento. Te ayudo a crear una dieta y un plan de entrenamiento que se adapte a tu vida diaria, sin complicaciones.",
    text2: "Si es necesario, revisaremos tus resultados de laboratorio y los ajustaremos en consecuencia. Mi objetivo es entregarte tu plan personalizado en 14 días, con una comunicación clara y humana."
  }
};

export const Bio = () => {
  const { language } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ["bio-section", language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .eq('section_key', 'bio')
        .maybeSingle();

      if (error || !data) {
        return {
          title: language === 'hu' ? 'Rólam' : language === 'en' ? 'About Me' : 'Sobre mí',
          content: defaultContent[language]
        };
      }

      const langSuffix = language === 'hu' ? '_hu' : language === 'en' ? '_en' : '_es';
      const contentField = `content${langSuffix}` as keyof typeof data;
      const titleField = `title${langSuffix}` as keyof typeof data;
      
      let parsedContent: BioContent;
      try {
        const rawContent = data[contentField] as string;
        parsedContent = rawContent ? JSON.parse(rawContent) : defaultContent[language];
      } catch {
        parsedContent = defaultContent[language];
      }

      return {
        title: (data[titleField] as string) || (language === 'hu' ? 'Rólam' : language === 'en' ? 'About Me' : 'Sobre mí'),
        content: parsedContent
      };
    },
    staleTime: 0,
  });

  const displayContent = data?.content || defaultContent[language];
  const displayTitle = data?.title || (language === 'hu' ? 'Rólam' : language === 'en' ? 'About Me' : 'Sobre mí');

  if (isLoading) {
    return (
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-2/3 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-8">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-3 sm:space-y-4 md:space-y-6 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground uppercase">
            {displayTitle}
          </h2>
          <div className="space-y-2 sm:space-y-3 md:space-y-4 text-sm sm:text-base md:text-lg text-muted-foreground">
            <p>{displayContent.text1}</p>
            <p>{displayContent.text2}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
