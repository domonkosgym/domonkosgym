import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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

interface SectionData {
  title: string;
  subtitle: string | null;
}

export const FeaturedIn = () => {
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch section title/subtitle from landing_page_sections
  const { data: sectionData } = useQuery({
    queryKey: ["featured-in-section", language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('title_hu, title_en, title_es, subtitle_hu, subtitle_en, subtitle_es')
        .eq('section_key', 'featured_in')
        .maybeSingle();

      if (error || !data) return { title: 'Média megjelenések', subtitle: null };

      const langSuffix = language === 'hu' ? '_hu' : language === 'en' ? '_en' : '_es';
      return {
        title: (data[`title${langSuffix}` as keyof typeof data] as string) || 'Média megjelenések',
        subtitle: data[`subtitle${langSuffix}` as keyof typeof data] as string | null
      };
    },
    staleTime: 0,
  });

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["featured-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_links')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as FeaturedLink[];
    },
    staleTime: 0,
  });

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

  // Use same card sizing as BooksSection for consistency
  const cardWidth = 193; // lg width in pixels
  const gap = 16; // gap-4 = 16px
  
  const scrollLeft = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const scrollRight = () => {
    setCurrentIndex(Math.min(links.length - 1, currentIndex + 1));
  };

  if (isLoading) {
    return (
      <section className="py-4 sm:py-6 md:py-8 px-2 sm:px-4 md:px-6 bg-secondary/30">
        <div className="container mx-auto">
          <div className="animate-pulse flex flex-col items-center gap-1">
            <div className="h-4 w-24 bg-muted rounded"></div>
            <div className="h-3 w-40 bg-muted rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  if (links.length === 0) {
    return null;
  }

  return (
    <section className="py-4 sm:py-6 md:py-8 bg-secondary/30">
      <div className="w-[90%] sm:w-full mx-auto max-w-5xl px-2 sm:px-4 md:px-6">
        {/* Section Title */}
        <div className="text-center mb-3 sm:mb-4 md:mb-5">
          <div className="flex justify-center mb-1.5 sm:mb-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground uppercase">
            {sectionData?.title || 'Média megjelenések'}
          </h2>
          {sectionData?.subtitle && (
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-0.5 sm:mt-1">
              {sectionData.subtitle}
            </p>
          )}
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Arrows */}
          {links.length > 4 && (
            <>
              <button
                onClick={scrollLeft}
                disabled={currentIndex === 0}
                className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-primary/90 text-primary-foreground items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary transition shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={scrollRight}
                disabled={currentIndex >= links.length - 4}
                className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-primary/90 text-primary-foreground items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary transition shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Cards Container */}
          <div className="overflow-hidden">
            <div 
              className="flex gap-3 sm:gap-3 md:gap-4 transition-transform duration-300 ease-out pb-2"
              style={{
                transform: `translateX(-${currentIndex * (140 + 12)}px)`,
              }}
            >
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-[140px] sm:w-[166px] md:w-[180px] lg:w-[193px] group"
                >
                  <div className="bg-card border border-border rounded-[5px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 h-full flex flex-col">
                    {/* Cover Image - Square aspect ratio */}
                    <div className="relative aspect-square bg-muted overflow-hidden flex-shrink-0">
                      {link.cover_image_url ? (
                        <img
                          src={link.cover_image_url}
                          alt={getTitle(link)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : link.is_youtube ? (
                        <div className="w-full h-full flex items-center justify-center bg-red-600">
                          <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                          <ExternalLink className="w-8 h-8 text-primary/50" />
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-2 sm:p-2.5 flex flex-col flex-grow">
                      <h3 className="font-bold text-[10px] sm:text-[11px] md:text-[12px] text-foreground mb-1 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {getTitle(link)}
                      </h3>
                      {getDescription(link) && (
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground line-clamp-2">
                          {getDescription(link)}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Mobile Scroll Hint */}
          {links.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3 md:hidden">
              {links.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentIndex === index ? 'bg-primary scale-125' : 'bg-muted-foreground/30'
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
