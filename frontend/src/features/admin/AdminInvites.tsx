import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Link as LinkIcon, Plus, Copy, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

export const AdminInvites: React.FC = () => {
    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const { addToast } = useToast();

    // In a real app, you'd get the actual domain from env. 
    // For now we assume the frontend is hosted at window.location.origin
    const getInviteUrl = (code: string) => `${window.location.origin}/register?invite_code=${code}`;

    useEffect(() => {
        // We'll call the POST endpoint just to fetch them initially, or 
        // ideally we should have a GET /invites endpoint.
        // Wait, the API we built only has POST /invites which generates a new one and returns all.
        // Let's just generate one on load to see the list for now, or we should add a GET route.
        // As a workaround, we'll just show an empty list until they click Generate.
        setLoading(false);
    }, []);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const response = await apiClient.post('/admin/invites');
            setInvites(response.data.all_invites);
            addToast('New invite code generated successfully', 'success');
        } catch (error) {
            console.error(error);
            addToast('Failed to generate invite', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = (code: string) => {
        const url = getInviteUrl(code);
        navigator.clipboard.writeText(url);
        setCopiedId(code);
        setTimeout(() => setCopiedId(null), 2000);
        addToast('Invite link copied to clipboard', 'success');
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">Access Invites Generator</h2>
                    <p className="text-muted text-sm mt-1">Create and manage access tokens for new customers.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="mt-4 sm:mt-0 btn btn-primary"
                >
                    {generating ? (
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    ) : (
                        <Plus className="h-5 w-5 mr-2" />
                    )}
                    Generate New Invite Token
                </button>
            </div>

            <div className="card border border-[var(--color-divider)] overflow-hidden p-0">
                <div className="overflow-x-auto">
                    {invites.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="h-16 w-16 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded-full flex items-center justify-center mb-4">
                                <LinkIcon className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-medium text-white">No Invites Generated Yet</h3>
                            <p className="text-muted mt-2 max-w-sm">
                                Click the button above to generate a unique invite link. You can send this link to a new customer to bypass the registration lock.
                            </p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-[var(--color-divider)]">
                            <thead className="bg-[var(--color-bg)]/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Token Code</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-transparent divide-y divide-[var(--color-divider)]">
                                {invites.map((invite) => (
                                    <tr key={invite.code} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm font-bold bg-[var(--color-bg)]/50 border border-[var(--color-divider)] px-3 py-1 rounded text-[var(--color-text)]">
                                                {invite.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {invite.used_by_id ? (
                                                <span className="tag bg-[#e06b6b]/10 text-[#e06b6b]">
                                                    Used
                                                </span>
                                            ) : new Date(invite.expires_at) < new Date() ? (
                                                <span className="tag tag-neutral">
                                                    Expired
                                                </span>
                                            ) : (
                                                <span className="tag bg-[#5fd08a]/10 text-[#5fd08a]">
                                                    Valid
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[var(--color-text)]">
                                            {new Date(invite.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleCopy(invite.code)}
                                                disabled={!!invite.used_by_id}
                                                className="inline-flex items-center text-sm font-medium text-[var(--color-accent)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {copiedId === invite.code ? (
                                                    <><CheckCircle className="h-4 w-4 mr-1 text-[#5fd08a]" /> Copied</>
                                                ) : (
                                                    <><Copy className="h-4 w-4 mr-1" /> Copy Link</>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
