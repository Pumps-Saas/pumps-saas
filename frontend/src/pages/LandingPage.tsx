import React from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { PricingSection } from '../components/landing/PricingSection';
import { ContactForm } from '../components/landing/ContactForm';
import { Header } from '../components/landing/Header';
import { Footer } from '../components/landing/Footer';

export const LandingPage = () => {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
            <Header />
            <main>
                <HeroSection />
                <PricingSection />
                <ContactForm />
            </main>
            <Footer />
        </div>
    );
};
