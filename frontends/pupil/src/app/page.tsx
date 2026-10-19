'use client';

import React from 'react';
import { Header } from '../components/common/Header';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesGrid } from '../components/landing/FeaturesGrid';
import { ThemePreview } from '../components/landing/ThemePreview';
import { FaqSection } from '../components/landing/FaqSection';
import { Footer } from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesGrid />
        <ThemePreview />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}

