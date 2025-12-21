import { useLanguage } from "@/contexts/LanguageContext";
import { ExternalLink } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface FeaturedItem {
  name: string;
  url: string;
  thumbnail: string;
  description?: string;
  isYouTube?: boolean;
}

export const FeaturedIn = () => {
  // Megjelenések listája
  const featuredItems: FeaturedItem[] = [
    {
      name: "YouTube csatorna",
      url: "https://www.youtube.com/channel/UCnhuGHSG9A98jpbNkDVgJTA",
      thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop",
      description: "Edzésvideók és fitness tartalmak",
      isYouTube: true
    },
    {
      name: "Profi Edzők",
      url: "https://www.profiedzok.hu",
      thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=225&fit=crop",
      description: "Szakmai megjelenés a Profi Edzők oldalon"
    },
    {
      name: "Fitness World Magazine",
      url: "https://www.fitnessworldmagazine.hu",
      thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=225&fit=crop",
      description: "Cikk a Fitness World Magazine-ban"
    },
    {
      name: "Perfect Diet",
      url: "https://www.perfectdiet.hu",
      thumbnail: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=225&fit=crop",
      description: "Táplálkozási tanácsok és megjelenés"
    },
  ];

  const { t } = useLanguage();
  const isMobile = useIsMobile();

  return (
    <section className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-8 bg-secondary/30">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-center text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
          {t('featuredIn.title')}
        </h2>
        <p className="text-center text-xs sm:text-sm md:text-base text-muted-foreground mb-6 sm:mb-8 md:mb-12">
          Válogatás a megjelenésekből
        </p>
        
        {isMobile ? (
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 sm:gap-4 pb-4">
              {featuredItems.map((item, index) => (
                <a
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-block bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 w-[240px] sm:w-[280px] flex-shrink-0"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {item.isYouTube ? (
                      <div className="w-full h-full flex items-center justify-center bg-red-600">
                        <svg className="w-14 h-14 sm:w-20 sm:h-20 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </div>
                    ) : (
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors mb-1">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 whitespace-normal">
                        {item.description}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="h-2" />
          </ScrollArea>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {featuredItems.map((item, index) => (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {item.isYouTube ? (
                    <div className="w-full h-full flex items-center justify-center bg-red-600">
                      <svg className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                  ) : (
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <ExternalLink className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors mb-1">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
