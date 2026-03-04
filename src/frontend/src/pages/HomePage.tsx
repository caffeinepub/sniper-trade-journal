import { SiteNav } from "@/components/SiteNav";
import { AboutSection } from "@/components/sections/AboutSection";
import { BestSellersSection } from "@/components/sections/BestSellersSection";
import { ComboDealsSection } from "@/components/sections/ComboDealsSection";
import { FooterSection } from "@/components/sections/FooterSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { MenuPreviewSection } from "@/components/sections/MenuPreviewSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { VisitUsSection } from "@/components/sections/VisitUsSection";
import { WhyChooseUsSection } from "@/components/sections/WhyChooseUsSection";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main>
        <HeroSection />
        <BestSellersSection />
        <AboutSection />
        <MenuPreviewSection />
        <ComboDealsSection />
        <WhyChooseUsSection />
        <VisitUsSection />
        <TestimonialsSection />
      </main>
      <FooterSection />
    </div>
  );
}
