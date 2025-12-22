import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CartIcon } from "@/components/CartIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";

interface HeaderProps {
  onCtaClick?: () => void;
  ctaText?: string;
}

export const Header = ({ onCtaClick, ctaText }: HeaderProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleCtaClick = () => {
    if (onCtaClick) {
      onCtaClick();
    } else {
      navigate('/services');
    }
  };

  const buttonText = ctaText || t('hero.reserveSpot');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-2 sm:px-4 md:px-12 py-3 md:py-6 gap-2">
      <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
        <a 
          href="/" 
          className={`text-[10px] sm:text-xs md:text-sm uppercase tracking-wider transition whitespace-nowrap ${
            isActive('/') && location.pathname === '/' ? 'text-primary font-bold' : 'text-foreground hover:text-primary'
          }`}
        >
          {t('nav.home')}
        </a>
        <a 
          href="/about" 
          className={`text-[10px] sm:text-xs md:text-sm uppercase tracking-wider transition whitespace-nowrap ${
            isActive('/about') ? 'text-primary font-bold' : 'text-foreground hover:text-primary'
          }`}
        >
          {t('nav.about')}
        </a>
        <a 
          href="/services" 
          className={`text-[10px] sm:text-xs md:text-sm uppercase tracking-wider transition whitespace-nowrap ${
            isActive('/services') ? 'text-primary font-bold' : 'text-foreground hover:text-primary'
          }`}
        >
          {t('nav.services')}
        </a>
        <a 
          href="/tudastar" 
          className={`text-[10px] sm:text-xs md:text-sm uppercase tracking-wider transition whitespace-nowrap ${
            isActive('/tudastar') ? 'text-primary font-bold' : 'text-foreground hover:text-primary'
          }`}
        >
          {t('nav.knowledge')}
        </a>
        {/* CTA button on mobile and tablet */}
        <Button
          onClick={handleCtaClick}
          className="lg:hidden bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-[10px] sm:text-xs px-2 sm:px-4 whitespace-nowrap h-7 sm:h-8"
        >
          {buttonText}
        </Button>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        <LanguageSelector />
        <CartIcon />
        {/* Desktop button */}
        <Button
          onClick={handleCtaClick}
          className="hidden lg:block bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-xs sm:text-sm px-4 sm:px-6 whitespace-nowrap"
        >
          {buttonText}
        </Button>
      </div>
    </nav>
  );
};
