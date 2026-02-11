import React from 'react';
import { OperatingPointResult } from '@/types/engineering';
import { Card } from '@/components/ui/Card';
import { Gauge, Zap, TrendingUp, AlertTriangle, Droplets } from 'lucide-react';

interface ResultsDisplayProps {
    result: OperatingPointResult | null;
    isCalculating: boolean;
    error: string | null;
}

interface MetricProps {
    label: string;
    value: string | number;
    unit?: string;
    icon?: React.ReactNode;
    color?: string;
    alert?: boolean;
}

const Metric: React.FC<MetricProps> = ({ label, value, unit, icon, color = "bg-blue-50 text-blue-600", alert }) => (
    <div className={`flex items-start p-4 rounded-xl border ${alert ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className={`p-2 rounded-lg mr-3 ${alert ? 'bg-red-100 text-red-600' : color}`}>
            {icon || <TrendingUp size={20} />}
        </div>
        <div>
            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${alert ? 'text-red-600' : 'text-slate-500'}`}>{label}</p>
            <p className={`text-2xl font-bold ${alert ? 'text-red-700' : 'text-slate-800'}`}>
                {value} <span className="text-sm font-normal text-slate-500">{unit}</span>
            </p>
        </div>
    </div>
);

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, isCalculating, error }) => {
    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center">
                <AlertTriangle className="mr-3 shrink-0" />
                <span>Calculation Error: {error}</span>
            </div>
        );
    }

    if (!result && !isCalculating) {
        return null; // Don't show anything if no result yet (dashboard handles placeholder)
    }

    const flow = result?.flow_op ? result.flow_op.toFixed(1) : '-';
    const head = result?.head_op ? result.head_op.toFixed(1) : '-';
    const power = result?.power_kw ? result.power_kw.toFixed(1) : '-';
    const cost = result?.cost_per_year ? result.cost_per_year.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';
    const eff = result?.efficiency_op ? result.efficiency_op.toFixed(1) : '-';
    const npsha = result?.npsh_available ? result.npsh_available.toFixed(2) : '-';

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Main KPI Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isCalculating ? 'opacity-50 pointer-events-none' : ''}`}>
                <Metric
                    label="Flow Rate"
                    value={flow}
                    unit="m³/h"
                    icon={<Gauge size={20} />}
                    color="bg-blue-50 text-blue-600"
                />
                <Metric
                    label="Total Dyn. Head"
                    value={head}
                    unit="m"
                    icon={<TrendingUp size={20} />}
                    color="bg-indigo-50 text-indigo-600"
                />
                <Metric
                    label="NPSH Available"
                    value={npsha}
                    unit="m"
                    icon={<Droplets size={20} />}
                    alert={result?.cavitation_risk} // Highlight if risk
                    color="bg-cyan-50 text-cyan-600"
                />
                <Metric
                    label="Pump Efficiency"
                    value={eff}
                    unit="%"
                    icon={<Zap size={20} />}
                    color="bg-emerald-50 text-emerald-600"
                />
                <Metric
                    label="Power Consump."
                    value={power}
                    unit="kW"
                    icon={<Zap size={20} />}
                    color="bg-amber-50 text-amber-600"
                />
                <Metric
                    label="Est. Yearly Cost"
                    value={cost}
                    unit=""
                    icon={<span className="font-bold text-lg">$</span>}
                    color="bg-green-50 text-green-600"
                />
            </div>

            {/* Alerts */}
            {result?.cavitation_risk && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Cavitation Risk Detected</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>NPSH Available ({npsha}m) is likely lower than NPSH Required by the pump.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Table (Can be toggled or replaced by Diagram later) */}
            <Card title="Detailed Losses">
                {result?.details && result.details.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-slate-600">
                            <thead className="bg-slate-50 font-medium text-slate-700">
                                <tr>
                                    <th className="px-4 py-3">Section</th>
                                    <th className="px-4 py-3">Velocity (m/s)</th>
                                    <th className="px-4 py-3">Reynolds</th>
                                    <th className="px-4 py-3">Friction (m)</th>
                                    <th className="px-4 py-3">Local/Eqp (m)</th>
                                    <th className="px-4 py-3 font-bold text-slate-900">Total (m)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {result.details.map((d, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 font-mono text-xs text-slate-400">
                                            {d.section_id ? d.section_id.substring(0, 8) : `Segment ${i + 1}`}
                                        </td>
                                        <td className="px-4 py-2">{d.velocity_m_s.toFixed(2)}</td>
                                        <td className="px-4 py-2">{d.reynolds.toExponential(2)}</td>
                                        <td className="px-4 py-2 text-slate-500">{d.major_loss_m.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-slate-500">{d.minor_loss_m.toFixed(2)}</td>
                                        <td className="px-4 py-2 font-medium text-slate-900 bg-slate-50/50">{d.total_loss_m.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center text-slate-400 py-4">No detailed segment data.</div>
                )}
            </Card>
        </div>
    );
};
