import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { LifeBuoy, Filter, Search, MessageCircle, Mail, Clock } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

export const AdminSupport: React.FC = () => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const [ticketsRes, usersRes] = await Promise.all([
                apiClient.get('/admin/tickets'),
                apiClient.get('/admin/users')
            ]);

            const userMap = usersRes.data.reduce((acc: any, u: any) => {
                acc[u.id] = u.email;
                return acc;
            }, {});

            const processedTickets = ticketsRes.data.map((t: any) => ({
                ...t,
                user_email: userMap[t.user_id] || "Unknown"
            }));

            // Sort by newest globally
            const sorted = processedTickets.sort((a: any, b: any) => {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            setTickets(sorted);
        } catch (error) {
            console.error(error);
            addToast('Failed to load tickets', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
    }

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center">
                        <LifeBuoy className="h-6 w-6 mr-3 text-[var(--color-accent)]" />
                        Global Support Inbox
                    </h2>
                    <p className="text-muted text-sm mt-1">Read and audit all support inquiries sent by users.</p>
                </div>
                <div className="flex space-x-2">
                    <button className="btn btn-secondary p-2.5">
                        <Filter className="h-5 w-5" />
                    </button>
                    <div className="relative">
                        <input type="text" placeholder="Search tickets..." className="input pl-9 w-64" />
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                    </div>
                </div>
            </div>

            <div className="flex-1 card border border-[var(--color-divider)] p-0 overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1">
                    {tickets.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                            <div className="h-16 w-16 bg-[var(--color-bg)]/50 text-muted rounded-full flex items-center justify-center mb-4 border border-[var(--color-divider)]">
                                <MessageCircle className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-medium text-white">Inbox Zero</h3>
                            <p className="text-muted mt-2 max-w-sm">
                                There are no active support tickets in the system. Your users seem to be running their simulations perfectly.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-[var(--color-divider)]">
                            {tickets.map((ticket) => (
                                <li key={ticket.id} className="p-6 hover:bg-white/5 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 h-10 w-10 bg-[#eab308]/10 rounded-full flex items-center justify-center border border-[#eab308]/30 mt-1">
                                                <Mail className="h-5 w-5 text-[#eab308]" />
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-base font-bold text-white flex items-center">
                                                        {ticket.subject}
                                                        <span className="ml-3 tag tag-neutral">
                                                            Ticket #{ticket.id}
                                                        </span>
                                                        <span className={`ml-2 tag ${ticket.status === 'open' ? 'bg-[#5fd08a]/10 text-[#5fd08a]' : 'tag-neutral'}`}>
                                                            {ticket.status.toUpperCase()}
                                                        </span>
                                                    </h4>
                                                </div>
                                                <div className="mt-1 flex items-center text-sm text-[var(--color-text)] opacity-80">
                                                    <span className="font-medium mr-2">From User ID: {ticket.user_id} ({ticket.user_email})</span>
                                                </div>

                                                <div className="mt-4 space-y-4">
                                                    {ticket.messages.map((msg: any, idx: number) => (
                                                        <div key={idx} className={`p-4 rounded-lg text-sm border ${msg.sender_type === 'admin' ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/20 ml-8' : 'bg-[var(--color-bg)]/30 border-[var(--color-divider)] mr-8'}`}>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className={`font-bold ${msg.sender_type === 'admin' ? 'text-[var(--color-accent)]' : 'text-white'}`}>
                                                                    {msg.sender_type === 'admin' ? 'Support Rep (Admin)' : 'Customer'}
                                                                </span>
                                                                <span className="flex items-center text-xs text-muted">
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    {new Date(msg.created_at).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-white whitespace-pre-wrap">{msg.message}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};
