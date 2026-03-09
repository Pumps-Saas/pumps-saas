import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet } from 'lucide-react';

export const Header = () => {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Droplet className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">Pumps SaaS</span>
                </div>
                <nav className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Recursos</a>
                    <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Preços</a>
                    <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Contato</a>
                </nav>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Entrar</Link>
                    <Link to="/register" className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700 disabled:pointer-events-none disabled:opacity-50">
                        Começar Agora
                    </Link>
                </div>
            </div>
        </header>
    );
};
