import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award, Target, Heart, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Footer } from "@/components/Footer";

interface AboutSection {
  id: string;
  section_key: string;
  title_hu: string;
  title_en: string;
  title_es: string;
  content_hu: string;
  content_en: string;
  content_es: string;
  image_urls: string[];
  sort_order: number;
}

const sectionIcons: Record<string, any> = {
  intro: Target,
  history: History,
  achievements: Award,
  why_me: Heart,
};

const AboutContent = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("about_sections")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (!error && data) {
        setSections(data);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const getTitle = (section: AboutSection) => {
    switch (language) {
      case 'en': return section.title_en;
      case 'es': return section.title_es;
      default: return section.title_hu;
    }
  };

  const getContent = (section: AboutSection) => {
    switch (language) {
      case 'en': return section.content_en;
      case 'es': return section.content_es;
      default: return section.content_hu;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('nav.home')}
          </Button>
          <LanguageSelector />
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-foreground uppercase mb-4">
            {language === 'hu' ? 'Rólam' : language === 'es' ? 'Sobre Mí' : 'About Me'}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {language === 'hu' 
              ? 'Ismerd meg a történetemet, az eredményeimet és azt, hogy miért érdemes velem dolgoznod.'
              : language === 'es'
              ? 'Conoce mi historia, mis logros y por qué deberías trabajar conmigo.'
              : 'Learn about my story, my achievements, and why you should work with me.'}
          </p>
        </div>
      </section>

      {/* Main Content - Sections */}
      <main className="pb-20">
        {sections.map((section, index) => {
          const Icon = sectionIcons[section.section_key] || Target;
          const isEven = index % 2 === 0;
          const hasImages = section.image_urls && section.image_urls.length > 0;

          return (
            <section 
              key={section.id} 
              className={`py-16 ${isEven ? 'bg-background' : 'bg-muted/30'}`}
            >
              <div className="container mx-auto px-4">
                <div className={`grid lg:grid-cols-2 gap-12 items-center ${!isEven ? 'lg:grid-flow-dense' : ''}`}>
                  {/* Content Side */}
                  <div className={!isEven ? 'lg:col-start-2' : ''}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                        {getTitle(section)}
                      </h2>
                    </div>
                    
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      {getContent(section).split('\n\n').map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-muted-foreground leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Images Side */}
                  <div className={`${!isEven ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                    {hasImages ? (
                      <div className={`grid gap-4 ${section.image_urls.length > 1 ? 'grid-cols-2' : ''}`}>
                        {section.image_urls.slice(0, 4).map((url, imgIndex) => (
                          <div 
                            key={imgIndex}
                            className={`rounded-2xl overflow-hidden shadow-xl ${
                              section.image_urls.length === 1 ? 'aspect-[4/3]' : 
                              section.image_urls.length === 3 && imgIndex === 0 ? 'col-span-2 aspect-video' :
                              'aspect-square'
                            }`}
                          >
                            <img
                              src={url}
                              alt={`${getTitle(section)} ${imgIndex + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Icon className="w-24 h-24 text-primary/30" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* CTA Section */}
        <section className="py-20 bg-primary/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {language === 'hu' ? 'Készen állsz a változásra?' : language === 'es' ? '¿Listo para el cambio?' : 'Ready for Change?'}
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              {language === 'hu' 
                ? 'Vedd fel velem a kapcsolatot és kezdjük el közösen az utadat a jobb önmagad felé!'
                : language === 'es'
                ? '¡Contáctame y comencemos juntos tu viaje hacia una mejor versión de ti!'
                : "Get in touch and let's start your journey to a better you together!"}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/services')} className="text-lg px-8">
                {language === 'hu' ? 'Szolgáltatások' : language === 'es' ? 'Servicios' : 'Services'}
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/')} className="text-lg px-8">
                {language === 'hu' ? 'Kapcsolat' : language === 'es' ? 'Contacto' : 'Contact'}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default function About() {
  return (
    <LanguageProvider>
      <AboutContent />
    </LanguageProvider>
  );
}
