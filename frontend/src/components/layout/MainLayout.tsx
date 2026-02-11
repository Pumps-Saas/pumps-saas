import React from 'react';
import { Activity, Settings, FileText, Menu } from 'lucide-react';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">
                            Pumps <span className="text-blue-600">SaaS</span>
                        </span>
                    </div>

                    <nav className="hidden md:flex space-x-8">
                        <a href="#" className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors">
                            Calculator
                        </a>
                        <a href="#" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                            Projects
                        </a>
                        <a href="#" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                            Settings
                        </a>
                    </nav>

                    <div className="flex items-center space-x-4">
                        <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
                            JD
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-sm text-slate-500">
                        &copy; {new Date().getFullYear()} Pumps SaaS. Engineering Precision.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
