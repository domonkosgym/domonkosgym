import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Footer } from "@/components/Footer";

interface AboutData {
  title_hu: string;
  title_en: string;
  title_es: string;
  subtitle_hu: string | null;
  subtitle_en: string | null;
  subtitle_es: string | null;
  content_hu: string;
  content_en: string;
  content_es: string;
  image_url: string | null;
}

const AboutContent = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: aboutData, error } = await supabase
        .from("about_page")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && aboutData) {
        setData(aboutData);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const getTitle = () => {
    if (!data) return '';
    switch (language) {
      case 'en': return data.title_en;
      case 'es': return data.title_es;
      default: return data.title_hu;
    }
  };

  const getSubtitle = () => {
    if (!data) return '';
    switch (language) {
      case 'en': return data.subtitle_en;
      case 'es': return data.subtitle_es;
      default: return data.subtitle_hu;
    }
  };

  const getContent = () => {
    if (!data) return '';
    switch (language) {
      case 'en': return data.content_en;
      case 'es': return data.content_es;
      default: return data.content_hu;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Nincs elérhető tartalom</p>
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

      {/* Main Content */}
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Image */}
            {data.image_url && (
              <div className="order-first lg:order-last">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={data.image_url}
                    alt={getTitle()}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Content */}
            <div className={data.image_url ? '' : 'lg:col-span-2 max-w-3xl mx-auto'}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2">
                {getTitle()}
              </h1>
              {getSubtitle() && (
                <p className="text-lg sm:text-xl text-primary font-medium mb-6">
                  {getSubtitle()}
                </p>
              )}
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {getContent().split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-muted-foreground leading-relaxed mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Contact CTA */}
              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {language === 'hu' ? 'Lépj kapcsolatba' : language === 'es' ? 'Contáctame' : 'Get in Touch'}
                </h3>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => navigate('/services')} className="gap-2">
                    {language === 'hu' ? 'Szolgáltatások' : language === 'es' ? 'Servicios' : 'Services'}
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Mail className="w-4 h-4" />
                    info@domonkoszsolt.hu
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
