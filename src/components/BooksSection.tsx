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
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-8 bg-background">
        <div className="container mx-auto">
          <div className="animate-pulse flex justify-center">
            <div className="h-8 w-48 bg-muted rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-8 bg-background">
      <div className="container mx-auto max-w-6xl">
        {/* Section Title */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground uppercase">
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
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-primary/90 text-primary-foreground items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={scrollRight}
                disabled={currentIndex >= products.length - 1}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-primary/90 text-primary-foreground items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Cards Container */}
          <div className="overflow-hidden">
            <div 
              className="flex gap-4 sm:gap-6 transition-transform duration-300 ease-out"
              style={{ 
                transform: `translateX(-${currentIndex * (100 / Math.min(products.length, 3))}%)`,
              }}
            >
              {products.map((product) => (
                <div 
                  key={product.id}
                  className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px] group cursor-pointer"
                  onClick={() => navigate(`/book/${product.id}`)}
                >
                  <div className="bg-card border border-border rounded-[5px] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
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
                          <BookOpen className="w-16 h-16 text-primary/50" />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.is_featured && (
                          <Badge className="bg-primary text-primary-foreground font-bold uppercase text-[10px]">
                            {getFeaturedLabel()}
                          </Badge>
                        )}
                        {product.is_on_sale && (
                          <Badge className="bg-destructive text-destructive-foreground font-bold uppercase text-[10px]">
                            {getSaleLabel()}
                          </Badge>
                        )}
                      </div>

                      {/* Product Type Badge */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-[5px]">
                          {product.product_type === 'DIGITAL' ? (
                            <BookOpen className="w-4 h-4 text-primary" />
                          ) : (
                            <Package className="w-4 h-4 text-primary" />
                          )}
                          <span className="text-[10px] sm:text-xs font-medium text-foreground">
                            {getTypeLabel(product.product_type)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5">
                      <h3 className="font-bold text-sm sm:text-base text-foreground mb-2 line-clamp-2">
                        {getTitle(product)}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-4 line-clamp-2">
                        {getDescription(product)}
                      </p>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-4">
                        {product.is_on_sale && product.sale_price ? (
                          <>
                            <span className="text-lg sm:text-xl font-bold text-primary">
                              {formatPrice(product.sale_price, product.currency)}
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(product.price_gross, product.currency)}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg sm:text-xl font-bold text-primary">
                            {formatPrice(product.price_gross, product.currency)}
                          </span>
                        )}
                      </div>

                      {/* CTA Button */}
                      <Button
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-xs"
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
          {products.length > 1 && (
            <div className="flex justify-center gap-2 mt-6 md:hidden">
              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
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
