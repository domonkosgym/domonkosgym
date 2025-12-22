import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface B2BContent {
  title: string;
  description: string;
  button: string;
}

const defaultContent: Record<string, B2BContent> = {
  hu: {
    title: "Céges egészségprogram – min. 8 főtől",
    description: "Hozzuk formába a csapatot – kérj visszahívást, és kitaláljuk a nektek működő megoldást.",
    button: "Ajánlatot kérek"
  },
  en: {
    title: "Corporate wellness program – min. 8 people",
    description: "Let's get your team in shape – request a callback and we'll figure out the solution that works for you.",
    button: "Request a quote"
  },
  es: {
    title: "Programa de bienestar corporativo – min. 8 personas",
    description: "Pongamos a tu equipo en forma – solicita una llamada y encontraremos la solución que funcione para ti.",
    button: "Solicitar cotización"
  }
};

export const B2BSection = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [content, setContent] = useState<B2BContent | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .eq('section_key', 'b2b')
        .maybeSingle();

      if (!error && data) {
        const langSuffix = language === 'hu' ? '_hu' : language === 'en' ? '_en' : '_es';
        const contentField = `content${langSuffix}` as keyof typeof data;
        const titleField = `title${langSuffix}` as keyof typeof data;
        
        try {
          const rawContent = data[contentField] as string;
          const title = data[titleField] as string;
          if (rawContent) {
            const parsed = JSON.parse(rawContent);
            setContent({
              title: title || parsed.title || defaultContent[language].title,
              description: parsed.description || defaultContent[language].description,
              button: parsed.button || defaultContent[language].button
            });
          } else {
            setContent({
              title: title || defaultContent[language].title,
              description: defaultContent[language].description,
              button: defaultContent[language].button
            });
          }
        } catch {
          setContent(defaultContent[language]);
        }
      } else {
        setContent(defaultContent[language]);
      }
    };

    fetchData();
  }, [language]);

  const displayContent = content || defaultContent[language];

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-8 bg-secondary/50">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center space-y-3 sm:space-y-4 md:space-y-6">
          <div className="flex justify-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground uppercase px-2 sm:px-4">
            {displayContent.title}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-2 sm:px-4">
            {displayContent.description}
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/b2b")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-xs sm:text-sm md:text-base"
          >
            {displayContent.button}
          </Button>
        </div>
      </div>
    </section>
  );
};
