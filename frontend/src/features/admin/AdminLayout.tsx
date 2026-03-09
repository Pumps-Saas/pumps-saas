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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
        <div className="min-h-screen bg-slate-100 flex font-sans">
            {/* Sidebar */}
            <aside className={`bg-slate-900 text-slate-300 w-64 flex-shrink-0 flex flex-col transition-all duration-300 ${isSidebarOpen ? '' : '-ml-64'}`}>
                <div className="h-16 flex items-center px-4 font-bold text-white text-lg border-b border-slate-700 bg-slate-950">
                    <span className="text-blue-500 mr-2">Admin</span> Console
                </div>

                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <div className="flex items-center mb-4">
                        <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold mr-3">
                            A
                        </div>
                        <div className="text-sm truncate">
                            <div className="font-medium text-white">System Admin</div>
                            <div className="text-slate-400 text-xs truncate">{user.email}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm z-10">
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 mr-4 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <h1 className="text-lg font-semibold text-slate-800">Mission Control</h1>
                    </div>

                    <div className="flex items-center space-x-3">
                        <NavLink
                            to="/dashboard"
                            className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mr-4"
                        >
                            Back to App
                        </NavLink>
                        <button
                            onClick={logout}
                            className="flex items-center text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
                        >
                            <LogOut className="h-4 w-4 mr-1.5" />
                            Logout
                        </button>
                    </div>
                </header>

                {/* Dashboard Content Area */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
