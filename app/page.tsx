import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/homepage/Hero";
import { FeatureSection1 } from "@/components/homepage/FeatureSection1";
import { FeatureSection2 } from "@/components/homepage/FeatureSection2";
import { Testimonial } from "@/components/homepage/Testimonial";
import { BottomCTA } from "@/components/homepage/BottomCTA";

export default function HomePage() {
  return (
    <>
      <main className="flex-1">
        <Hero />
        <FeatureSection1 />
        <FeatureSection2 />
        <Testimonial />
        <BottomCTA />
      </main>
      <Footer />
    </>
  );
}
