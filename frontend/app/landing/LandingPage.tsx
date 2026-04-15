'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "./sections/Header";
import HeroSection from "./sections/HeroSection";
import FeatureCollaboration from "./sections/FeatureCollaboration";
import FeatureFocus from "./sections/FeatureFocus";
import ComparisonSection from "./sections/ComparisonSection";
import UseCasesSection from "./sections/UseCasesSection";
import TestimonialsSection from "./sections/TestimonialsSection";
import CTASection from "./sections/CTASection";
import FAQSection from "./sections/FAQSection";
import Footer from "./sections/Footer";

const TOKEN_KEY = 'gathering_token';

export default function LandingPage() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const onJoin = () => {
    router.push("/signin");
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-gray-100 bg-white dark:bg-gray-900 selection:bg-teal-100 dark:selection:bg-teal-900 selection:text-teal-900 dark:selection:text-teal-100 transition-colors duration-300">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-white focus:text-teal-600 top-4 left-4"
      >
        Skip to content
      </a>

      <Header isScrolled={isScrolled} onJoin={onJoin} />

      <main id="main-content">
        <HeroSection onJoin={onJoin} />
        <FeatureCollaboration onJoin={onJoin} />
        <FeatureFocus />
        <ComparisonSection />
        <UseCasesSection />
        <TestimonialsSection />
        <CTASection onJoin={onJoin} />
        <FAQSection />
      </main>

      <Footer />
    </div>
  );
}
