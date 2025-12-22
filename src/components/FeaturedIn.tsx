import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedLink {
  id: string;
  title_hu: string;
  title_en: string;
  title_es: string;
  description_hu: string | null;
  description_en: string | null;
  description_es: string | null;
  url: string;
  cover_image_url: string | null;
  is_youtube: boolean;
}

export const FeaturedIn = () => {
  const { language, t } = useLanguage();
  const [links, setLinks] = useState<FeaturedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchLinks = async () => {
      const { data, error } = await supabase
        .from('featured_links')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setLinks(data);
      }
      setLoading(false);
    };

    fetchLinks();
  }, []);

  const getTitle = (link: FeaturedLink) => {
    switch (language) {
      case 'en': return link.title_en;
      case 'es': return link.title_es;
      default: return link.title_hu;
    }
  };

  const getDescription = (link: FeaturedLink) => {
    switch (language) {
      case 'en': return link.description_en;
      case 'es': return link.description_es;
      default: return link.description_hu;
    }
  };

  const scrollLeft = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const scrollRight = () => {
    setCurrentIndex(Math.min(links.length - 1, currentIndex + 1));
  };

  if (loading) {
    return (
      <section className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-8 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="h-6 w-32 bg-muted rounded"></div>
            <div className="h-4 w-48 bg-muted rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  if (links.length === 0) {
    return null;
  }

  return (
    <section className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-8 bg-secondary/30">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-center text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
          {t('featuredIn.title')}
        </h2>
        <p className="text-center text-xs sm:text-sm md:text-base text-muted-foreground mb-6 sm:mb-8 md:mb-12">
          {t('featuredIn.subtitle')}
        </p>
        
        {/* Carousel Container */}
        <div className="relative px-8 md:px-12">
          {/* Navigation Arrows */}
          {links.length > 4 && (
            <>
              <button
                onClick={scrollLeft}
                disabled={currentIndex === 0}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-primary/90 text-primary-foreground items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={scrollRight}
                disabled={currentIndex >= links.length - 4}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-primary/90 text-primary-foreground items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Cards Container */}
          <div className="overflow-hidden">
            <div className="flex gap-4 sm:gap-6 justify-start md:justify-center">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex-shrink-0 w-[200px] sm:w-[240px] md:w-[260px] lg:w-[280px] bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {link.is_youtube ? (
                      <div className="w-full h-full flex items-center justify-center bg-red-600">
                        <svg className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </div>
                    ) : link.cover_image_url ? (
                      <img
                        src={link.cover_image_url}
                        alt={getTitle(link)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <ExternalLink className="w-10 h-10 text-primary/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors mb-1 line-clamp-1">
                      {getTitle(link)}
                    </h3>
                    {getDescription(link) && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {getDescription(link)}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Mobile Swipe Indicator */}
          {links.length > 2 && (
            <div className="flex justify-center gap-1.5 mt-4 md:hidden">
              {links.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
