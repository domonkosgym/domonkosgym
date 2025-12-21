import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface ServiceCardProps {
  name: string;
  description: string;
  price: number;
  featured?: boolean;
  onSelect: () => void;
}

export const ServiceCard = ({
  name,
  description,
  price,
  featured,
  onSelect,
}: ServiceCardProps) => {
  const { t } = useLanguage();

  return (
    <Card className={`relative p-3 sm:p-4 md:p-6 bg-card transition-all duration-300 flex flex-col h-full ${
      featured
        ? "border-2 border-primary hover:shadow-[0_0_20px_rgba(212,255,0,0.2)] scale-105"
        : "border-border hover:border-muted"
    }`}>
      {featured && (
        <Badge className="absolute -top-3 left-3 sm:left-4 md:left-6 bg-primary text-primary-foreground animate-pulse text-[10px] sm:text-xs">
          {t('services.featured')}
        </Badge>
      )}
      <div className="space-y-2 sm:space-y-3 md:space-y-4 flex flex-col flex-grow">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground min-h-[2rem] sm:min-h-[2.5rem] md:min-h-[3rem] line-clamp-2">{name}</h3>
        <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm flex-grow min-h-[2.5rem] sm:min-h-[3rem] line-clamp-3">{description}</p>
        <div className="space-y-1 sm:space-y-2 mt-auto">
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
            {price.toLocaleString('hu-HU')} Ft
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">{t('services.netPrice')}</p>
        </div>
        <Button
          onClick={onSelect}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-xs sm:text-sm"
        >
          {t('services.selectBtn')}
        </Button>
      </div>
    </Card>
  );
};
