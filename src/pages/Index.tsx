import { useState } from "react";
import { Hero } from "@/components/Hero";
import { FeaturedIn } from "@/components/FeaturedIn";
import { Bio } from "@/components/Bio";
import { Process } from "@/components/Process";
import { B2BSection } from "@/components/B2BSection";
import { BooksSection } from "@/components/BooksSection";
import { FAQ } from "@/components/FAQ";
import { ContactForm } from "@/components/ContactForm";
import { CookieBanner } from "@/components/CookieBanner";
import { CalComModal } from "@/components/CalComModal";
import { Footer } from "@/components/Footer";

const Index = () => {
  const [showCalModal, setShowCalModal] = useState(false);

  const handleBookConsultation = () => {
    setShowCalModal(true);
  };

  const handleViewPricing = () => {
    window.location.href = "/services";
  };

  return (
    <div className="min-h-screen bg-background">
      <Hero
        onBookConsultation={handleBookConsultation}
        onViewPricing={handleViewPricing}
      />
      <div id="books">
        <BooksSection />
      </div>
      <FeaturedIn />
      <div id="about">
        <Bio />
      </div>
      <Process />
      <B2BSection />
      <FAQ />
      <ContactForm />
      <Footer />
      <CookieBanner />
      <CalComModal open={showCalModal} onOpenChange={setShowCalModal} />
    </div>
  );
};

export default Index;
