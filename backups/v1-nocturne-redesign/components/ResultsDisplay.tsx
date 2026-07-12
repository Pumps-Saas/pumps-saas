import React from 'react';
import { OperatingPointResult } from '@/types/engineering';
import { Gauge, Zap, TrendingUp, AlertTriangle, Droplets, CheckCircle2, ShieldAlert, Info } from 'lucide-react';
import { useSystemStore } from '../stores/useSystemStore';

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

const Metric: React.FC<MetricProps> = ({ label, value, unit, icon, alert }) => (
    <div className={`flex items-center p-3.5 rounded-xl border min-w-0 transition-all ${
        alert 
            ? 'bg-[#e06b6b]/10 border-[#e06b6b]/40 text-[#e06b6b]' 
            : 'bg-[var(--color-surface)] border-[var(--color-divider)] shadow-sm text-[var(--color-text)]'
    }`}>
        <div className={`p-2.5 rounded-lg mr-3 shrink-0 ${
            alert ? 'bg-[#e06b6b]/20 text-[#e06b6b]' : 'bg-[#9184d9]/15 text-[#9184d9]'
        }`}>
            {icon || <TrendingUp size={18} />}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-muted truncate" title={label}>{label}</p>
            <p className="text-lg font-bold whitespace-nowrap text-white font-mono tracking-tight overflow-hidden text-ellipsis" title={String(value)}>
                {value} <span className="text-xs font-normal text-muted ml-0.5">{unit}</span>
            </p>
        </div>
    </div>
);

// Cockpit com os 6 KPIs fundamentais em grade limpa sem quebra de texto
export const CockpitKPIs: React.FC<ResultsDisplayProps> = ({ result, isCalculating, error }) => {
    if (error) {
        return (
            <div className="bg-[#e06b6b]/15 border border-[#e06b6b]/40 rounded-xl p-4 text-[#e06b6b] flex items-center">
                <AlertTriangle className="mr-3 shrink-0" />
                <span className="font-medium text-sm">{error}</span>
            </div>
        );
    }

    if (!result && !isCalculating) {
        return null;
    }

    const flow = result?.flow_op ? result.flow_op.toFixed(1) : '-';
    const head = result?.head_op ? result.head_op.toFixed(1) : '-';
    const power = result?.power_kw ? result.power_kw.toFixed(1) : '-';
    const cost = result?.cost_per_year ? result.cost_per_year.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-';
    const eff = result?.efficiency_op ? result.efficiency_op.toFixed(1) : '-';
    const npsha = result?.npsh_available || 0;
    const npshr = result?.npsh_required || 0;

    let npshMarginValue = 0;
    let npshMarginText = '-';
    let npshAlertStatus: 'safe' | 'warning' | 'danger' = 'safe';
    let npshIcon = <CheckCircle2 size={18} className="text-[#5fd08a]" />;

    if (result && npshr > 0) {
        npshMarginValue = (npsha - npshr) / npshr;
        npshMarginText = `${(npshMarginValue * 100).toFixed(1)}%`;

        if (npshMarginValue < 0) {
            npshAlertStatus = 'danger';
            npshIcon = <ShieldAlert size={18} className="text-[#e06b6b]" />;
        } else if (npshMarginValue < 0.20) {
            npshAlertStatus = 'warning';
            npshIcon = <AlertTriangle size={18} className="text-[#e0a94b]" />;
        }
    } else if (result && npsha > 0) {
        npshMarginText = `> 100%`;
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <div className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5 ${isCalculating ? 'opacity-50 pointer-events-none' : ''}`}>
                <Metric label="Vazão de Projeto" value={flow} unit="m³/h" icon={<Gauge size={18} />} />
                <Metric label="Alt. Manométrica" value={head} unit="mca" icon={<TrendingUp size={18} />} />
                <Metric label="Margem NPSH" value={npshMarginText} unit="" icon={npshIcon} alert={npshAlertStatus === 'danger'} />
                <Metric label="Rendimento" value={eff} unit="%" icon={<Zap size={18} />} />
                <Metric label="Potência / Consumo" value={power} unit="kW" icon={<Zap size={18} />} />
                <Metric label="Custo Anual Previsto" value={cost} unit="" icon={<span className="font-bold text-base text-[#5fd08a]">$</span>} />
            </div>

            {/* Alerts Nocturne */}
            {(result?.natural_flow_m3h ?? 0) > 0 && (
                <div className="bg-[#5fd08a]/15 border-l-4 border-[#5fd08a] p-3.5 rounded-r-lg flex items-start text-white">
                    <Droplets className="h-5 w-5 text-[#5fd08a] flex-shrink-0 mr-3 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-[#5fd08a]">Escoamento Natural Disponível</h3>
                        <p className="mt-1 text-xs text-muted">O sistema escoa a <strong>{result!.natural_flow_m3h!.toFixed(1)} m³/h</strong> por gravidade sem necessidade de bomba.</p>
                    </div>
                </div>
            )}
            {result?.is_extrapolated && (
                <div className="bg-[#e0a94b]/15 border-l-4 border-[#e0a94b] p-3.5 rounded-r-lg flex items-start text-white">
                    <AlertTriangle className="h-5 w-5 text-[#e0a94b] flex-shrink-0 mr-3 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-[#e0a94b]">Ponto de Operação Estimado</h3>
                        <p className="mt-1 text-xs text-muted">Extrapola a curva fornecida. Resultados podem sofrer imprecisões.</p>
                    </div>
                </div>
            )}
            {result?.cavitation_risk && (
                <div className="bg-[#e06b6b]/15 border-l-4 border-[#e06b6b] p-3.5 rounded-r-lg flex items-start text-white">
                    <AlertTriangle className="h-5 w-5 text-[#e06b6b] flex-shrink-0 mr-3 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-[#e06b6b]">Risco Crítico de Cavitação Detectado</h3>
                        <p className="mt-1 text-xs text-muted">NPSH Disponível ({npsha.toFixed(2)}m) &lt; NPSH Requerido ({npshr.toFixed(2)}m).</p>
                    </div>
                </div>
            )}
            {npshAlertStatus === 'warning' && !result?.cavitation_risk && (
                <div className="bg-[#e0a94b]/15 border-l-4 border-[#e0a94b] p-3.5 rounded-r-lg flex items-start text-white">
                    <AlertTriangle className="h-5 w-5 text-[#e0a94b] flex-shrink-0 mr-3 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-[#e0a94b]">Margem de NPSH Baixa</h3>
                        <p className="mt-1 text-xs text-muted">A margem está abaixo do fator de segurança recomendado (20%).</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// Componente idêntico ao Print 1 (protótipo Bombeo.dc.html) para a barra lateral do Novo Cálculo
export const LiveMetricsSidebar: React.FC<{ result: OperatingPointResult | null }> = ({ result }) => {
    const fallbackFlow = useSystemStore(state => state.pump_curve?.[0]?.flow || 50);
    const staticHead = useSystemStore(state => state.static_head);
    const suctionSections = useSystemStore(state => state.suction_sections);
    const dischargeBefore = useSystemStore(state => state.discharge_sections_before);
    const dischargeParallel = useSystemStore(state => state.discharge_parallel_sections);
    const dischargeAfter = useSystemStore(state => state.discharge_sections_after);

    const mainSuction = suctionSections[0] || { diameter_mm: 100 };
    const mainDischarge = dischargeBefore[0] || dischargeParallel[0] || dischargeAfter[0] || { diameter_mm: 80 };

    let vSuc = 0;
    let vDis = 0;

    if (result && result.details) {
        const sucDetail = result.details.find(d => d.section_id === mainSuction.id || d.section_id.includes('suction'));
        if (sucDetail && sucDetail.velocity_m_s) vSuc = sucDetail.velocity_m_s;
        const disDetail = result.details.find(d => d.section_id === mainDischarge.id || d.section_id.includes('discharge'));
        if (disDetail && disDetail.velocity_m_s) vDis = disDetail.velocity_m_s;
    }

    if (vSuc === 0 && mainSuction.diameter_mm > 0) {
        const areaSuc = Math.PI * Math.pow(mainSuction.diameter_mm / 1000 / 2, 2);
        vSuc = (fallbackFlow / 3600) / areaSuc;
    }
    if (vDis === 0 && mainDischarge.diameter_mm > 0) {
        const areaDis = Math.PI * Math.pow(mainDischarge.diameter_mm / 1000 / 2, 2);
        vDis = (fallbackFlow / 3600) / areaDis;
    }

    const amt = result?.head_op ?? staticHead;
    const npshd = result?.npsh_available ?? 6.7;
    const vazao = result?.flow_op ?? fallbackFlow;
    // Estimativa de potência caso ainda não calculado: P(kW) = (rho * g * Q * H) / (3600 * 1000 * eta) ~ Q * H / 267
    const potencia = result?.power_kw ?? ((vazao * amt * 9.81) / (3600 * 0.70));

    const f = (n: number, dec = 1) => isNaN(n) ? '0,0' : n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

    return (
        <div className="mt-4">
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-bold">AMT</div>
                    <div className="text-xl font-bold text-white font-mono mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                        {f(amt, 1)} <span className="text-xs text-muted font-normal">mca</span>
                    </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-bold">NPSH Disp.</div>
                    <div className="text-xl font-bold text-[#5fd08a] font-mono mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                        {f(npshd, 1)} <span className="text-xs text-muted font-normal">m</span>
                    </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-bold">Vazão</div>
                    <div className="text-xl font-bold text-[#9184d9] font-mono mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                        {f(vazao, 1)} <span className="text-xs text-muted font-normal">m³/h</span>
                    </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-bold">Potência</div>
                    <div className="text-xl font-bold text-white font-mono mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                        {f(potencia, 2)} <span className="text-xs text-muted font-normal">kW</span>
                    </div>
                </div>
            </div>

            <p className="text-xs text-muted mt-3.5 flex gap-1.5 items-start leading-relaxed">
                <Info size={14} className="shrink-0 mt-0.5 text-[#9184d9]" />
                <span>Valores atualizam em tempo real conforme você edita os dados. Velocidades em cada trecho são exibidas diretamente no Diagrama do Sistema.</span>
            </p>
        </div>
    );
};

export const CalculationMemorial: React.FC<{ result: OperatingPointResult | null }> = ({ result }) => {
    if (!result?.head_breakdown) return null;
    return (
        <div className="card border border-[var(--color-divider)] p-5">
            <h3 className="text-base font-bold text-white border-b border-[var(--color-divider)] pb-2 mb-4 flex items-center justify-between">
                <span>Memorial de Cálculo (Balanço de Energia Hidráulica)</span>
                <span className="tag tag-outline">Bernoulli</span>
            </h3>
            <div className="text-sm text-muted space-y-2 mb-5">
                <p>A Altura Manométrica Total (AMT) exigida pela bomba no ponto operacional é expressa pela equação do balanço:</p>
                <div className="font-mono bg-[var(--color-bg)] p-3 rounded-lg text-center text-white border border-[var(--color-divider)] my-3">
                    H<sub>bomba</sub> = ΔZ + ΔP<sub>pressão</sub> + H<sub>perdas</sub>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3.5 bg-[var(--color-bg)]/60 rounded-lg border border-[var(--color-divider)]">
                    <div className="text-xs text-muted mb-1 font-medium">Desnível Estático (ΔZ)</div>
                    <div className="font-bold text-white text-base">{result.head_breakdown.static_head_m.toFixed(2)} m</div>
                </div>
                <div className="p-3.5 bg-[var(--color-bg)]/60 rounded-lg border border-[var(--color-divider)]">
                    <div className="text-xs text-muted mb-1 font-medium">Diferença de Pressão (ΔP)</div>
                    <div className="font-bold text-white text-base">{result.head_breakdown.pressure_head_m.toFixed(2)} m</div>
                </div>
                <div className="p-3.5 bg-[var(--color-bg)]/60 rounded-lg border border-[var(--color-divider)]">
                    <div className="text-xs text-muted mb-1 font-medium">Perdas de Carga (H<sub>f</sub>)</div>
                    <div className="font-bold text-white text-base">{result.head_breakdown.friction_head_m.toFixed(2)} m</div>
                </div>
                <div className="p-3.5 bg-[#9184d9]/15 rounded-lg border border-[#9184d9]/40 shadow-sm">
                    <div className="text-xs text-[#9184d9] mb-1 font-bold uppercase">AMT Requerida Total</div>
                    <div className="font-bold text-white text-lg">{result.head_breakdown.total_head_m.toFixed(2)} m</div>
                </div>
            </div>
        </div>
    );
};

export const DetailedLosses: React.FC<{ result: OperatingPointResult | null }> = ({ result }) => {
    return (
        <div className="card border border-[var(--color-divider)] p-5">
            <h3 className="text-base font-bold text-white border-b border-[var(--color-divider)] pb-2 mb-4">
                Detalhamento por Trecho e Acessórios (Perdas e Velocidades)
            </h3>
            {result?.details && result.details.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Trecho / Segmento</th>
                                <th>Velocidade (m/s)</th>
                                <th>Reynolds (Re)</th>
                                <th>Perda Distr. (m)</th>
                                <th>Perda Local/Acess. (m)</th>
                                <th className="font-bold text-white">Total do Trecho (m)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.details.map((d, i) => {
                                const v = d.velocity_m_s;
                                const isSuction = d.section_id?.toLowerCase().includes('suc') || i === 0;
                                let vBadge = <span className="text-[#5fd08a] font-semibold">{v.toFixed(2)} m/s</span>;
                                if (isSuction) {
                                    if (v > 2.0 || v < 0.5) vBadge = <span className="text-[#e0a94b] font-bold">{v.toFixed(2)} m/s ⚠</span>;
                                    if (v > 2.5) vBadge = <span className="text-[#e06b6b] font-bold">{v.toFixed(2)} m/s ❌</span>;
                                } else {
                                    if (v > 3.0 || v < 0.8) vBadge = <span className="text-[#e0a94b] font-bold">{v.toFixed(2)} m/s ⚠</span>;
                                    if (v > 4.0) vBadge = <span className="text-[#e06b6b] font-bold">{v.toFixed(2)} m/s ❌</span>;
                                }

                                return (
                                    <tr key={i}>
                                        <td className="font-mono text-xs text-muted">
                                            {d.section_id ? d.section_id.substring(0, 16) : `Trecho ${i + 1}`}
                                        </td>
                                        <td>{vBadge}</td>
                                        <td className="text-muted font-mono">{d.reynolds.toExponential(2)}</td>
                                        <td className="text-muted">{d.major_loss_m.toFixed(2)}</td>
                                        <td className="text-muted">{d.minor_loss_m.toFixed(2)}</td>
                                        <td className="font-bold text-white bg-white/5 px-3 py-1 rounded">{d.total_loss_m.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center text-muted py-6 italic text-sm">Nenhum dado de perda por segmento. Calcule para visualizar a tabela.</div>
            )}
        </div>
    );
};
