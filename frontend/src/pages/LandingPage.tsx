import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import { HeroSection } from '../components/landing/HeroSection';
import { PricingSection } from '../components/landing/PricingSection';
import { ContactForm } from '../components/landing/ContactForm';
import { Header } from '../components/landing/Header';
import { Footer } from '../components/landing/Footer';

export const LandingPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { addToast } = useToast();

    useEffect(() => {
        if (searchParams.get('expired') === 'true') {
            addToast("Seu Passe Mensal Expirou. Por favor, faça uma nova assinatura para liberar seu painel.", "error");
            searchParams.delete('expired');
            setSearchParams(searchParams);
        }
    }, [searchParams, addToast, setSearchParams]);

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
