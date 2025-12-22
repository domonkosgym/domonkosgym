import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface FaqItem {
  id: string;
  question_hu: string;
  question_en: string;
  question_es: string;
  answer_hu: string;
  answer_en: string;
  answer_es: string;
  display_order: number;
}

export const FAQ = () => {
  const { language, t } = useLanguage();

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as FaqItem[];
    },
    staleTime: 0,
  });

  const getQuestion = (faq: FaqItem) => {
    switch (language) {
      case 'en': return faq.question_en;
      case 'es': return faq.question_es;
      default: return faq.question_hu;
    }
  };

  const getAnswer = (faq: FaqItem) => {
    switch (language) {
      case 'en': return faq.answer_en;
      case 'es': return faq.answer_es;
      default: return faq.answer_hu;
    }
  };

  if (isLoading) {
    return (
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-8">
        <div className="container mx-auto max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  if (faqs.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-8">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground uppercase">
            {t('faq.title')}
          </h2>
        </div>
        <Accordion type="single" collapsible className="space-y-2 sm:space-y-3 md:space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.id}
              value={`item-${index}`}
              className="border border-border rounded-lg px-3 sm:px-4 md:px-6 bg-card"
            >
              <AccordionTrigger className="text-left text-foreground font-semibold hover:text-primary text-xs sm:text-sm md:text-base py-2 sm:py-3 md:py-4">
                {getQuestion(faq)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base">
                {getAnswer(faq)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
