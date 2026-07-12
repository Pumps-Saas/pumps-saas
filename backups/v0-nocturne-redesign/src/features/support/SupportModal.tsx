import { useState } from 'react';
import { X, MessageSquare, Loader2, Paperclip } from 'lucide-react';
import { apiClient } from '@/api/client';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SupportModal = ({ isOpen, onClose }: SupportModalProps) => {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) return;

        setIsSubmitting(true);
        try {
            // Wait for the new Support endpoint logic
            await apiClient.post('/support/tickets', {
                subject,
                message,
            });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setSubject('');
                setMessage('');
                onClose();
            }, 3000);
        } catch (error) {
            console.error("Failed to submit ticket:", error);
            // In a real app we'd dispatch a toast error here
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="dialog-backdrop animate-in fade-in duration-200">
            <div className="dialog">
                <div className="flex justify-between items-center pb-3 border-b border-[var(--color-divider)]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#9184d9]/20 border border-[#9184d9] flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-[#9184d9]" />
                        </div>
                        <div>
                            <span className="dialog-title block">Fale com o Suporte</span>
                            <span className="text-xs text-muted">Respondemos normalmente em algumas horas</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted hover:text-white transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {success ? (
                    <div className="py-8 text-center animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-16 h-16 bg-[#5fd08a]/20 border border-[#5fd08a] rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-[#5fd08a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">Mensagem Enviada!</h3>
                        <p className="text-muted text-sm mt-2">Nossa equipe responderá em breve por e-mail e através da aba de notificações do painel.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
                        <div className="field">
                            <label>Assunto</label>
                            <input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Dúvida, problema técnico ou sugestão"
                                className="input"
                                required
                            />
                        </div>

                        <div className="field">
                            <label>Sua Mensagem</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Descreva como podemos ajudar você hoje..."
                                className="input min-h-[110px]"
                                required
                            />
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted border border-[var(--color-divider)] border-dashed rounded-md p-2.5 justify-center bg-[var(--color-bg)]/40">
                            <Paperclip className="w-3.5 h-3.5 text-[#9184d9]" />
                            <span>Anexar capturas de tela estará disponível em breve.</span>
                        </div>

                        <div className="dialog-actions pt-3 border-t border-[var(--color-divider)]">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting || !subject.trim() || !message.trim()}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    'Enviar Ticket'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
