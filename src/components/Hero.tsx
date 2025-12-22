import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import workoutImage from "@/assets/workout-1.jpg";

interface HeroProps {
  onBookConsultation: () => void;
  onViewPricing: () => void;
}

export const Hero = ({ onBookConsultation, onViewPricing }: HeroProps) => {
  const { t } = useLanguage();
  const { trackCTAClick } = useAnalytics();

  const handleReserveClick = () => {
    trackCTAClick(t('hero.reserveSpot'), 'primary_cta');
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
          {/* Foglalj helyet button on mobile and tablet */}
          <Button
            onClick={handleReserveClick}
            className="lg:hidden bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-[10px] sm:text-xs px-2 sm:px-4 whitespace-nowrap h-7 sm:h-8"
          >
            {t('hero.reserveSpot')}
          </Button>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSelector />
          {/* Desktop button */}
          <Button
            onClick={handleReserveClick}
            className="hidden lg:block bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-xs sm:text-sm px-4 sm:px-6 whitespace-nowrap"
          >
            {t('hero.reserveSpot')}
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
              <h1 className="text-[clamp(1.5rem,8vw,5rem)] font-black text-foreground uppercase leading-none mb-1">
                {t('hero.name')}
              </h1>
              <p className="text-primary font-bold text-sm sm:text-base md:text-lg uppercase tracking-wider">
                {t('hero.subtitle')}
              </p>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-md leading-relaxed mt-4 md:mt-6">
                {t('hero.intro')}
              </p>
            </div>

            {/* Big Yellow Headline */}
            <div>
            <h2 className="text-[clamp(1.25rem,6vw,4rem)] font-black uppercase leading-tight">
              {t('hero.trainHard')}
            </h2>
            </div>

            {/* Feature List */}
            <div className="space-y-3 md:space-y-4 mt-8 md:mt-12">
              <div className="border-l-2 border-foreground pl-3 md:pl-4">
                <p className="text-foreground font-bold text-xs md:text-sm uppercase tracking-wider">{t('hero.discoverPotential')}</p>
              </div>
              <div className="border-l-2 border-foreground pl-3 md:pl-4">
                <p className="text-foreground font-bold text-xs md:text-sm uppercase tracking-wider">{t('hero.expertCoaching')}</p>
              </div>
              <div className="border-l-2 border-foreground pl-3 md:pl-4">
                <p className="text-foreground font-bold text-xs md:text-sm uppercase tracking-wider">{t('hero.resultsDriven')}</p>
              </div>
              <div className="border-l-2 border-foreground pl-3 md:pl-4">
                <p className="text-foreground font-bold text-xs md:text-sm uppercase tracking-wider">{t('hero.supportiveTribe')}</p>
              </div>
              <div className="mt-6 md:mt-8">
                <Button
                  onClick={handleReserveClick}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-xs sm:text-sm px-4 sm:px-6"
                >
                  {t('hero.reserveSpot')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Large Image */}
        <div className="w-full lg:w-1/2 relative min-h-[40vh] lg:min-h-screen">
          <img
            src={workoutImage}
            alt="Training Hard"
            className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-background py-12 md:py-16 text-center px-4">
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-foreground uppercase mb-2">
          {t('hero.joinUs')}
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm uppercase tracking-wider">
          {t('hero.takeMore')}
        </p>
      </div>

    </div>
  );
};
