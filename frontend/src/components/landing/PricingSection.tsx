import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../ui/Toast';

const tiers = [
    {
        name: 'Básico',
        id: 'tier-basic',
        href: '/register?plan=basic',
        priceMonthly: 'R$ 99',
        description: 'Ideal para engenheiros autônomos.',
        features: [
            'Cálculos básicos de NPSH e perda de carga',
            'Relatórios simples em PDF',
            'Até 10 projetos salvos',
            'Suporte por e-mail'
        ],
        mostPopular: false,
    },
    {
        name: 'Profissional',
        id: 'tier-pro',
        href: '/register?plan=pro',
        priceMonthly: 'R$ 199',
        description: 'Perfeito para pequenas equipes de engenharia.',
        features: [
            'Tudo do plano Básico',
            'Curvas de bombas e gráficos avançados',
            'Projetos ilimitados',
            'Exportação em Excel',
            'Suporte prioritário'
        ],
        mostPopular: true,
    },
    {
        name: 'Empresarial',
        id: 'tier-enterprise',
        href: '#contact',
        priceMonthly: 'Personalizado',
        description: 'Para grandes empresas com necessidades complexas.',
        features: [
            'Tudo do plano Profissional',
            'API para integrações',
            'Treinamento dedicado',
            'Gerente de conta',
            'SLA garantido'
        ],
        mostPopular: false,
    },
];

export const PricingSection = () => {
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const { addToast } = useToast();

    const handleCheckout = async (e: React.MouseEvent, planId: string, href: string) => {
        if (href === '#contact') return; // let normal link handle it
        
        e.preventDefault();
        setLoadingTier(planId);
        
        const planName = planId.replace('tier-', '');
        
        try {
            const response = await api.payments.createCheckoutSessionPublic(planName);
            if (response.data && response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error(error);
            addToast("Ocorreu um erro ao iniciar o checkout seguro.", "error");
        } finally {
            setLoadingTier(null);
        }
    };

    return (
        <section id="pricing" className="bg-white py-24 sm:py-32">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-base font-semibold leading-7 text-blue-600">Preços</h2>
                    <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        Planos que crescem com você
                    </p>
                </div>
                <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-slate-600">
                    Escolha o plano ideal para as necessidades do seu projeto. Teste gratuitamente por 14 dias em qualquer plano.
                </p>

                <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 xl:gap-x-12">
                    {tiers.map((tier) => (
                        <div
                            key={tier.id}
                            className={`rounded-3xl p-8 ring-1 ${tier.mostPopular ? 'ring-2 ring-blue-600 shadow-xl' : 'ring-slate-200'
                                }`}
                        >
                            {tier.mostPopular ? (
                                <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold leading-5 text-blue-600 mb-4">
                                    Mais popular
                                </span>
                            ) : null}
                            <h3 className="text-lg font-semibold leading-8 text-slate-900">{tier.name}</h3>
                            <p className="mt-4 text-sm leading-6 text-slate-600">{tier.description}</p>
                            <p className="mt-6 flex items-baseline gap-x-1">
                                <span className="text-4xl font-bold tracking-tight text-slate-900">{tier.priceMonthly}</span>
                                {tier.priceMonthly !== 'Personalizado' && <span className="text-sm font-semibold leading-6 text-slate-600">/mês</span>}
                            </p>
                            <a
                                href={tier.href}
                                onClick={(e) => handleCheckout(e, tier.id, tier.href)}
                                aria-describedby={tier.id}
                                className={`mt-6 flex justify-center items-center rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all ${tier.mostPopular
                                        ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-500 focus-visible:outline-blue-600'
                                        : 'text-blue-600 ring-1 ring-inset ring-blue-200 hover:ring-blue-300 hover:bg-blue-50'
                                    } ${loadingTier === tier.id ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {loadingTier === tier.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                                 tier.priceMonthly === 'Personalizado' ? 'Falar com vendas' : 'Assinar plano'}
                            </a>
                            <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-slate-600">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex gap-x-3">
                                        <Check className="h-6 w-5 flex-none text-blue-600" aria-hidden="true" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
