import React, { useState } from 'react';

export const ContactForm = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus('loading');

        const form = e.currentTarget;
        const formData = new FormData(form);
        const data = {
            first_name: formData.get('first-name') as string,
            last_name: formData.get('last-name') as string,
            email: formData.get('email') as string,
            message: formData.get('message') as string,
        };

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
            const response = await fetch(`${API_URL}/payments/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                setStatus('success');
                form.reset();
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    return (
        <section id="contact" className="bg-slate-50 py-24 sm:py-32">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Fale com Vendas</h2>
                    <p className="mt-4 text-lg text-slate-600">
                        Tem dúvidas sobre planos sob medida ou integração? Envie uma mensagem.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label htmlFor="first-name" className="block text-sm font-semibold leading-6 text-slate-900">Nome</label>
                            <div className="mt-2">
                                <input type="text" name="first-name" id="first-name" required className="block w-full rounded-md border-0 px-3.5 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="last-name" className="block text-sm font-semibold leading-6 text-slate-900">Sobrenome</label>
                            <div className="mt-2">
                                <input type="text" name="last-name" id="last-name" required className="block w-full rounded-md border-0 px-3.5 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="email" className="block text-sm font-semibold leading-6 text-slate-900">E-mail corporativo</label>
                            <div className="mt-2">
                                <input type="email" name="email" id="email" required className="block w-full rounded-md border-0 px-3.5 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="message" className="block text-sm font-semibold leading-6 text-slate-900">Mensagem</label>
                            <div className="mt-2">
                                <textarea name="message" id="message" rows={4} required className="block w-full rounded-md border-0 px-3.5 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"></textarea>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className="rounded-md bg-blue-600 px-8 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                        >
                            {status === 'loading' ? 'Enviando...' : status === 'success' ? 'Enviado!' : 'Enviar mensagem'}
                        </button>
                    </div>
                    {status === 'success' && (
                        <p className="mt-4 text-sm text-emerald-600 text-center">Mensagem enviada com sucesso! Entraremos em contato em breve.</p>
                    )}
                </form>
            </div>
        </section>
    );
};
