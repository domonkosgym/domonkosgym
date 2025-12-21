import { useLanguage } from "@/contexts/LanguageContext";

export const TrainHardSlogan = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-background py-12 md:py-20 px-4 md:px-12">
      <h2 className="text-[clamp(1.25rem,5vw,3.5rem)] font-black uppercase leading-tight text-center px-4">
        {t('hero.trainHard')} <span className="text-primary">{t('hero.liveBetter')}</span>
      </h2>
    </div>
  );
};
