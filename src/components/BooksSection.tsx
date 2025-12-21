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
      <section className="py-6 sm:py-8 md:py-10 px-3 sm:px-4 md:px-8 bg-background">
        <div className="container mx-auto">
          <div className="animate-pulse flex justify-center">
            <div className="h-6 w-32 bg-muted rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-6 sm:py-8 md:py-10 px-3 sm:px-4 md:px-8 bg-background">
      <div className="container mx-auto max-w-4xl">
        {/* Section Title */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex justify-center mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
          </div>
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground uppercase">
            {getSectionTitle()}
          </h2>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Arrows - Desktop */}
          {products.length > 1 && (
            <>
              <button
                onClick={scrollLeft}
                disabled={currentIndex === 0}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-7 h-7 rounded-full bg-primary/90 text-primary-foreground items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={scrollRight}
                disabled={currentIndex >= products.length - 1}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-7 h-7 rounded-full bg-primary/90 text-primary-foreground items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Cards Container */}
          <div className="overflow-hidden">
            <div 
              className="flex gap-3 sm:gap-4 transition-transform duration-300 ease-out justify-center"
              style={{ 
                transform: `translateX(-${currentIndex * (100 / Math.min(products.length, 4))}%)`,
              }}
            >
              {products.map((product) => (
                <div 
                  key={product.id}
                  className="flex-shrink-0 w-[140px] sm:w-[150px] md:w-[160px] group cursor-pointer"
                  onClick={() => navigate(`/book/${product.id}`)}
                >
                <div className="bg-card border border-border rounded-[5px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                    {/* Cover Image - 9:16 aspect ratio */}
                    <div className="relative aspect-[9/16] bg-muted overflow-hidden">
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
                      <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                        {product.is_featured && (
                          <Badge className="bg-primary text-primary-foreground font-bold uppercase text-[8px] px-1.5 py-0.5">
                            {getFeaturedLabel()}
                          </Badge>
                        )}
                        {product.is_on_sale && (
                          <Badge className="bg-destructive text-destructive-foreground font-bold uppercase text-[8px] px-1.5 py-0.5">
                            {getSaleLabel()}
                          </Badge>
                        )}
                      </div>

                      {/* Product Type Badge */}
                      <div className="absolute bottom-1.5 left-1.5 right-1.5">
                        <div className="flex items-center gap-1 bg-background/90 backdrop-blur-sm px-1.5 py-1 rounded-[5px]">
                          {product.product_type === 'DIGITAL' ? (
                            <BookOpen className="w-3 h-3 text-primary" />
                          ) : (
                            <Package className="w-3 h-3 text-primary" />
                          )}
                          <span className="text-[8px] font-medium text-foreground truncate">
                            {getTypeLabel(product.product_type)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-2 sm:p-2.5">
                      <h3 className="font-bold text-[10px] sm:text-xs text-foreground mb-1 line-clamp-2">
                        {getTitle(product)}
                      </h3>

                      {/* Price */}
                      <div className="flex items-center gap-1 mb-2">
                        {product.is_on_sale && product.sale_price ? (
                          <>
                            <span className="text-xs sm:text-sm font-bold text-primary">
                              {formatPrice(product.sale_price, product.currency)}
                            </span>
                            <span className="text-[10px] text-muted-foreground line-through">
                              {formatPrice(product.price_gross, product.currency)}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs sm:text-sm font-bold text-primary">
                            {formatPrice(product.price_gross, product.currency)}
                          </span>
                        )}
                      </div>

                      {/* CTA Button */}
                      <Button
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-[9px] h-6 px-2"
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
