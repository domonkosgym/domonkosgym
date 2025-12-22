import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CartIcon } from "@/components/CartIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onCtaClick?: () => void;
  ctaText?: string;
}

export const Header = ({ onCtaClick, ctaText }: HeaderProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

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

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/about', label: t('nav.about') },
    { path: '/services', label: t('nav.services') },
    { path: '/tudastar', label: t('nav.knowledge') },
  ];

  return (
    <nav className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-2 sm:px-4 md:px-12 py-3 md:py-6 gap-2">
      {/* Mobile hamburger menu - only visible on small screens */}
      <div className="sm:hidden">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground">
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-background border border-border">
            {navLinks.map((link) => (
              <DropdownMenuItem key={link.path} asChild>
                <a
                  href={link.path}
                  className={`w-full uppercase tracking-wider text-sm ${
                    isActive(link.path) ? 'text-primary font-bold' : 'text-foreground'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem asChild>
              <Button
                onClick={() => {
                  handleCtaClick();
                  setIsOpen(false);
                }}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-xs mt-2"
              >
                {buttonText}
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop/Tablet navigation - hidden on mobile */}
      <div className="hidden sm:flex items-center gap-2 sm:gap-4 md:gap-8">
        {navLinks.map((link) => (
          <a
            key={link.path}
            href={link.path}
            className={`text-xs md:text-sm uppercase tracking-wider transition whitespace-nowrap ${
              isActive(link.path) ? 'text-primary font-bold' : 'text-foreground hover:text-primary'
            }`}
          >
            {link.label}
          </a>
        ))}
        {/* CTA button on tablet only */}
        <Button
          onClick={handleCtaClick}
          className="lg:hidden bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-xs px-4 whitespace-nowrap h-8"
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
