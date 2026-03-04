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
    const getInviteUrl = (code: string) => `${window.location.origin}/register?invite=${code}`;

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
                    <h2 className="text-2xl font-bold text-slate-800">Access Invites Generator</h2>
                    <p className="text-slate-500 text-sm mt-1">Create and manage access tokens for new customers.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {generating ? (
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    ) : (
                        <Plus className="h-5 w-5 mr-2" />
                    )}
                    Generate New Invite Token
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {invites.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="h-16 w-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                                <LinkIcon className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">No Invites Generated Yet</h3>
                            <p className="text-slate-500 mt-2 max-w-sm">
                                Click the button above to generate a unique invite link. You can send this link to a new customer to bypass the registration lock.
                            </p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Token Code</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {invites.map((invite) => (
                                    <tr key={invite.code} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm font-bold bg-slate-100 px-3 py-1 rounded text-slate-800">
                                                {invite.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {invite.used_by_id ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Used
                                                </span>
                                            ) : new Date(invite.expires_at) < new Date() ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                    Expired
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    Valid
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(invite.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleCopy(invite.code)}
                                                disabled={!!invite.used_by_id}
                                                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-30 disabled:hover:text-blue-600 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {copiedId === invite.code ? (
                                                    <><CheckCircle className="h-4 w-4 mr-1 text-emerald-500" /> Copied</>
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
