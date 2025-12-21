import { MessageSquare, ClipboardList, Target } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import gymAction from "@/assets/hero2.jpg";

export const Process = () => {
  const { t } = useLanguage();

  const steps = [
    {
      icon: MessageSquare,
      title: t('process.step1Title'),
      description: t('process.step1Desc'),
    },
    {
      icon: ClipboardList,
      title: t('process.step2Title'),
      description: t('process.step2Desc'),
    },
    {
      icon: Target,
      title: t('process.step3Title'),
      description: t('process.step3Desc'),
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground uppercase mb-2 sm:mb-3 md:mb-4">
            {t('process.title')}
          </h2>
        </div>
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex gap-2 sm:gap-3 md:gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-1 sm:mb-2">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="order-first lg:order-last">
            <img
              src={gymAction}
              alt="Workout process"
              className="w-full h-auto max-h-[300px] sm:max-h-[400px] lg:max-h-none object-cover rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
