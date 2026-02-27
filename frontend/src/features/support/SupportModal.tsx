import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
            await apiClient.post('/support/', {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-sky-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-800">Fale com o Suporte</h2>
                            <p className="text-sm text-slate-500">Respondemos normalmente em algumas horas</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-2"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {success ? (
                    <div className="py-8 text-center animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Mensagem Enviada!</h3>
                        <p className="text-slate-500 mt-2">Nossa equipe responderá em breve por e-mail e através da aba de notificações do painel.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Assunto</label>
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Dúvida, problema técnico ou sugestão"
                                className="w-full"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sua Mensagem</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Descreva como podemos ajudar você hoje..."
                                className="w-full flex min-h-[120px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                required
                            />
                        </div>

                        {/* Visual attachment placeholder without actual heavy file logic for this iteration */}
                        <div className="flex items-center gap-2 text-sm text-slate-500 border border-slate-200 border-dashed rounded-md p-3 justify-center mb-6 bg-slate-50/50">
                            <Paperclip className="w-4 h-4" />
                            <span>Anexar capturas de tela estará disponível em breve.</span>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={onClose}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white"
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
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
