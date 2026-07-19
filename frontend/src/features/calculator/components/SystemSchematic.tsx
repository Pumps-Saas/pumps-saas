import React from 'react';
import { useSystemStore } from '../stores/useSystemStore';
import { useReferenceStore } from '../stores/useReferenceStore';
import { OperatingPointResult, PipeSection } from '@/types/engineering';

interface SystemSchematicProps {
    result: OperatingPointResult | null;
    printMode?: boolean;
}

export const SystemSchematic: React.FC<SystemSchematicProps> = ({ result, printMode = false }) => {
    const suctionSections = useSystemStore(state => state.suction_sections || []);
    const dischargeBefore = useSystemStore(state => state.discharge_sections_before || []);
    const dischargeParallel = useSystemStore(state => state.discharge_parallel_sections || {});
    const dischargeAfter = useSystemStore(state => state.discharge_sections_after || []);
    const staticHead = useSystemStore(state => state.static_head || 10);

    const fallbackFlow = useSystemStore(state => state.pump_curve?.[0]?.flow || 50);
    const flowM3h = result?.flow_op ?? fallbackFlow;

    // Helper to get velocity & head loss for a specific section
    const getSectionMetrics = (section: PipeSection, branchFlowFraction = 1) => {
        let v = 0;
        let loss = 0;
        let q = 0;
        if (result?.details) {
            const detail = result.details.find(d => d.section_id === section.id);
            if (detail) {
                v = detail.velocity_m_s || 0;
                loss = detail.total_loss_m || 0;
            }
        }
        
        const area = Math.PI * Math.pow((section.diameter_mm || 0) / 1000 / 2, 2);
        
        if (v > 0) {
            // True flow computed by backend based on calculated velocity
            q = v * area * 3600;
        } else if (section.diameter_mm > 0) {
            // Fallback live velocity estimation
            q = flowM3h * branchFlowFraction;
            v = (q / 3600) / area;
        }

        if (loss === 0 && section.diameter_mm > 0 && v > 0) {
            const dM = section.diameter_mm / 1000;
            // Darcy-Weisbach simple approximation f ~ 0.02
            loss = 0.02 * ((section.length_m || 1) / dM) * (Math.pow(v, 2) / (2 * 9.81));
        }
        return { v, loss, q };
    };

    const getVelColor = (v: number) => {
        if (v <= 0) return 'var(--color-neutral-400)';
        if (v > 2.5 || v < 0.6) return '#e0a94b'; // warning (yellow/amber)
        return '#5fd08a'; // recommended range
    };

    const f = (n: number, dec = 2) => isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const num = (n: number) => isNaN(n) ? '0' : Math.round(n).toString();

    // Helper to format pipe diameter in nominal inches matching exact input labels
    const getNominalLabel = (d_mm: number): string => {
        if (!d_mm) return '0"';
        const diameters = useReferenceStore.getState().diameters || {};
        const entry = Object.entries(diameters).find(([_, info]) => Math.abs((Number(info) || 0) - d_mm) < 0.5);
        if (entry && entry[0]) {
            const match = entry[0].match(/(\d+(?:\.\d+)?")/);
            if (match) return `DN ${match[1]}`;
            const clean = entry[0].replace(/\s*\(.*?\)/, '').trim();
            if (clean) return `DN ${clean}`;
        }
        const inches = d_mm / 25.4;
        if (Math.abs(inches - Math.round(inches)) < 0.15) {
            return `DN ${Math.round(inches)}"`;
        }
        if (Math.abs(inches * 2 - Math.round(inches * 2)) < 0.15) {
            return `DN ${(Math.round(inches * 2) / 2)}"`;
        }
        return `DN ${inches.toFixed(1)}"`;
    };

    const parallelKeys = Object.keys(dischargeParallel);
    const parallelCount = parallelKeys.length;

    // Helper to render Redução / Expansão cone symbol between adjacent sections of different diameters
    const renderReductionCone = (x: number, y: number, dPrev: number, dNext: number, isVertical = false) => {
        if (!dPrev || !dNext || Math.abs(dPrev - dNext) < 0.5) return null;
        const isReduction = dPrev > dNext;
        const label = isReduction ? `Redução ${getNominalLabel(dPrev)}→${getNominalLabel(dNext)}` : `Expansão ${getNominalLabel(dPrev)}→${getNominalLabel(dNext)}`;
        
        if (!isVertical) {
            // Horizontal cone
            const h1 = isReduction ? 12 : 6;
            const h2 = isReduction ? 6 : 12;
            const pts = `${x - 5},${y - h1} ${x + 5},${y - h2} ${x + 5},${y + h2} ${x - 5},${y + h1}`;
            return (
                <g key={`red-${x}-${y}`}>
                    <polygon points={pts} fill="#e0a94b" stroke="#ffffff" strokeWidth={1} />
                </g>
            );
        } else {
            // Vertical cone
            const w1 = isReduction ? 12 : 6;
            const w2 = isReduction ? 6 : 12;
            const pts = `${x - w1},${y + 5} ${x - w2},${y - 5} ${x + w2},${y - 5} ${x + w1},${y + 5}`;
            return (
                <g key={`red-${x}-${y}`}>
                    <polygon points={pts} fill="#e0a94b" stroke="#ffffff" strokeWidth={1} />
                </g>
            );
        }
    };

    return (
        <div className="w-full bg-[var(--color-surface)] rounded-xl border border-[var(--color-divider)] p-4 relative overflow-hidden flex flex-col justify-center">
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes bmbFlow {
                    from { stroke-dashoffset: 40; }
                    to { stroke-dashoffset: 0; }
                }
                @keyframes bmbSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .flow-animated {
                    animation: bmbFlow 1.2s linear infinite;
                }
                .pump-spinning {
                    transform-origin: 340px 510px;
                    animation: bmbSpin 3.5s linear infinite;
                }
            `}} />

            <svg 
                viewBox="0 0 900 650" 
                className="w-full h-auto block select-none"
            >
                {/* 1. SUCTION TANK */}
                <rect x={20} y={430} width={100} height={100} rx={6} fill="none" stroke="var(--color-neutral-600, #75798c)" strokeWidth={2} />
                <rect x={22} y={470} width={96} height={58} fill="color-mix(in srgb, #9184d9 22%, transparent)" />
                <text x={70} y={555} fill="var(--color-neutral-500, #75798c)" fontSize={14} textAnchor="middle" fontWeight="600">Sucção</text>

                {/* 2. DISCHARGE TANK */}
                <rect x={780} y={20} width={100} height={100} rx={6} fill="none" stroke="var(--color-neutral-600, #75798c)" strokeWidth={2} />
                <rect x={782} y={60} width={96} height={58} fill="color-mix(in srgb, #9184d9 22%, transparent)" />
                <text x={830} y={145} fill="var(--color-neutral-500, #75798c)" fontSize={14} textAnchor="middle" fontWeight="600">Recalque</text>

                {/* 3. PUMP SYMBOL */}
                <circle cx={340} cy={510} r={28} fill="var(--color-surface, #161826)" stroke="#9184d9" strokeWidth={3} />
                <g className={printMode ? '' : 'pump-spinning'}>
                    <path d="M 340 492 A 18 18 0 0 1 355 520 M 340 492 A 18 18 0 0 0 325 520 M 340 492 L 340 510" fill="none" stroke="#9184d9" strokeWidth={3} />
                </g>
                <text x={340} y={555} fill="#9184d9" fontSize={14} textAnchor="middle" fontWeight="700" letterSpacing="0.05em">BOMBA</text>

                {/* 4. SUCTION PIPE SERIES & REDUCTIONS */}
                {(() => {
                    const startX = 120;
                    const endX = 298;
                    const totalWidth = endX - startX;
                    const count = Math.max(suctionSections.length, 1);
                    const segWidth = totalWidth / count;

                    return suctionSections.map((sec, idx) => {
                        const sx = startX + idx * segWidth;
                        const ex = startX + (idx + 1) * segWidth;
                        const cx = (sx + ex) / 2;
                        // Alternate badge position up and down for horizontal pipes to avoid overlap
                        const cy = idx % 2 === 0 ? 435 : 585;
                        const { v, loss, q } = getSectionMetrics(sec);
                        const nextSec = suctionSections[idx + 1];

                        return (
                            <g key={`suc-${sec.id || idx}`}>
                                <path d={`M ${sx} 510 L ${ex} 510`} fill="none" stroke="#9184d9" strokeWidth={4} strokeDasharray="12 6" className={printMode ? '' : 'flow-animated'} />
                                {nextSec && renderReductionCone(ex, 510, sec.diameter_mm, nextSec.diameter_mm, false)}
                                {/* Section label badge */}
                                <rect x={cx - 72} y={cy - 43} width={144} height={86} rx={6} fill="#1e2030" stroke="#9184d9" strokeWidth={1.5} />
                                <text x={cx} y={cy - 22} fill="#ffffff" fontSize={14} textAnchor="middle" fontWeight="600">
                                    {getNominalLabel(sec.diameter_mm)} · {num(sec.length_m)}m
                                </text>
                                <text x={cx} y={cy - 3} fill="#ffffff" fontSize={14} textAnchor="middle" fontWeight="600">
                                    Q: {f(q, 1)} m³/h
                                </text>
                                <text x={cx} y={cy + 18} fill={getVelColor(v)} fontSize={14} textAnchor="middle" fontWeight="700">
                                    V: {f(v, 2)} m/s
                                </text>
                                <text x={cx} y={cy + 37} fill="#a7a1db" fontSize={14} textAnchor="middle" fontWeight="700">
                                    Δh: {f(loss, 2)}m
                                </text>
                                {/* Connector line to pipe */}
                                <line x1={cx} y1={idx % 2 === 0 ? cy + 43 : cy - 43} x2={cx} y2={idx % 2 === 0 ? 508 : 512} stroke="#9184d9" strokeWidth={1.5} strokeDasharray="2 2" />
                            </g>
                        );
                    });
                })()}

                {/* 5. DISCHARGE BEFORE SERIES & REDUCTIONS */}
                {(() => {
                    const startX = 382;
                    const endX = 580;
                    const totalWidth = endX - startX;
                    const count = Math.max(dischargeBefore.length, 1);
                    const segWidth = totalWidth / count;

                    return dischargeBefore.map((sec, idx) => {
                        const sx = startX + idx * segWidth;
                        const ex = startX + (idx + 1) * segWidth;
                        const cx = (sx + ex) / 2;
                        const cy = idx % 2 === 0 ? 435 : 585;
                        const { v, loss, q } = getSectionMetrics(sec);
                        const nextSec = dischargeBefore[idx + 1];

                        return (
                            <g key={`db-${sec.id || idx}`}>
                                <path d={`M ${sx} 510 L ${ex} 510`} fill="none" stroke="#9184d9" strokeWidth={4} strokeDasharray="12 6" className={printMode ? '' : 'flow-animated'} />
                                {nextSec && renderReductionCone(ex, 510, sec.diameter_mm, nextSec.diameter_mm, false)}
                                {/* Section label badge */}
                                <rect x={cx - 72} y={cy - 43} width={144} height={86} rx={6} fill="#1e2030" stroke="#9184d9" strokeWidth={1.5} />
                                <text x={cx} y={cy - 22} fill="#ffffff" fontSize={14} textAnchor="middle" fontWeight="600">
                                    {getNominalLabel(sec.diameter_mm)} · {num(sec.length_m)}m
                                </text>
                                <text x={cx} y={cy - 3} fill="#ffffff" fontSize={14} textAnchor="middle" fontWeight="600">
                                    Q: {f(q, 1)} m³/h
                                </text>
                                <text x={cx} y={cy + 18} fill={getVelColor(v)} fontSize={14} textAnchor="middle" fontWeight="700">
                                    V: {f(v, 2)} m/s
                                </text>
                                <text x={cx} y={cy + 37} fill="#a7a1db" fontSize={14} textAnchor="middle" fontWeight="700">
                                    Δh: {f(loss, 2)}m
                                </text>
                                <line x1={cx} y1={idx % 2 === 0 ? cy + 43 : cy - 43} x2={cx} y2={idx % 2 === 0 ? 508 : 512} stroke="#9184d9" strokeWidth={1.5} strokeDasharray="2 2" />
                            </g>
                        );
                    });
                })()}

                {/* 6. DISCHARGE PARALLEL BRANCHES OR VERTICAL RUN */}
                {(() => {
                    const turnX = 580;
                    if (parallelCount === 0) {
                        return (
                            <g>
                                <path d={`M ${turnX} 510 L ${turnX} 110`} fill="none" stroke="#9184d9" strokeWidth={4} strokeDasharray="12 6" className={printMode ? '' : 'flow-animated'} />
                            </g>
                        );
                    }

                    const branches = parallelKeys.map(k => ({ key: k, sections: dischargeParallel[k] || [] }));
                    const spread = Math.min(180, 320 / parallelCount);
                    const flowFraction = 1 / Math.max(parallelCount, 1);

                    return (
                        <g>
                            {/* Bottom Manifold Split Header */}
                            <path d={`M ${turnX} 510 L ${turnX} 470`} fill="none" stroke="#9184d9" strokeWidth={4} />
                            {parallelCount > 1 && (
                                <path 
                                    d={`M ${turnX - ((parallelCount - 1) * spread) / 2} 470 L ${turnX + ((parallelCount - 1) * spread) / 2} 470`} 
                                    fill="none" stroke="#9184d9" strokeWidth={4} 
                                />
                            )}
                            <circle cx={turnX} cy={470} r={6} fill="#e0a94b" />

                            {/* Top Manifold Join Header */}
                            <path d={`M ${turnX} 150 L ${turnX} 110`} fill="none" stroke="#9184d9" strokeWidth={4} />
                            {parallelCount > 1 && (
                                <path 
                                    d={`M ${turnX - ((parallelCount - 1) * spread) / 2} 150 L ${turnX + ((parallelCount - 1) * spread) / 2} 150`} 
                                    fill="none" stroke="#9184d9" strokeWidth={4} 
                                />
                            )}
                            <circle cx={turnX} cy={150} r={6} fill="#5fd08a" />

                            {/* Individual Parallel Branches */}
                            {branches.map((br, bIdx) => {
                                const bx = turnX + (bIdx - (parallelCount - 1) / 2) * spread;
                                const branchHeight = 320; // from 470 to 150
                                const count = Math.max(br.sections.length, 1);
                                const secHeight = branchHeight / count;

                                return (
                                    <g key={`branch-${br.key}`}>
                                        {br.sections.length === 0 && (
                                            <path d={`M ${bx} 470 L ${bx} 150`} fill="none" stroke="#9184d9" strokeWidth={3} strokeDasharray="10 5" className={printMode ? '' : 'flow-animated'} />
                                        )}
                                        {br.sections.map((sec, sIdx) => {
                                            const startY = 470 - sIdx * secHeight;
                                            const endY = 470 - (sIdx + 1) * secHeight;
                                            const cy = (startY + endY) / 2;
                                            const { v, loss, q } = getSectionMetrics(sec, flowFraction);
                                            const nextSec = br.sections[sIdx + 1];

                                            return (
                                                <g key={`br-${br.key}-sec-${sec.id || sIdx}`}>
                                                    <path d={`M ${bx} ${startY} L ${bx} ${endY}`} fill="none" stroke="#9184d9" strokeWidth={3.5} strokeDasharray="10 5" className={printMode ? '' : 'flow-animated'} />
                                                    {nextSec && renderReductionCone(bx, endY, sec.diameter_mm, nextSec.diameter_mm, true)}
                                                    
                                                    {/* Branch info badge */}
                                                    <rect x={bx - 72} y={cy - 43} width={144} height={86} rx={6} fill="#161826" stroke="#9184d9" strokeWidth={1.5} />
                                                    <text x={bx} y={cy - 22} fill="#ffffff" fontSize={14} textAnchor="middle" fontWeight="600">
                                                        R{bIdx + 1}: {getNominalLabel(sec.diameter_mm)} · {num(sec.length_m)}m
                                                    </text>
                                                    <text x={bx} y={cy - 3} fill="#ffffff" fontSize={14} textAnchor="middle" fontWeight="600">
                                                        Q: {f(q, 1)} m³/h
                                                    </text>
                                                    <text x={bx} y={cy + 18} fill={getVelColor(v)} fontSize={14} textAnchor="middle" fontWeight="700">
                                                        V: {f(v, 2)} m/s
                                                    </text>
                                                    <text x={bx} y={cy + 37} fill="#a7a1db" fontSize={14} textAnchor="middle" fontWeight="700">
                                                        Δh: {f(loss, 2)}m
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </g>
                                );
                            })}
                        </g>
                    );
                })()}

                {/* 7. DISCHARGE AFTER SERIES & REDUCTIONS */}
                {(() => {
                    const startX = 580;
                    const endX = 780;
                    const totalWidth = endX - startX;
                    const count = Math.max(dischargeAfter.length, 1);
                    const segWidth = totalWidth / count;

                    return dischargeAfter.map((sec, idx) => {
                        const sx = startX + idx * segWidth;
                        const ex = startX + (idx + 1) * segWidth;
                        const cx = (sx + ex) / 2;
                        const cy = idx % 2 === 0 ? 55 : 185;
                        const { v, loss, q } = getSectionMetrics(sec);
                        const nextSec = dischargeAfter[idx + 1];

                        return (
                            <g key={`da-${sec.id || idx}`}>
                                <path d={`M ${sx} 110 L ${ex} 110`} fill="none" stroke="#9184d9" strokeWidth={4} strokeDasharray="12 6" className={printMode ? '' : 'flow-animated'} />
                                {nextSec && renderReductionCone(ex, 110, sec.diameter_mm, nextSec.diameter_mm, false)}
                                {/* Section label badge */}
                                <rect x={cx - 72} y={cy - 43} width={144} height={86} rx={6} fill="#1e2030" stroke="#9184d9" strokeWidth={1.5} />
                                <text x={cx} y={cy - 22} fill="#ffffff" fontSize={14} textAnchor="middle" fontWeight="600">
                                    {getNominalLabel(sec.diameter_mm)} · {num(sec.length_m)}m
                                </text>
                                <text x={cx} y={cy - 3} fill="#ffffff" fontSize={14} textAnchor="middle" fontWeight="600">
                                    Q: {f(q, 1)} m³/h
                                </text>
                                <text x={cx} y={cy + 18} fill={getVelColor(v)} fontSize={14} textAnchor="middle" fontWeight="700">
                                    V: {f(v, 2)} m/s
                                </text>
                                <text x={cx} y={cy + 37} fill="#a7a1db" fontSize={14} textAnchor="middle" fontWeight="700">
                                    Δh: {f(loss, 2)}m
                                </text>
                                <line x1={cx} y1={idx % 2 === 0 ? cy + 43 : cy - 43} x2={cx} y2={idx % 2 === 0 ? 108 : 112} stroke="#9184d9" strokeWidth={1.5} strokeDasharray="2 2" />
                            </g>
                        );
                    });
                })()}

                {/* 8. DIMENSION LINE (Static Head ΔZ) */}
                <line x1={895} y1={510} x2={895} y2={20} stroke="var(--color-neutral-700, #b2b6ca)" strokeWidth={1.5} strokeDasharray="4 4" />
                <path d="M 890 28 L 895 20 L 900 28 M 890 504 L 895 512 L 900 504" fill="none" stroke="var(--color-neutral-700, #b2b6ca)" strokeWidth={1.5} />
                <text x={885} y={260} fill="var(--color-neutral-400, #595d6c)" fontSize={14} fontWeight="600" textAnchor="end">ΔZ (Desnível):</text>
                <text x={885} y={285} fill="#ffffff" fontSize={17} fontWeight="700" textAnchor="end">{f(staticHead, 1)}m</text>
            </svg>
        </div>
    );
};
