import { useLanguage } from "@/contexts/LanguageContext";

export const Bio = () => {
  const { t } = useLanguage();

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-8">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-3 sm:space-y-4 md:space-y-6 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground uppercase">
            {t('bio.title')}
          </h2>
          <div className="space-y-2 sm:space-y-3 md:space-y-4 text-sm sm:text-base md:text-lg text-muted-foreground">
            <p>
              {t('bio.text1')}
            </p>
            <p>
              {t('bio.text2')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
