import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Users, LayoutTemplate, CopyPlus, Zap, AlertTriangle, Database } from 'lucide-react';

interface KPIs {
    users: { total: number; active: number };
    database: { total_projects: number; total_scenarios: number; size_mb?: number };
    performance: { avg_response_time_ms: number; error_rate_percent: number };
    recent_errors: any[];
}

export const AdminDashboard: React.FC = () => {
    const [kpis, setKpis] = useState<KPIs | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await apiClient.get('/admin/kpis');
            setKpis(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !kpis) {
        return <div className="animate-pulse flex h-64 bg-white/5 border border-[var(--color-divider)] rounded-xl"></div>;
    }

    const cards = [
        { label: 'Active Users (Total)', value: `${kpis.users.active} / ${kpis.users.total}`, icon: Users, color: 'text-[var(--color-accent)]', bg: 'bg-[var(--color-accent)]/10' },
        { label: 'Total Projects', value: kpis.database.total_projects, icon: LayoutTemplate, color: 'text-[var(--color-accent-2)]', bg: 'bg-[var(--color-accent-2)]/10' },
        { label: 'Total Scenarios', value: kpis.database.total_scenarios, icon: CopyPlus, color: 'text-[#c6bafc]', bg: 'bg-[#c6bafc]/10' },
        { label: 'Avg Calculation Time', value: `${kpis.performance.avg_response_time_ms}ms`, icon: Zap, color: 'text-[#5fd08a]', bg: 'bg-[#5fd08a]/10' },
        { label: 'Algorithm Error Rate', value: `${kpis.performance.error_rate_percent}%`, icon: AlertTriangle, color: kpis.performance.error_rate_percent > 5 ? 'text-[#e06b6b]' : 'text-[#eab308]', bg: kpis.performance.error_rate_percent > 5 ? 'bg-[#e06b6b]/10' : 'bg-[#eab308]/10' },
        { label: 'DB Storage Used', value: `${kpis.database.size_mb !== undefined ? kpis.database.size_mb : 0} MB / 500 MB`, icon: Database, color: 'text-[#e06b6b]', bg: 'bg-[#e06b6b]/10' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">System Performance & Health</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="card border border-[var(--color-divider)] p-6 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">{card.label}</h3>
                            <div className={`p-2 rounded-lg ${card.bg}`}>
                                <card.icon className={`h-5 w-5 ${card.color}`} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-white">
                            {card.value}
                        </div>
                    </div>
                ))}
            </div>

            <div className="card border border-[var(--color-divider)] overflow-hidden mt-8 p-0">
                <div className="px-6 py-5 border-b border-[var(--color-divider)]">
                    <h3 className="text-lg font-bold text-white">Recent System Logs (500 Internal Errors)</h3>
                </div>
                <div className="overflow-x-auto">
                    {kpis.recent_errors.length === 0 ? (
                        <div className="p-6 text-center text-muted bg-[var(--color-bg)]/50">
                            No recent simulation or calculation errors found. The physics engine is stable.
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-[var(--color-divider)]">
                            <thead className="bg-[var(--color-bg)]/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted tracking-wider">Endpoint</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted tracking-wider">Message</th>
                                </tr>
                            </thead>
                            <tbody className="bg-transparent divide-y divide-[var(--color-divider)]">
                                {kpis.recent_errors.map((err, idx) => (
                                    <tr key={idx} className="hover:bg-white/5">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                                            {new Date(err.time).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                            {err.endpoint}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#e06b6b]/10 text-[#e06b6b]">
                                                {err.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[var(--color-text)] truncate max-w-md">
                                            {err.error}
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
