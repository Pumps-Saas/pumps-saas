import React, { useState } from 'react';
import { Activity, Menu, X } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { ProjectManager } from '../../features/projects/ProjectManager';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const [showProjects, setShowProjects] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowProjects(!showProjects)}
                            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">
                            Pumps <span className="text-blue-600">SaaS</span>
                        </span>
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-700 hidden sm:block">{user?.email}</span>
                        <button
                            onClick={logout}
                            className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
                        >
                            Logout
                        </button>
                        <div className="h-8 w-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 gap-6">

                {/* Project Manager Sidebar (Desktop: Toggleable / Mobile: Overlay) */}
                {showProjects && (
                    <aside className="w-80 flex-shrink-0 h-[calc(100vh-8rem)] sticky top-24">
                        <ProjectManager />
                    </aside>
                )}

                {/* Content */}
                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>

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
