"use client";

import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { Benefits } from "@/components/landing/Benefits";
import { Niches } from "@/components/landing/Niches";
import { Plans } from "@/components/landing/Plans";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0F172A] overflow-hidden">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <DashboardPreview />
      <Benefits />
      <Niches />
      <Plans />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
