import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground py-6 sm:py-8 px-4 sm:px-6 md:px-12">
      <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
        <div className="text-center sm:text-left">
          <h3 className="font-bold text-xs sm:text-sm uppercase mb-2 sm:mb-3">{t('footer.contact')}</h3>
          <p className="text-[10px] sm:text-xs">{t('footer.email')}</p>
          <p className="text-[10px] sm:text-xs">{t('footer.phone')}</p>
          <Link 
            to="/auth" 
            className="text-[10px] sm:text-xs opacity-70 hover:opacity-100 transition-opacity block mt-2 sm:mt-3"
          >
            Admin
          </Link>
        </div>
        <div className="text-center sm:text-left">
          <h3 className="font-bold text-xs sm:text-sm uppercase mb-2 sm:mb-3">{t('footer.openingHours')}</h3>
          <p className="text-[10px] sm:text-xs">{t('footer.monFri')}</p>
          <p className="text-[10px] sm:text-xs">{t('footer.saturday')}</p>
          <p className="text-[10px] sm:text-xs">{t('footer.sunday')}</p>
        </div>
        <div className="text-center sm:text-left sm:col-span-2 md:col-span-1">
          <h3 className="font-bold text-xs sm:text-sm uppercase mb-2 sm:mb-3">{t('footer.social')}</h3>
          <p className="text-[10px] sm:text-xs">{t('footer.instagram')}</p>
          <p className="text-[10px] sm:text-xs">{t('footer.facebook')}</p>
          <p className="text-[10px] sm:text-xs">{t('footer.linkedin')}</p>
        </div>
      </div>
    </footer>
  );
};
