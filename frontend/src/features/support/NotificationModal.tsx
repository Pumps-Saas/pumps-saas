import { useState, useEffect } from 'react';
import { Bell, X, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/api/client';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationModal = ({ isOpen, onClose }: NotificationModalProps) => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchTickets = async () => {
        try {
            setIsLoading(true);
            const res = await apiClient.get('/support/tickets');
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

    if (!isOpen) return null;

    return (
        <div className="dialog-backdrop animate-in fade-in duration-200 z-[60]">
            <div className="dialog w-full max-w-[600px]">
                <div className="flex justify-between items-center pb-3 border-b border-[var(--color-divider)]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#9184d9]/20 border border-[#9184d9] flex items-center justify-center">
                            <Bell className="w-4 h-4 text-[#9184d9]" />
                        </div>
                        <div>
                            <span className="dialog-title block">Notificações e Chamados ({tickets.length})</span>
                            <span className="text-xs text-muted">Histórico de suporte e mensagens da engenharia</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-white transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="dialog-body flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                    {isLoading ? (
                        <div className="p-4 text-center text-muted text-sm">Carregando mensagens...</div>
                    ) : tickets.length === 0 ? (
                        <div className="p-8 text-center text-muted flex flex-col items-center">
                            <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
                            <p className="text-sm">Nenhuma mensagem ou chamado em aberto.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {tickets.map(ticket => (
                                <div key={ticket.id} className="card border border-[var(--color-divider)] p-4 flex flex-col gap-3 hover:border-[#9184d9]/50 transition-colors bg-[var(--color-surface)]">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-white text-sm" title={ticket.subject}>
                                            #{ticket.id} - {ticket.subject}
                                        </h4>
                                        {ticket.status === 'open' ? (
                                            <span className="tag tag-accent shrink-0 flex items-center gap-1 text-[10px]">
                                                <Clock className="w-3 h-3" /> Aberto
                                            </span>
                                        ) : (
                                            <span className="tag tag-neutral shrink-0 flex items-center gap-1 text-[10px]">
                                                <CheckCircle2 className="w-3 h-3" /> Fechado
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-[var(--color-divider)]">
                                        {ticket.messages?.map((msg: any) => (
                                            <div key={msg.id} className={`text-xs p-3 rounded-md border ${msg.sender_type === 'admin' ? 'bg-[#9184d9]/10 border-[#9184d9]/30 text-[#e9e9ed]' : 'bg-[var(--color-bg)] border-[var(--color-divider)] text-muted'}`}>
                                                <div className={`font-semibold mb-1 ${msg.sender_type === 'admin' ? 'text-[#b5abfc]' : 'text-white'}`}>
                                                    {msg.sender_type === 'admin' ? 'Equipe de Suporte' : 'Você'}
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
        </div>
    );
};
