import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CartIcon } from "@/components/CartIcon";
import { Footer } from "@/components/Footer";

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

export default function Tudastar() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
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

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(language === 'hu' ? 'hu-HU' : language === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getTypeLabel = (type: 'DIGITAL' | 'PHYSICAL') => {
    return type === 'DIGITAL' ? t('books.digital') : t('books.physical');
  };

  const getLabels = () => {
    const labels: Record<string, Record<string, string>> = {
      hu: {
        title: 'Tudástár',
        subtitle: 'Fedezd fel a könyveimet és tananyagaimat',
        featured: 'Kiemelt',
        sale: 'Akció',
        viewDetails: 'Részletek',
        back: 'Vissza'
      },
      en: {
        title: 'Knowledge Base',
        subtitle: 'Discover my books and learning materials',
        featured: 'Featured',
        sale: 'Sale',
        viewDetails: 'View Details',
        back: 'Back'
      },
      es: {
        title: 'Base de Conocimiento',
        subtitle: 'Descubre mis libros y materiales de aprendizaje',
        featured: 'Destacado',
        sale: 'Oferta',
        viewDetails: 'Ver Detalles',
        back: 'Volver'
      }
    };
    return labels[language] || labels.hu;
  };

  const labels = getLabels();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4 md:gap-8">
            <Link to="/" className="text-foreground text-xs md:text-sm uppercase tracking-wider hover:text-primary transition">
              {t('nav.home')}
            </Link>
            <Link to="/about" className="text-foreground text-xs md:text-sm uppercase tracking-wider hover:text-primary transition">
              {t('nav.about')}
            </Link>
            <Link to="/services" className="text-foreground text-xs md:text-sm uppercase tracking-wider hover:text-primary transition">
              {t('nav.services')}
            </Link>
            <Link to="/tudastar" className="text-primary text-xs md:text-sm uppercase tracking-wider font-bold">
              {labels.title}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <CartIcon />
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground uppercase mb-2">
            {labels.title}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {labels.subtitle}
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nincs elérhető termék</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {products.map((product) => (
              <div 
                key={product.id}
                className="group cursor-pointer"
                onClick={() => navigate(`/book/${product.id}`)}
              >
                <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                  {/* Cover Image */}
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
                        <BookOpen className="w-16 h-16 text-primary/50" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {product.is_featured && (
                        <Badge className="bg-primary text-primary-foreground font-bold uppercase text-xs px-2 py-1">
                          {labels.featured}
                        </Badge>
                      )}
                      {product.is_on_sale && (
                        <Badge className="bg-destructive text-destructive-foreground font-bold uppercase text-xs px-2 py-1">
                          {labels.sale}
                        </Badge>
                      )}
                    </div>

                    {/* Product Type Badge */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded">
                        {product.product_type === 'DIGITAL' ? (
                          <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                        ) : (
                          <Package className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                        <span className="text-xs font-medium text-foreground">
                          {getTypeLabel(product.product_type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="font-bold text-base md:text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {getTitle(product)}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-4 mt-auto">
                      {product.is_on_sale && product.sale_price ? (
                        <>
                          <span className="text-lg font-bold text-primary">
                            {formatPrice(product.sale_price, product.currency)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.price_gross, product.currency)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(product.price_gross, product.currency)}
                        </span>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/book/${product.id}`);
                      }}
                    >
                      {labels.viewDetails}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
