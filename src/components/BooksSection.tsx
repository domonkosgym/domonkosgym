import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, BookOpen, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  title_hu: string;
  title_en: string;
  title_es: string;
  description_hu: string;
  description_en: string;
  description_es: string;
  product_type: 'DIGITAL' | 'PHYSICAL';
  price_gross: number;
  currency: string;
  cover_image_url: string | null;
  is_featured: boolean;
  is_on_sale: boolean;
  sale_price: number | null;
}

export const BooksSection = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setProducts(data as Product[]);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const getTitle = (product: Product) => {
    switch (language) {
      case 'en': return product.title_en;
      case 'es': return product.title_es;
      default: return product.title_hu;
    }
  };

  const getDescription = (product: Product) => {
    switch (language) {
      case 'en': return product.description_en;
      case 'es': return product.description_es;
      default: return product.description_hu;
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(language === 'hu' ? 'hu-HU' : language === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const scrollLeft = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const scrollRight = () => {
    setCurrentIndex(Math.min(products.length - 1, currentIndex + 1));
  };

  const getSectionTitle = () => {
    switch (language) {
      case 'en': return 'Books';
      case 'es': return 'Libros';
      default: return 'Könyvek';
    }
  };

  const getSectionSubtitle = () => {
    switch (language) {
      case 'en': return 'Knowledge and inspiration for your fitness journey';
      case 'es': return 'Conocimiento e inspiración para tu viaje fitness';
      default: return 'Tudás és inspiráció a fitness utadhoz';
    }
  };

  const getTypeLabel = (type: 'DIGITAL' | 'PHYSICAL') => {
    if (type === 'DIGITAL') {
      switch (language) {
        case 'en': return 'E-book (online)';
        case 'es': return 'E-libro (en línea)';
        default: return 'E-könyv (online)';
      }
    } else {
      switch (language) {
        case 'en': return 'Physical book (offline)';
        case 'es': return 'Libro físico (offline)';
        default: return 'Fizikai könyv (offline)';
      }
    }
  };

  const getFeaturedLabel = () => {
    switch (language) {
      case 'en': return 'Featured';
      case 'es': return 'Destacado';
      default: return 'Kiemelt';
    }
  };

  const getSaleLabel = () => {
    switch (language) {
      case 'en': return 'Sale';
      case 'es': return 'Oferta';
      default: return 'Akció';
    }
  };

  const getViewDetailsLabel = () => {
    switch (language) {
      case 'en': return 'View Details';
      case 'es': return 'Ver detalles';
      default: return 'Részletek';
    }
  };

  if (loading) {
    return (
      <section className="py-4 sm:py-6 md:py-8 px-2 sm:px-4 md:px-6 bg-background">
        <div className="container mx-auto">
          <div className="animate-pulse flex flex-col items-center gap-1">
            <div className="h-4 w-24 bg-muted rounded"></div>
            <div className="h-3 w-40 bg-muted rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-4 sm:py-6 md:py-8 px-2 sm:px-4 md:px-6 bg-background">
      <div className="container mx-auto max-w-5xl">
        {/* Section Title */}
        <div className="text-center mb-3 sm:mb-4 md:mb-5">
          <div className="flex justify-center mb-1.5 sm:mb-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
            </div>
          </div>
          <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-foreground uppercase">
            {getSectionTitle()}
          </h2>
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            {getSectionSubtitle()}
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative px-6 md:px-8">
          {/* Navigation Arrows - Desktop */}
          {products.length > 4 && (
            <>
              <button
                onClick={scrollLeft}
                disabled={currentIndex === 0}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-primary/90 text-primary-foreground items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={scrollRight}
                disabled={currentIndex >= products.length - 4}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-primary/90 text-primary-foreground items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Cards Container */}
          <div className="overflow-x-auto scrollbar-hide">
            <div 
              className="flex gap-2 sm:gap-3 md:gap-4 justify-start md:justify-center pb-2"
            >
              {products.map((product) => (
                <div 
                  key={product.id}
                  className="flex-shrink-0 w-[100px] sm:w-[120px] md:w-[130px] lg:w-[140px] group cursor-pointer"
                  onClick={() => navigate(`/book/${product.id}`)}
                >
                <div className="bg-card border border-border rounded-[5px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                    {/* Cover Image - 3:4 aspect ratio for better proportions */}
                    <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                      {product.cover_image_url ? (
                        <img
                          src={product.cover_image_url}
                          alt={getTitle(product)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                          <BookOpen className="w-8 h-8 text-primary/50" />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                        {product.is_featured && (
                          <Badge className="bg-primary text-primary-foreground font-bold uppercase text-[6px] sm:text-[7px] px-1 py-0.5">
                            {getFeaturedLabel()}
                          </Badge>
                        )}
                        {product.is_on_sale && (
                          <Badge className="bg-destructive text-destructive-foreground font-bold uppercase text-[6px] sm:text-[7px] px-1 py-0.5">
                            {getSaleLabel()}
                          </Badge>
                        )}
                      </div>

                      {/* Product Type Badge */}
                      <div className="absolute bottom-1 left-1 right-1">
                        <div className="flex items-center gap-0.5 bg-background/90 backdrop-blur-sm px-1 py-0.5 rounded-[3px]">
                          {product.product_type === 'DIGITAL' ? (
                            <BookOpen className="w-2.5 h-2.5 text-primary" />
                          ) : (
                            <Package className="w-2.5 h-2.5 text-primary" />
                          )}
                          <span className="text-[6px] sm:text-[7px] font-medium text-foreground truncate">
                            {getTypeLabel(product.product_type)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-1.5 sm:p-2">
                      <h3 className="font-bold text-[8px] sm:text-[9px] md:text-[10px] text-foreground mb-0.5 line-clamp-2 leading-tight">
                        {getTitle(product)}
                      </h3>

                      {/* Price */}
                      <div className="flex items-center gap-0.5 mb-1">
                        {product.is_on_sale && product.sale_price ? (
                          <>
                            <span className="text-[10px] sm:text-xs font-bold text-primary">
                              {formatPrice(product.sale_price, product.currency)}
                            </span>
                            <span className="text-[8px] text-muted-foreground line-through">
                              {formatPrice(product.price_gross, product.currency)}
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] sm:text-xs font-bold text-primary">
                            {formatPrice(product.price_gross, product.currency)}
                          </span>
                        )}
                      </div>

                      {/* CTA Button */}
                      <Button
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-[7px] sm:text-[8px] h-5 px-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/book/${product.id}`);
                        }}
                      >
                        {getViewDetailsLabel()}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Swipe Indicator */}
          {products.length > 4 && (
            <div className="flex justify-center gap-1.5 mt-3 md:hidden">
              {products.map((_, index) => (
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
