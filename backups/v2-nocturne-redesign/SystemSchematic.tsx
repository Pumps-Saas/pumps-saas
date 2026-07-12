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
        if (result?.details) {
            const detail = result.details.find(d => d.section_id === section.id);
            if (detail) {
                v = detail.velocity_m_s || 0;
                loss = detail.total_loss_m || 0;
            }
        }
        // Fallback live velocity & friction estimation if not yet calculated by backend
        if (v === 0 && section.diameter_mm > 0) {
            const area = Math.PI * Math.pow(section.diameter_mm / 1000 / 2, 2);
            v = ((flowM3h * branchFlowFraction) / 3600) / area;
        }
        if (loss === 0 && section.diameter_mm > 0 && v > 0) {
            const dM = section.diameter_mm / 1000;
            // Darcy-Weisbach simple approximation f ~ 0.02
            loss = 0.02 * ((section.length_m || 1) / dM) * (Math.pow(v, 2) / (2 * 9.81));
        }
        return { v, loss };
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
                    <text x={x} y={y - 14} fill="#e0a94b" fontSize={7} textAnchor="middle" fontWeight="700">
                        {label}
                    </text>
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
                    <text x={x + 16} y={y + 3} fill="#e0a94b" fontSize={7} textAnchor="start" fontWeight="700">
                        {label}
                    </text>
                </g>
            );
        }
    };

    return (
        <div className="w-full bg-[var(--color-surface)] rounded-xl border border-[var(--color-divider)] p-4 relative overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes bmbFlow {
                    from { stroke-dashoffset: 24; }
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
                    transform-origin: 220px 210px;
                    animation: bmbSpin 3.5s linear infinite;
                }
            `}} />

            <svg 
                viewBox="0 0 520 275" 
                className="w-full h-auto block select-none"
                style={{ maxHeight: printMode ? '240px' : '300px' }}
            >
                {/* 1. SUCTION TANK */}
                <rect x={15} y={165} width={70} height={70} rx={4} fill="none" stroke="var(--color-neutral-600, #75798c)" strokeWidth={1.5} />
                <rect x={17} y={190} width={66} height={43} fill="color-mix(in srgb, #9184d9 22%, transparent)" />
                <text x={50} y={248} fill="var(--color-neutral-500, #75798c)" fontSize={9} textAnchor="middle" fontWeight="600">Sucção</text>

                {/* 2. DISCHARGE TANK */}
                <rect x={430} y={25} width={70} height={65} rx={4} fill="none" stroke="var(--color-neutral-600, #75798c)" strokeWidth={1.5} />
                <rect x={432} y={40} width={66} height={48} fill="color-mix(in srgb, #9184d9 22%, transparent)" />
                <text x={465} y={102} fill="var(--color-neutral-500, #75798c)" fontSize={9} textAnchor="middle" fontWeight="600">Recalque</text>

                {/* 3. PUMP SYMBOL */}
                <circle cx={220} cy={210} r={22} fill="var(--color-surface, #161826)" stroke="#9184d9" strokeWidth={2} />
                <g className={printMode ? '' : 'pump-spinning'}>
                    <path d="M 220 196 A 14 14 0 0 1 232 218 M 220 196 A 14 14 0 0 0 208 218 M 220 196 L 220 210" fill="none" stroke="#9184d9" strokeWidth={2} />
                </g>
                <text x={220} y={246} fill="#9184d9" fontSize={9} textAnchor="middle" fontWeight="700" letterSpacing="0.05em">BOMBA</text>

                {/* 4. SUCTION PIPE SERIES & REDUCTIONS */}
                {(() => {
                    const startX = 85;
                    const endX = 198;
                    const totalWidth = endX - startX;
                    const count = Math.max(suctionSections.length, 1);
                    const segWidth = totalWidth / count;

                    return suctionSections.map((sec, idx) => {
                        const sx = startX + idx * segWidth;
                        const ex = startX + (idx + 1) * segWidth;
                        const cx = (sx + ex) / 2;
                        const { v, loss } = getSectionMetrics(sec);
                        const nextSec = suctionSections[idx + 1];

                        return (
                            <g key={`suc-${sec.id || idx}`}>
                                <path d={`M ${sx} 210 L ${ex} 210`} fill="none" stroke="#9184d9" strokeWidth={3} strokeDasharray="8 4" className={printMode ? '' : 'flow-animated'} />
                                {nextSec && renderReductionCone(ex, 210, sec.diameter_mm, nextSec.diameter_mm, false)}
                                {/* Section label badge */}
                                <rect x={cx - 36} y={166} width={72} height={36} rx={4} fill="#1e2030" stroke="#9184d9" strokeWidth={0.8} />
                                <text x={cx} y={176} fill="#ffffff" fontSize={7.5} textAnchor="middle" fontWeight="600">
                                    {getNominalLabel(sec.diameter_mm)} · {num(sec.length_m)}m
                                </text>
                                <text x={cx} y={187} fill={getVelColor(v)} fontSize={7.5} textAnchor="middle" fontWeight="700">
                                    V: {f(v, 2)} m/s
                                </text>
                                <text x={cx} y={197} fill="#a7a1db" fontSize={7} textAnchor="middle" fontFamily="monospace">
                                    Δh: {f(loss, 2)}m
                                </text>
                            </g>
                        );
                    });
                })()}

                {/* 5. DISCHARGE BEFORE SERIES & REDUCTIONS */}
                {(() => {
                    const startX = 242;
                    const endX = 330;
                    const totalWidth = endX - startX;
                    const count = Math.max(dischargeBefore.length, 1);
                    const segWidth = totalWidth / count;

                    return dischargeBefore.map((sec, idx) => {
                        const sx = startX + idx * segWidth;
                        const ex = startX + (idx + 1) * segWidth;
                        const cx = (sx + ex) / 2;
                        const { v, loss } = getSectionMetrics(sec);
                        const nextSec = dischargeBefore[idx + 1];

                        return (
                            <g key={`db-${sec.id || idx}`}>
                                <path d={`M ${sx} 210 L ${ex} 210`} fill="none" stroke="#9184d9" strokeWidth={3} strokeDasharray="8 4" className={printMode ? '' : 'flow-animated'} />
                                {nextSec && renderReductionCone(ex, 210, sec.diameter_mm, nextSec.diameter_mm, false)}
                                {/* Section label badge */}
                                <rect x={cx - 36} y={166} width={72} height={36} rx={4} fill="#1e2030" stroke="#9184d9" strokeWidth={0.8} />
                                <text x={cx} y={176} fill="#ffffff" fontSize={7.5} textAnchor="middle" fontWeight="600">
                                    {getNominalLabel(sec.diameter_mm)} · {num(sec.length_m)}m
                                </text>
                                <text x={cx} y={187} fill={getVelColor(v)} fontSize={7.5} textAnchor="middle" fontWeight="700">
                                    V: {f(v, 2)} m/s
                                </text>
                                <text x={cx} y={197} fill="#a7a1db" fontSize={7} textAnchor="middle" fontFamily="monospace">
                                    Δh: {f(loss, 2)}m
                                </text>
                            </g>
                        );
                    });
                })()}

                {/* 6. DISCHARGE PARALLEL BRANCHES OR VERTICAL RUN */}
                {(() => {
                    const turnX = 330;
                    if (parallelCount === 0) {
                        // Simple single vertical pipe run
                        return (
                            <g>
                                <path d={`M ${turnX} 210 L ${turnX} 65`} fill="none" stroke="#9184d9" strokeWidth={3} strokeDasharray="8 4" className={printMode ? '' : 'flow-animated'} />
                            </g>
                        );
                    }

                    // Multi-branch Manifold Bifurcation
                    const branches = parallelKeys.map(k => ({ key: k, sections: dischargeParallel[k] || [] }));
                    const spread = Math.min(68, 140 / parallelCount);
                    const flowFraction = 1 / Math.max(parallelCount, 1);

                    return (
                        <g>
                            {/* Bottom Manifold Split Header */}
                            <path d={`M ${turnX} 210 L ${turnX} 195`} fill="none" stroke="#9184d9" strokeWidth={3} />
                            {parallelCount > 1 && (
                                <path 
                                    d={`M ${turnX - ((parallelCount - 1) * spread) / 2} 195 L ${turnX + ((parallelCount - 1) * spread) / 2} 195`} 
                                    fill="none" stroke="#9184d9" strokeWidth={2.5} 
                                />
                            )}
                            <circle cx={turnX} cy={195} r={4} fill="#e0a94b" />
                            <text x={turnX - 10} y={226} fill="#e0a94b" fontSize={7.5} textAnchor="end" fontWeight="700">
                                Bifurcação ({parallelCount} Ramais)
                            </text>

                            {/* Top Manifold Join Header */}
                            <path d={`M ${turnX} 80 L ${turnX} 65`} fill="none" stroke="#9184d9" strokeWidth={3} />
                            {parallelCount > 1 && (
                                <path 
                                    d={`M ${turnX - ((parallelCount - 1) * spread) / 2} 80 L ${turnX + ((parallelCount - 1) * spread) / 2} 80`} 
                                    fill="none" stroke="#9184d9" strokeWidth={2.5} 
                                />
                            )}
                            <circle cx={turnX} cy={80} r={4} fill="#5fd08a" />

                            {/* Individual Parallel Branches */}
                            {branches.map((br, bIdx) => {
                                const bx = turnX + (bIdx - (parallelCount - 1) / 2) * spread;
                                const firstSec = br.sections[0] || { diameter_mm: 50, length_m: 10, id: `br-${bIdx}` };
                                const { v, loss } = getSectionMetrics(firstSec, flowFraction);

                                return (
                                    <g key={`branch-${br.key}`}>
                                        <path d={`M ${bx} 195 L ${bx} 80`} fill="none" stroke="#9184d9" strokeWidth={2.2} strokeDasharray="6 3" className={printMode ? '' : 'flow-animated'} />
                                        {/* Branch info badge */}
                                        <rect x={bx - 32} y={122} width={64} height={38} rx={4} fill="#161826" stroke="#9184d9" strokeWidth={1} />
                                        <text x={bx} y={132} fill="#ffffff" fontSize={7} textAnchor="middle" fontWeight="600">
                                            R{bIdx + 1}: {getNominalLabel(firstSec.diameter_mm)}
                                        </text>
                                        <text x={bx} y={143} fill={getVelColor(v)} fontSize={7.5} textAnchor="middle" fontWeight="700">
                                            V: {f(v, 2)} m/s
                                        </text>
                                        <text x={bx} y={154} fill="#a7a1db" fontSize={7} textAnchor="middle" fontFamily="monospace">
                                            Δh: {f(loss, 2)}m
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                    );
                })()}

                {/* 7. DISCHARGE AFTER SERIES & REDUCTIONS */}
                {(() => {
                    const startX = 330;
                    const endX = 430;
                    const totalWidth = endX - startX;
                    const count = Math.max(dischargeAfter.length, 1);
                    const segWidth = totalWidth / count;

                    return dischargeAfter.map((sec, idx) => {
                        const sx = startX + idx * segWidth;
                        const ex = startX + (idx + 1) * segWidth;
                        const cx = (sx + ex) / 2;
                        const { v, loss } = getSectionMetrics(sec);
                        const nextSec = dischargeAfter[idx + 1];

                        return (
                            <g key={`da-${sec.id || idx}`}>
                                <path d={`M ${sx} 65 L ${ex} 65`} fill="none" stroke="#9184d9" strokeWidth={3} strokeDasharray="8 4" className={printMode ? '' : 'flow-animated'} />
                                {nextSec && renderReductionCone(ex, 65, sec.diameter_mm, nextSec.diameter_mm, false)}
                                {/* Section label badge */}
                                <rect x={cx - 36} y={20} width={72} height={36} rx={4} fill="#1e2030" stroke="#9184d9" strokeWidth={0.8} />
                                <text x={cx} y={30} fill="#ffffff" fontSize={7.5} textAnchor="middle" fontWeight="600">
                                    {getNominalLabel(sec.diameter_mm)} · {num(sec.length_m)}m
                                </text>
                                <text x={cx} y={41} fill={getVelColor(v)} fontSize={7.5} textAnchor="middle" fontWeight="700">
                                    V: {f(v, 2)} m/s
                                </text>
                                <text x={cx} y={51} fill="#a7a1db" fontSize={7} textAnchor="middle" fontFamily="monospace">
                                    Δh: {f(loss, 2)}m
                                </text>
                            </g>
                        );
                    });
                })()}

                {/* 8. DIMENSION LINE (Static Head ΔZ) */}
                <line x1={495} y1={210} x2={495} y2={88} stroke="var(--color-neutral-700, #b2b6ca)" strokeWidth={1} strokeDasharray="2 2" />
                <path d="M 492 92 L 495 86 L 498 92 M 492 206 L 495 212 L 498 206" fill="none" stroke="var(--color-neutral-700, #b2b6ca)" strokeWidth={1} />
                <text x={506} y={146} fill="var(--color-neutral-400, #595d6c)" fontSize={8.5} fontWeight="600">ΔZ (Desnível):</text>
                <text x={506} y={157} fill="#ffffff" fontSize={9.5} fontWeight="700">{f(staticHead, 1)}m</text>
            </svg>
        </div>
    );
};
