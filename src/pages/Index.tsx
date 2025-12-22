import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Hero } from "@/components/Hero";
import { FeaturedIn } from "@/components/FeaturedIn";
import { Bio } from "@/components/Bio";
import { Process } from "@/components/Process";
import { B2BSection } from "@/components/B2BSection";
import { BooksSection } from "@/components/BooksSection";
import { TrainHardSlogan } from "@/components/TrainHardSlogan";
import { FAQ } from "@/components/FAQ";
import { ContactForm } from "@/components/ContactForm";
import { CookieBanner } from "@/components/CookieBanner";
import { CalComModal } from "@/components/CalComModal";
import { Footer } from "@/components/Footer";

type LandingSection = {
  section_key: string;
  is_active: boolean;
  sort_order: number;
};

const Index = () => {
  const [showCalModal, setShowCalModal] = useState(false);

  const { data: sections } = useQuery({
    queryKey: ["landing-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_page_sections")
        .select("section_key, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as LandingSection[];
    },
  });

  const handleBookConsultation = () => {
    setShowCalModal(true);
  };

  const handleViewPricing = () => {
    window.location.href = "/services";
  };

  const isSectionActive = (key: string): boolean => {
    if (!sections) return true; // Show all by default while loading
    return sections.some((s) => s.section_key === key);
  };

  // Build sections in order from database
  const renderSections = () => {
    if (!sections) {
      // Default order while loading
      return (
        <>
          <Hero onBookConsultation={handleBookConsultation} onViewPricing={handleViewPricing} />
          <div id="books"><BooksSection /></div>
          <TrainHardSlogan />
          <FeaturedIn />
          <div id="about"><Bio /></div>
          <Process />
          <B2BSection />
          <FAQ />
          <ContactForm />
        </>
      );
    }

    const sectionComponents: Record<string, React.ReactNode> = {
      hero: <Hero key="hero" onBookConsultation={handleBookConsultation} onViewPricing={handleViewPricing} />,
      books: <div key="books" id="books"><BooksSection /></div>,
      train_hard: <TrainHardSlogan key="train_hard" />,
      featured_in: <FeaturedIn key="featured_in" />,
      bio: <div key="bio" id="about"><Bio /></div>,
      process: <Process key="process" />,
      b2b: <B2BSection key="b2b" />,
      faq: <FAQ key="faq" />,
      contact: <ContactForm key="contact" />,
    };

    return sections.map((section) => sectionComponents[section.section_key]);
  };

  return (
    <div className="min-h-screen bg-background">
      {renderSections()}
      <Footer />
      <CookieBanner />
      <CalComModal open={showCalModal} onOpenChange={setShowCalModal} />
    </div>
  );
};

export default Index;
