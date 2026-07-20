import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Database, Droplet, Loader2 } from 'lucide-react';

export const AdminResources: React.FC = () => {
    const [resources, setResources] = useState<{ pumps: any[], fluids: any[] }>({ pumps: [], fluids: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const response = await apiClient.get('/admin/resources');
            setResources(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>;
    }

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white">Global Engineering Resources</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pumps Table */}
                <div className="card border border-[var(--color-divider)] overflow-hidden p-0">
                    <div className="bg-[var(--color-bg)]/30 px-6 py-4 border-b border-[var(--color-divider)] flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center">
                            <Database className="h-5 w-5 mr-2 text-[var(--color-accent)]" />
                            Global Pump Library
                        </h3>
                        <span className="tag tag-accent">
                            {resources.pumps.length} Curves
                        </span>
                    </div>
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="min-w-full divide-y divide-[var(--color-divider)]">
                            <thead className="bg-[var(--color-bg)]/50 sticky top-0 border-b border-[var(--color-divider)] shadow-sm z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Manufacturer / Model</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Created By (Owner)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-transparent divide-y divide-[var(--color-divider)]">
                                {resources.pumps.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-8 text-center text-muted">No pumps registered yet.</td>
                                    </tr>
                                ) : resources.pumps.map((pump, idx) => (
                                    <tr key={idx} className="hover:bg-white/5">
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-semibold text-white">{pump.manufacturer}</div>
                                            <div className="text-xs text-muted">{pump.model}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--color-text)] truncate max-w-[200px]">
                                            {pump.owner_email}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Fluids Table */}
                <div className="card border border-[var(--color-divider)] overflow-hidden p-0">
                    <div className="bg-[var(--color-bg)]/30 px-6 py-4 border-b border-[var(--color-divider)] flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center">
                            <Droplet className="h-5 w-5 mr-2 text-[var(--color-accent-2)]" />
                            Custom Fluids Library
                        </h3>
                        <span className="tag tag-accent-2">
                            {resources.fluids.length} Fluids
                        </span>
                    </div>
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="min-w-full divide-y divide-[var(--color-divider)]">
                            <thead className="bg-[var(--color-bg)]/50 sticky top-0 border-b border-[var(--color-divider)] shadow-sm z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Fluid Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Created By (Owner)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-transparent divide-y divide-[var(--color-divider)]">
                                {resources.fluids.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-8 text-center text-muted">No custom fluids registered yet.</td>
                                    </tr>
                                ) : resources.fluids.map((fluid, idx) => (
                                    <tr key={idx} className="hover:bg-white/5">
                                        <td className="px-4 py-3 text-sm font-bold text-white">
                                            {fluid.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--color-text)] truncate max-w-[200px]">
                                            {fluid.owner_email}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};
