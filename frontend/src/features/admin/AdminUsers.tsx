import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Shield, ShieldOff, Mail, Calendar, Loader2 } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<number | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await apiClient.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error(error);
            addToast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleAccess = async (userId: number) => {
        setToggling(userId);
        try {
            const res = await apiClient.post(`/admin/users/${userId}/toggle-status`);
            addToast(res.data.message, 'success');
            // Update local state instead of refetching
            setUsers(users.map(u => u.id === userId ? { ...u, is_active: res.data.is_active } : u));
        } catch (error: any) {
            addToast(error.response?.data?.detail || 'Failed to toggle status', 'error');
        } finally {
            setToggling(null);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Users Management</h2>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User / Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Subscription</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Activity Stats</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Access Control</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center border border-indigo-200">
                                                <span className="text-indigo-700 font-bold">{user.email.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-slate-900 flex items-center">
                                                    {user.email}
                                                    {user.role === 'admin' && (
                                                        <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full">
                                                            ADMIN
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500 flex items-center mt-1">
                                                    <Mail className="h-3 w-3 mr-1" /> Contact Logged
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col space-y-1">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit
                                                ${user.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                                    user.subscription_status === 'trial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                                                {user.subscription_status.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center mt-1">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                Ends: {user.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString() : 'Lifetime'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center space-x-4">
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-bold text-slate-700">{user.stats.projects}</span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Projects</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-bold text-slate-700">{user.stats.scenarios}</span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Sims</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-bold text-blue-600">{user.stats.tickets}</span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Tickets</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => toggleAccess(user.id)}
                                            disabled={toggling === user.id || user.role === 'admin'}
                                            className={`inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${user.is_active
                                                ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
                                                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                                } ${user.role === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {toggling === user.id ? (
                                                <Loader2 className="animate-spin h-4 w-4" />
                                            ) : user.is_active ? (
                                                <>
                                                    <Shield className="h-4 w-4 mr-2" />
                                                    Access Granted
                                                </>
                                            ) : (
                                                <>
                                                    <ShieldOff className="h-4 w-4 mr-2" />
                                                    Access Blocked
                                                </>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
