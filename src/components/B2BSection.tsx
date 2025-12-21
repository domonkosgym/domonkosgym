import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const B2BSection = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-8 bg-secondary/50">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center space-y-3 sm:space-y-4 md:space-y-6">
          <div className="flex justify-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground uppercase px-2 sm:px-4">
            {t('b2b.title')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-2 sm:px-4">
            {t('b2b.description')}
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/b2b")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase text-xs sm:text-sm md:text-base"
          >
            {t('b2b.button')}
          </Button>
        </div>
      </div>
    </section>
  );
};
