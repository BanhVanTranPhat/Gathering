import type React from "react";

export interface NavItem {
  label: string;
  href: string;
}

export interface ComparisonPoint {
  text: string;
}

export interface UseCase {
  title: string;
  desc: string;
  icon: React.ReactNode;
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface LandingPageProps {
  onJoin: () => void;
}
