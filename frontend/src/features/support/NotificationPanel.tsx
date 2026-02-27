import { useState, useEffect } from 'react';
import { Bell, X, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/api/client';

export const NotificationPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchTickets = async () => {
        try {
            setIsLoading(true);
            const res = await apiClient.get('/support/');
            // Sort by newest first
            const sorted = res.data.sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setTickets(sorted);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchTickets();
        }
    }, [isOpen]);

    // Check for unread messages (assuming open tickets or tickets with admin replies)
    const activeTicketsCount = tickets.filter(t => t.status === 'open').length;

    return (
        <div className="relative">
            {/* Bell Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-sky-600 transition-colors rounded-md hover:bg-slate-100"
            >
                <Bell className="w-5 h-5" />
                {activeTicketsCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Invisible overlay to close when clicking outside */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-semibold text-slate-800">Suporte ({tickets.length})</h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto p-2">
                            {isLoading ? (
                                <div className="p-4 text-center text-slate-400 text-sm">Carregando mensagens...</div>
                            ) : tickets.length === 0 ? (
                                <div className="p-6 text-center text-slate-400 flex flex-col items-center">
                                    <MessageCircle className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-sm">Nenhuma mensagem ou ticket aberto.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {tickets.map(ticket => (
                                        <div key={ticket.id} className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-sky-200 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-medium text-slate-800 text-sm truncate pr-4" title={ticket.subject}>
                                                    #{ticket.id} {ticket.subject}
                                                </h4>
                                                {ticket.status === 'open' ? (
                                                    <span className="shrink-0 flex items-center gap-1 text-[10px] uppercase font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                                                        <Clock className="w-3 h-3" /> Aberto
                                                    </span>
                                                ) : (
                                                    <span className="shrink-0 flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                                        <CheckCircle2 className="w-3 h-3" /> Fechado
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-2 mt-3 pt-3 border-t border-slate-50">
                                                {ticket.messages?.map((msg: any) => (
                                                    <div key={msg.id} className={`text-xs p-2 rounded-md ${msg.sender_type === 'admin' ? 'bg-sky-50 text-sky-900 border border-sky-100' : 'bg-slate-50 text-slate-600'}`}>
                                                        <div className="font-semibold mb-1 opacity-75">
                                                            {msg.sender_type === 'admin' ? 'Engenharia (Suporte)' : 'Você'}
                                                        </div>
                                                        <div className="whitespace-pre-wrap">{msg.message}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
