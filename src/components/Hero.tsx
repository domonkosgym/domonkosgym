import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CartIcon } from "@/components/CartIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import workoutImage from "@/assets/workout-1.jpg";

interface HeroProps {
  onBookConsultation: () => void;
  onViewPricing: () => void;
}

interface HeroContent {
  intro: string;
  slogan: string;
  slogan2: string;
  features: string[];
  cta_button: string;
  join_title: string;
  join_subtitle: string;
}

const defaultContent: Record<string, HeroContent> = {
  hu: {
    intro: "Szia, Zsolt vagyok. Táplálkozási és teljesítmény-coachként egyszerű, működő szokásokban hiszek – felesleges körök nélkül.",
    slogan: "EDDZ KEMÉNYEN!",
    slogan2: "ÉLJ JOBBAN",
    features: ["FEDEZD FEL A POTENCIÁLOD", "SZAKÉRTŐ COACHING", "EREDMÉNYORIENTÁLT PROGRAMOK", "TÁMOGATÓ KÖZÖSSÉG"],
    cta_button: "FOGLALJ HELYET",
    join_title: "CSATLAKOZZ",
    join_subtitle: "VÁLLALJ TÖBBET!"
  },
  en: {
    intro: "Hi, I'm Zsolt. As a nutrition and performance coach, I believe in simple, effective habits – no unnecessary complications.",
    slogan: "TRAIN HARD.",
    slogan2: "LIVE BETTER",
    features: ["DISCOVER YOUR POTENTIAL", "EXPERT COACHING", "RESULTS-DRIVEN PROGRAMS", "A SUPPORTIVE TRIBE"],
    cta_button: "RESERVE YOUR SPOT",
    join_title: "JOIN US",
    join_subtitle: "TAKE ON MORE!"
  },
  es: {
    intro: "Hola, soy Zsolt. Como entrenador de nutrición y rendimiento, creo en hábitos simples y efectivos.",
    slogan: "ENTRENA DURO.",
    slogan2: "VIVE MEJOR",
    features: ["DESCUBRE TU POTENCIAL", "ENTRENAMIENTO EXPERTO", "PROGRAMAS ORIENTADOS A RESULTADOS", "UNA COMUNIDAD DE APOYO"],
    cta_button: "RESERVA TU LUGAR",
    join_title: "ÚNETE",
    join_subtitle: "¡ASUME MÁS!"
  }
};

export const Hero = ({ onBookConsultation, onViewPricing }: HeroProps) => {
  const { language, t } = useLanguage();
  const { trackCTAClick } = useAnalytics();

  const { data: heroData, isLoading } = useQuery({
    queryKey: ["hero-section", language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .eq('section_key', 'hero')
        .maybeSingle();

      if (error || !data) return null;

      const langSuffix = language === 'hu' ? '_hu' : language === 'en' ? '_en' : '_es';
      const contentField = `content${langSuffix}` as keyof typeof data;
      const titleField = `title${langSuffix}` as keyof typeof data;
      const subtitleField = `subtitle${langSuffix}` as keyof typeof data;
      
      let parsedContent: HeroContent;
      try {
        const rawContent = data[contentField] as string;
        parsedContent = rawContent ? JSON.parse(rawContent) : defaultContent[language];
      } catch {
        parsedContent = defaultContent[language];
      }

      return {
        title: (data[titleField] as string) || defaultContent[language].slogan,
        subtitle: (data[subtitleField] as string) || "THE COACH",
        content: parsedContent,
        image_url: data.image_urls?.[0] || null
      };
    },
    staleTime: 0, // Always refetch
  });

  const content = heroData?.content || defaultContent[language];
  const title = heroData?.title || "DOMONKOS ZSOLT";
  const subtitle = heroData?.subtitle || "THE COACH";
  const heroImage = heroData?.image_url;

  const handleReserveClick = () => {
    trackCTAClick(content.cta_button, 'primary_cta');
    onViewPricing();
  };

  const handleViewClassesClick = () => {
    trackCTAClick(t('hero.viewClasses'), 'secondary_cta');
    onViewPricing();
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Top Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-2 sm:px-4 md:px-12 py-3 md:py-6 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
          <a href="/" className="text-foreground text-[10px] sm:text-xs md:text-sm uppercase tracking-wider hover:text-primary transition whitespace-nowrap">{t('nav.home')}</a>
          <a href="/about" className="text-foreground text-[10px] sm:text-xs md:text-sm uppercase tracking-wider hover:text-primary transition whitespace-nowrap">{t('nav.about')}</a>
          <a href="/services" className="text-foreground text-[10px] sm:text-xs md:text-sm uppercase tracking-wider hover:text-primary transition whitespace-nowrap">{t('nav.services')}</a>
          <a href="/tudastar" className="hidden sm:block text-foreground text-[10px] sm:text-xs md:text-sm uppercase tracking-wider hover:text-primary transition whitespace-nowrap">{t('nav.knowledge')}</a>
          {/* Foglalj helyet button on mobile and tablet */}
          <Button
            onClick={handleReserveClick}
            className="lg:hidden bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-[10px] sm:text-xs px-2 sm:px-4 whitespace-nowrap h-7 sm:h-8"
          >
            {content.cta_button}
          </Button>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSelector />
          <CartIcon />
          {/* Desktop button */}
          <Button
            onClick={handleReserveClick}
            className="hidden lg:block bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-xs sm:text-sm px-4 sm:px-6 whitespace-nowrap"
          >
            {content.cta_button}
          </Button>
        </div>
      </nav>

      {/* Main Hero Section */}
      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Vertical Text and Content */}
        <div className="w-full lg:w-1/2 relative flex flex-col justify-between py-20 px-6 md:px-12 min-h-[60vh] lg:min-h-screen">
          {/* Vertical text */}
          <div className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2">
            <h3 className="text-foreground text-xs md:text-sm tracking-[0.3em] uppercase font-bold [writing-mode:vertical-rl]">
              {t('hero.consultation')}
            </h3>
          </div>

          <div className="ml-6 md:ml-8 lg:ml-16 xl:ml-20 space-y-8 md:space-y-12 max-w-2xl">
            {/* Main Heading */}
            <div>
              <h1 className="text-[clamp(1.75rem,6vw,4.5rem)] font-black text-foreground uppercase leading-none mb-1">
                {title.split(' ').map((word, index) => (
                  <span key={index} className="block">{word}</span>
                ))}
              </h1>
              <p className="text-primary font-bold text-sm sm:text-base md:text-lg uppercase tracking-wider">
                {subtitle}
              </p>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-md leading-relaxed mt-4 md:mt-6">
                {content.intro}
              </p>
            </div>

            {/* Big Yellow Headline */}
            <div>
            <h2 className="text-[clamp(1.25rem,6vw,4rem)] font-black uppercase leading-tight">
              {content.slogan}
            </h2>
            </div>

            {/* Feature List */}
            <div className="space-y-3 md:space-y-4 mt-8 md:mt-12">
              {content.features.map((feature, index) => (
                <div key={index} className="border-l-2 border-foreground pl-3 md:pl-4">
                  <p className="text-foreground font-bold text-xs md:text-sm uppercase tracking-wider">{feature}</p>
                </div>
              ))}
              <div className="mt-6 md:mt-8">
                <Button
                  onClick={handleReserveClick}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-xs sm:text-sm px-4 sm:px-6"
                >
                  {content.cta_button}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Large Image */}
        <div className="w-full lg:w-1/2 relative min-h-[40vh] lg:min-h-screen bg-muted">
          {isLoading && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <img
            src={heroImage || workoutImage}
            alt="Training Hard"
            className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
            loading="eager"
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-background py-12 md:py-16 text-center px-4">
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-foreground uppercase mb-2">
          {content.join_title}
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm uppercase tracking-wider">
          {content.join_subtitle}
        </p>
      </div>

    </div>
  );
};
