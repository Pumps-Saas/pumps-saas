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
            <h2 className="text-2xl font-bold text-white">Users Management</h2>

            <div className="card border border-[var(--color-divider)] overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[var(--color-divider)]">
                        <thead className="bg-[var(--color-bg)]/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">User / Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Subscription</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-muted uppercase tracking-wider">Activity Stats</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-muted uppercase tracking-wider">Storage (Est)</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">Access Control</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-[var(--color-divider)]">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-[var(--color-accent)]/20 rounded-full flex items-center justify-center border border-[var(--color-accent)]/30">
                                                <span className="text-[var(--color-accent)] font-bold">{user.email.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-white flex items-center">
                                                    {user.email}
                                                    {user.role === 'admin' && (
                                                        <span className="ml-2 tag tag-accent">
                                                            ADMIN
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted flex items-center mt-1">
                                                    <Mail className="h-3 w-3 mr-1" /> Contact Logged
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col space-y-1">
                                            <span className={`tag
                                                ${user.subscription_status === 'active' ? 'bg-[#5fd08a]/20 text-[#5fd08a]' :
                                                    user.subscription_status === 'trial' ? 'bg-[#eab308]/20 text-[#eab308]' : 'bg-[#e06b6b]/20 text-[#e06b6b]'}`}>
                                                {user.subscription_status.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-muted flex items-center mt-1">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                Ends: {user.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString() : 'Lifetime'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center space-x-4">
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-bold text-white">{user.stats.projects}</span>
                                                <span className="text-[10px] text-muted uppercase tracking-wide">Projects</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-bold text-white">{user.stats.scenarios}</span>
                                                <span className="text-[10px] text-muted uppercase tracking-wide">Sims</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-bold text-[var(--color-accent)]">{user.stats.tickets}</span>
                                                <span className="text-[10px] text-muted uppercase tracking-wide">Tickets</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center bg-[var(--color-bg)]/30 border-x border-[var(--color-divider)]">
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <span className="text-lg font-bold text-[var(--color-accent)]">{user.stats.storage_kb || 0} KB</span>
                                            <span className="text-[10px] text-muted uppercase tracking-wide mt-1">DB Size</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => toggleAccess(user.id)}
                                            disabled={toggling === user.id || user.role === 'admin'}
                                            className={`btn ${user.is_active
                                                ? 'bg-[#5fd08a]/10 border-[#5fd08a]/40 text-[#5fd08a] hover:bg-[#5fd08a]/20'
                                                : 'bg-[#e06b6b]/10 border-[#e06b6b]/40 text-[#e06b6b] hover:bg-[#e06b6b]/20'
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
