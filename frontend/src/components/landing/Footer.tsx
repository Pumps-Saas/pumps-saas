import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
    return (
        <footer className="bg-white border-t border-slate-200 py-12 text-center text-slate-500 text-sm">
            <div className="container mx-auto px-4">
                <p>&copy; {new Date().getFullYear()} Pumps SaaS. Todos os direitos reservados.</p>
                <div className="mt-4 flex justify-center gap-4">
                    <Link to="/terms" className="hover:text-slate-900 transition-colors">Termos de Uso</Link>
                    <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacidade</Link>
                </div>
            </div>
        </footer>
    );
};
