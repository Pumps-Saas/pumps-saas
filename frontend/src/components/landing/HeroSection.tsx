import React from 'react';
import { Activity, Zap, Shield } from 'lucide-react';

export const HeroSection = () => {
    return (
        <section id="features" className="relative overflow-hidden bg-slate-50 pt-24 pb-32">
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#60a5fa] to-[#6366f1] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
            </div>

            <div className="container mx-auto px-4 text-center">
                <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-blue-600 ring-1 ring-inset ring-blue-600/20 mb-8 bg-blue-50/50">
                    O futuro do dimensionamento de bombas
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight">
                    Calcule e dimensione <br className="hidden md:block" />
                    com <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">precisão absoluta</span>
                </h1>
                <p className="mt-6 text-lg md:text-xl leading-8 text-slate-600 max-w-2xl mx-auto mb-10">
                    Uma plataforma SaaS completa para engenheiros e empresas.
                    Dimensione sistemas de bombeamento, gere relatórios profissionais e gerencie seus projetos com eficiência.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a href="#pricing" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all">
                        Inicie seu teste grátis
                        <span aria-hidden="true">&rarr;</span>
                    </a>
                    <a href="#features" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all">
                        Ver funcionalidades
                    </a>
                </div>

                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-left">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start transition-transform hover:-translate-y-1">
                        <div className="bg-blue-100 p-3 rounded-xl mb-4 text-blue-600">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">Cálculos Rápidos</h3>
                        <p className="text-sm text-slate-600">NPSH, perda de carga e eficiência calculados em milissegundos com algoritmos otimizados.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start transition-transform hover:-translate-y-1">
                        <div className="bg-emerald-100 p-3 rounded-xl mb-4 text-emerald-600">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">Relatórios Detalhados</h3>
                        <p className="text-sm text-slate-600">Gere relatórios em PDF com gráficos de curvas de bombas prontos para apresentar ao cliente.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start transition-transform hover:-translate-y-1">
                        <div className="bg-indigo-100 p-3 rounded-xl mb-4 text-indigo-600">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">Seguro e Confiável</h3>
                        <p className="text-sm text-slate-600">Todos os seus projetos salvos na nuvem com segurança e criptografia de ponta a ponta.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};
