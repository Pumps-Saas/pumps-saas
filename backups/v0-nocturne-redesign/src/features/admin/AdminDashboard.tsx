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
        return <div className="animate-pulse flex h-64 bg-slate-200 rounded-xl"></div>;
    }

    const cards = [
        { label: 'Active Users (Total)', value: `${kpis.users.active} / ${kpis.users.total}`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Total Projects', value: kpis.database.total_projects, icon: LayoutTemplate, color: 'text-indigo-600', bg: 'bg-indigo-100' },
        { label: 'Total Scenarios', value: kpis.database.total_scenarios, icon: CopyPlus, color: 'text-purple-600', bg: 'bg-purple-100' },
        { label: 'Avg Calculation Time', value: `${kpis.performance.avg_response_time_ms}ms`, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { label: 'Algorithm Error Rate', value: `${kpis.performance.error_rate_percent}%`, icon: AlertTriangle, color: kpis.performance.error_rate_percent > 5 ? 'text-red-600' : 'text-amber-500', bg: kpis.performance.error_rate_percent > 5 ? 'bg-red-100' : 'bg-amber-100' },
        { label: 'DB Storage Used', value: `${kpis.database.size_mb !== undefined ? kpis.database.size_mb : 0} MB / 500 MB`, icon: Database, color: 'text-rose-600', bg: 'bg-rose-100' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">System Performance & Health</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{card.label}</h3>
                            <div className={`p-2 rounded-lg ${card.bg}`}>
                                <card.icon className={`h-5 w-5 ${card.color}`} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-slate-800">
                            {card.value}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                <div className="px-6 py-5 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800">Recent System Logs (500 Internal Errors)</h3>
                </div>
                <div className="overflow-x-auto">
                    {kpis.recent_errors.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 bg-slate-50">
                            No recent simulation or calculation errors found. The physics engine is stable.
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Endpoint</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Message</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {kpis.recent_errors.map((err, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {new Date(err.time).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                                            {err.endpoint}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">
                                                {err.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-md">
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
