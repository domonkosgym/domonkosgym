import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ServiceCard } from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/Footer";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  featured: boolean;
  slug: string;
}

export default function Services() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
    
    // Realtime subscription
    const channel = supabase
      .channel('services-public-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services'
        },
        () => {
          loadServices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("category", { ascending: true })
      .order("price", { ascending: true });
    
    if (!error && data) {
      setServices(data);
    }
    setLoading(false);
  };

  const getServicesByCategory = (category: string) => {
    return services.filter(s => s.category === category);
  };

  const handleSelectService = (slug: string) => {
    navigate(`/checkout/${slug}`);
  };

  const handleFreeConsultation = () => {
    // Navigate to checkout with free consultation slug
    navigate("/checkout/free-consultation");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-2 sm:px-4 md:px-12 py-3 md:py-6 border-b border-border gap-2">
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
          <a href="/" className="text-foreground text-[10px] sm:text-xs md:text-sm uppercase tracking-wider hover:text-primary transition whitespace-nowrap">{t('nav.home')}</a>
          <a href="/#about" className="text-foreground text-[10px] sm:text-xs md:text-sm uppercase tracking-wider hover:text-primary transition whitespace-nowrap">{t('nav.about')}</a>
          <a href="/services" className="text-primary text-[10px] sm:text-xs md:text-sm uppercase tracking-wider font-bold whitespace-nowrap">{t('nav.services')}</a>
          {/* Foglalj helyet button on mobile and tablet */}
          <Button
            onClick={handleFreeConsultation}
            className="lg:hidden bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-[10px] sm:text-xs px-2 sm:px-4 whitespace-nowrap h-7 sm:h-8"
          >
            {t('hero.reserveSpot')}
          </Button>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSelector />
          {/* Desktop button */}
          <Button
            onClick={handleFreeConsultation}
            className="hidden lg:block bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-xs sm:text-sm px-4 sm:px-6 whitespace-nowrap"
          >
            {t('hero.reserveSpot')}
          </Button>
        </div>
      </nav>

      {/* Services Content */}
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-12 sm:py-16 md:py-20 lg:py-24">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground uppercase mb-3 sm:mb-4 md:mb-6 text-center">
          {t('services.title')}
        </h1>
        <p className="text-center text-muted-foreground mb-8 sm:mb-12 md:mb-16 text-sm sm:text-base md:text-lg px-2 sm:px-4">
          {t('services.description')}
        </p>

        {/* Free Consultation - Keep as static */}
        <div className="max-w-2xl mx-auto mb-12 sm:mb-16 md:mb-20 px-2 sm:px-4">
          <Card className="relative p-4 sm:p-6 md:p-8 bg-gradient-to-br from-card to-secondary border-[3px] border-primary shadow-[0_0_40px_rgba(212,255,0,0.4)] hover:shadow-[0_0_60px_rgba(212,255,0,0.6)] transition-all duration-300">
            <Badge className="absolute -top-3 left-4 sm:left-6 md:left-8 bg-primary text-primary-foreground text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-1 font-bold">
              {t('services.freeBadge')}
            </Badge>
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t('services.freeTitle')}</h2>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg">{t('services.freeDesc')}</p>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary drop-shadow-[0_0_15px_rgba(212,255,0,0.5)]">
                  0 Ft
                </p>
              </div>
              <Button
                onClick={handleFreeConsultation}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 font-bold uppercase text-sm sm:text-base md:text-lg py-4 sm:py-5 md:py-6 transition-transform"
              >
                {t('services.bookNow')}
              </Button>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-muted-foreground text-sm sm:text-base">Betöltés...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-muted-foreground text-sm sm:text-base">Jelenleg nincsenek elérhető szolgáltatások.</p>
          </div>
        ) : (
          <>
            {/* Consultations */}
            {getServicesByCategory("Tanácsadás").length > 0 && (
              <section className="mb-12 sm:mb-16 md:mb-20 px-2 sm:px-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground uppercase mb-4 sm:mb-6 md:mb-8">{t('services.consultations')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {getServicesByCategory("Tanácsadás").map((service) => (
                    <ServiceCard
                      key={service.id}
                      name={service.name}
                      description={service.description}
                      price={service.price}
                      featured={service.featured}
                      onSelect={() => handleSelectService(service.slug)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Nutrition Plans */}
            {getServicesByCategory("Táplálkozási terv").length > 0 && (
              <section className="mb-12 sm:mb-16 md:mb-20 px-2 sm:px-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground uppercase mb-4 sm:mb-6 md:mb-8">{t('services.nutritionPlans')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {getServicesByCategory("Táplálkozási terv").map((service) => (
                    <ServiceCard
                      key={service.id}
                      name={service.name}
                      description={service.description}
                      price={service.price}
                      featured={service.featured}
                      onSelect={() => handleSelectService(service.slug)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Workout Plans */}
            {getServicesByCategory("Edzésterv").length > 0 && (
              <section className="mb-12 sm:mb-16 md:mb-20 px-2 sm:px-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground uppercase mb-4 sm:mb-6 md:mb-8">{t('services.workoutPlans')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {getServicesByCategory("Edzésterv").map((service) => (
                    <ServiceCard
                      key={service.id}
                      name={service.name}
                      description={service.description}
                      price={service.price}
                      featured={service.featured}
                      onSelect={() => handleSelectService(service.slug)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Combined Packages */}
            {getServicesByCategory("Kombinált csomag").length > 0 && (
              <section className="mb-12 sm:mb-16 md:mb-20 px-2 sm:px-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground uppercase mb-4 sm:mb-6 md:mb-8">{t('services.packages')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {getServicesByCategory("Kombinált csomag").map((service) => (
                    <ServiceCard
                      key={service.id}
                      name={service.name}
                      description={service.description}
                      price={service.price}
                      featured={service.featured}
                      onSelect={() => handleSelectService(service.slug)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* VAT Note */}
        <div className="mt-6 sm:mt-8 md:mt-12 text-center px-2 sm:px-4">
          <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm">
            {t('services.vat')}
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
