import React, { useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Database,
    Link as LinkIcon,
    LifeBuoy,
    LogOut,
    Menu
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const AdminLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

    if (user?.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'KPI Dashboard', end: true },
        { path: '/admin/users', icon: Users, label: 'Users Management' },
        { path: '/admin/resources', icon: Database, label: 'Global Resources' },
        { path: '/admin/invites', icon: LinkIcon, label: 'Access Invites' },
        { path: '/admin/support', icon: LifeBuoy, label: 'Support Tickets' },
    ];

    return (
        <div className="min-h-screen bg-[var(--color-bg)] flex font-sans text-[var(--color-text)]">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:static inset-y-0 left-0 z-50 bg-[var(--color-surface)] text-[var(--color-text)] w-64 flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out border-r border-[var(--color-divider)] ${isSidebarOpen ? 'translate-x-0 md:ml-0' : '-translate-x-full md:-ml-64 md:translate-x-0'}`}>
                <div className="h-16 flex items-center px-4 font-bold text-white text-lg border-b border-[var(--color-divider)] bg-[var(--color-bg)]/30">
                    <span className="text-[var(--color-accent)] mr-2">Admin</span> Console
                </div>

                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            onClick={() => {
                                if (window.innerWidth < 768) {
                                    setIsSidebarOpen(false);
                                }
                            }}
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
                                    ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] shadow-sm'
                                    : 'hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-[var(--color-divider)]">
                    <div className="flex items-center mb-4">
                        <div className="h-8 w-8 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)] font-bold mr-3 border border-[var(--color-accent)]/30">
                            A
                        </div>
                        <div className="text-sm truncate">
                            <div className="font-medium text-white">System Admin</div>
                            <div className="text-muted text-xs truncate">{user.email}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="bg-[var(--color-surface)] border-b border-[var(--color-divider)] h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm z-10">
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 mr-4 rounded-md text-muted hover:text-white hover:bg-white/5 focus:outline-none"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <h1 className="text-lg font-semibold text-white">Mission Control</h1>
                    </div>

                    <div className="flex items-center space-x-3">
                        <NavLink
                            to="/dashboard"
                            className="text-sm font-medium text-muted hover:text-[var(--color-accent)] transition-colors mr-4"
                        >
                            Back to App
                        </NavLink>
                        <button
                            onClick={logout}
                            className="flex items-center text-sm font-medium text-muted hover:text-[#e06b6b] transition-colors"
                        >
                            <LogOut className="h-4 w-4 mr-1.5" />
                            Logout
                        </button>
                    </div>
                </header>

                {/* Dashboard Content Area */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-[var(--color-bg)]">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
