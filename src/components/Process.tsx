import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import gymAction from "@/assets/hero2.jpg";
import { 
  Star, MessageCircle, ClipboardList, TrendingUp, Target, Users, 
  Zap, Heart, Award, CheckCircle, Calendar, Dumbbell, Apple, Brain,
  MessageSquare
} from "lucide-react";

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Star,
  MessageCircle,
  MessageSquare,
  ClipboardList,
  TrendingUp,
  Target,
  Users,
  Zap,
  Heart,
  Award,
  CheckCircle,
  Calendar,
  Dumbbell,
  Apple,
  Brain,
};

interface ProcessStep {
  id: string;
  title_hu: string;
  title_en: string;
  title_es: string;
  description_hu: string;
  description_en: string;
  description_es: string;
  icon_name: string;
  sort_order: number;
}

export const Process = () => {
  const { language, t } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ["process-section"],
    queryFn: async () => {
      const [stepsResult, imageResult] = await Promise.all([
        supabase
          .from('process_steps')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('site_images')
          .select('image_url')
          .eq('image_key', 'process_section')
          .maybeSingle()
      ]);

      return {
        steps: stepsResult.data || [],
        sectionImage: imageResult.data?.image_url || null
      };
    },
    staleTime: 0,
  });

  const steps = data?.steps || [];
  const sectionImage = data?.sectionImage;

  const getTitle = (step: ProcessStep) => {
    switch (language) {
      case 'en': return step.title_en;
      case 'es': return step.title_es;
      default: return step.title_hu;
    }
  };

  const getDescription = (step: ProcessStep) => {
    switch (language) {
      case 'en': return step.description_en;
      case 'es': return step.description_es;
      default: return step.description_hu;
    }
  };

  const getIcon = (iconName: string) => {
    return ICON_MAP[iconName] || Star;
  };

  if (isLoading) {
    return (
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 md:px-8">
        <div className="container mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (steps.length === 0) {
    return null;
  }

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
            {steps.map((step) => {
              const Icon = getIcon(step.icon_name);
              return (
                <div key={step.id} className="flex gap-2 sm:gap-3 md:gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-1 sm:mb-2">
                      {getTitle(step)}
                    </h3>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                      {getDescription(step)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="order-first lg:order-last">
            <img
              src={sectionImage || gymAction}
              alt="Workout process"
              className="w-full h-auto max-h-[300px] sm:max-h-[400px] lg:max-h-none object-cover rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
