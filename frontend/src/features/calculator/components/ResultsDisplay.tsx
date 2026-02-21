import React from 'react';
import { OperatingPointResult } from '@/types/engineering';
import { Card } from '@/components/ui/Card';
import { Gauge, Zap, TrendingUp, AlertTriangle, Droplets, CheckCircle2, ShieldAlert } from 'lucide-react';

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
    <div className={`flex items-start p-4 rounded-xl border min-w-0 ${alert ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className={`p-2 rounded-lg mr-3 shrink-0 ${alert ? 'bg-red-100 text-red-600' : color}`}>
            {icon || <TrendingUp size={20} />}
        </div>
        <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 truncate ${alert ? 'text-red-600' : 'text-slate-500'}`} title={label}>{label}</p>
            <p className={`text-xl font-bold break-words whitespace-normal leading-tight ${alert ? 'text-red-700' : 'text-slate-800'}`} style={{ wordBreak: 'break-word' }} title={String(value)}>
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
                <span>{error}</span>
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
    const npsha = result?.npsh_available || 0;
    const npshr = result?.npsh_required || 0;

    // NPSH Margin Calculation
    let npshMarginValue = 0;
    let npshMarginText = '-';
    let npshAlertStatus: 'safe' | 'warning' | 'danger' = 'safe';
    let npshIcon = <CheckCircle2 size={20} />;
    let npshColor = "bg-emerald-50 text-emerald-600";

    if (result && npshr > 0) {
        npshMarginValue = (npsha - npshr) / npshr;
        npshMarginText = `${(npshMarginValue * 100).toFixed(1)} %`;

        if (npshMarginValue < 0) {
            npshAlertStatus = 'danger';
            npshIcon = <ShieldAlert size={20} />;
            npshColor = "bg-red-50 text-red-600";
        } else if (npshMarginValue < 0.20) {
            npshAlertStatus = 'warning';
            npshIcon = <AlertTriangle size={20} />;
            npshColor = "bg-amber-50 text-amber-600";
        }
    } else if (result && npsha > 0) {
        npshMarginText = `> 100% (No NPSHr)`;
    }

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
                    label="NPSH Margin"
                    value={npshMarginText}
                    unit=""
                    icon={npshIcon}
                    alert={npshAlertStatus === 'danger'} // Red border only for danger
                    color={npshAlertStatus === 'warning' ? "bg-amber-100 text-amber-700" : npshColor} // Warning gets amber, danger handled by alert prop
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
            {(result?.natural_flow_m3h ?? 0) > 0 && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Droplets className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-emerald-800">Natural Flow Available</h3>
                            <div className="mt-2 text-sm text-emerald-700">
                                <p>
                                    Due to high source pressure or elevation, this system can flow at <strong>{result!.natural_flow_m3h!.toFixed(1)} m³/h</strong> without a pump.
                                    The pump is only needed if you require higher flow rates.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {result?.is_extrapolated && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800">Ponto de Operação Estimado</h3>
                            <div className="mt-2 text-sm text-amber-700">
                                <p>O ponto de operação encontrado extrapolou a curva da bomba, ou seja, está fora dos limites dos pontos fornecidos ({result.flow_op.toFixed(1)} m³/h). Os resultados podem sofrer imprecisões no mundo real. Considere validar os dados.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {result?.cavitation_risk && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Dangerous Cavitation Risk Detected</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>NPSH Available ({npsha.toFixed(2)}m) is lower than NPSH Required ({npshr.toFixed(2)}m) by the pump. The pump will cavitate.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {npshAlertStatus === 'warning' && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800">Low NPSH Margin</h3>
                            <div className="mt-2 text-sm text-amber-700">
                                <p>The NPSH margin is {npshMarginText}, which is below the recommended 20% safety factor. Consider increasing suction head or reducing pipe losses.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Calculation Memorial */}
            {result?.head_breakdown && (
                <Card title="Calculation Memorial (Head Balance)">
                    <div className="text-sm text-slate-600 space-y-2 mb-4">
                        <p>Total Dynamic Head required from the pump is calculated as:</p>
                        <p className="font-mono bg-slate-100 p-2 rounded text-center">
                            H<sub>pump</sub> = ΔZ + ΔP<sub>head</sub> + H<sub>friction</sub>
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-slate-50 rounded border border-slate-100">
                            <div className="text-xs text-slate-500 mb-1">Static Elevation (ΔZ)</div>
                            <div className="font-semibold text-slate-700">{result.head_breakdown.static_head_m.toFixed(2)} m</div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded border border-slate-100">
                            <div className="text-xs text-slate-500 mb-1">Pressure Head (ΔP)</div>
                            <div className="font-semibold text-slate-700">{result.head_breakdown.pressure_head_m.toFixed(2)} m</div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded border border-slate-100">
                            <div className="text-xs text-slate-500 mb-1">Friction Losses (H<sub>f</sub>)</div>
                            <div className="font-semibold text-slate-700">{result.head_breakdown.friction_head_m.toFixed(2)} m</div>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded border border-indigo-100">
                            <div className="text-xs text-indigo-600 mb-1 font-bold">Total Required Head</div>
                            <div className="font-bold text-indigo-700">{result.head_breakdown.total_head_m.toFixed(2)} m</div>
                        </div>
                    </div>
                    <div className="mt-2 text-center text-xs text-slate-400 italic">
                        * Values may vary slightly due to rounding.
                    </div>
                </Card>
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
