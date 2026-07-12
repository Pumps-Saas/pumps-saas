import React from 'react';
import { useSystemStore } from '../stores/useSystemStore';
import { OperatingPointResult } from '@/types/engineering';

interface SystemSchematicProps {
    result: OperatingPointResult | null;
    printMode?: boolean;
}

export const SystemSchematic: React.FC<SystemSchematicProps> = ({ result, printMode = false }) => {
    // Get store values to populate live velocities & heights if available
    const suctionSections = useSystemStore(state => state.suction_sections || []);
    const dischargeBefore = useSystemStore(state => state.discharge_sections_before || []);
    const dischargeParallel = useSystemStore(state => state.discharge_parallel_sections || {});
    const dischargeAfter = useSystemStore(state => state.discharge_sections_after || []);
    const staticHead = useSystemStore(state => state.static_head || 10);

    // Flow fallback or calculation result
    const fallbackFlow = useSystemStore(state => state.pump_curve?.[0]?.flow || 50);
    const flowM3h = result?.flow_op ?? fallbackFlow;

    // Helper to calculate velocity from diameter and flow
    const calcVel = (diameterMm: number, flow: number) => {
        if (!diameterMm || diameterMm <= 0) return 0;
        const area = Math.PI * Math.pow(diameterMm / 1000 / 2, 2);
        return (flow / 3600) / area;
    };

    // 1. Suction summary
    const totalSucLen = suctionSections.reduce((acc, s) => acc + (s.length_m || 0), 0) || 5;
    const mainSuction = suctionSections[0] || { diameter_mm: 100, length_m: 5, id: 'suction' };
    let vSuc = 0;
    if (result?.details) {
        const sucDetail = result.details.find(d => d.section_id === mainSuction.id || d.section_id.includes('suction'));
        if (sucDetail?.velocity_m_s) vSuc = sucDetail.velocity_m_s;
    }
    if (vSuc === 0) vSuc = calcVel(mainSuction.diameter_mm, flowM3h);

    // 2. Discharge Before summary
    const totalBeforeLen = dischargeBefore.reduce((acc, s) => acc + (s.length_m || 0), 0);
    const firstBefore = dischargeBefore[0];
    let vBefore = 0;
    if (firstBefore) {
        if (result?.details) {
            const dDetail = result.details.find(d => d.section_id === firstBefore.id);
            if (dDetail?.velocity_m_s) vBefore = dDetail.velocity_m_s;
        }
        if (vBefore === 0) vBefore = calcVel(firstBefore.diameter_mm, flowM3h);
    }

    // 3. Discharge Parallel summary
    const parallelKeys = Object.keys(dischargeParallel);
    const parallelCount = parallelKeys.length;
    const firstBranchSection = parallelCount > 0 ? dischargeParallel[parallelKeys[0]]?.[0] : null;
    let vParallel = 0;
    if (firstBranchSection) {
        if (result?.details) {
            const pDetail = result.details.find(d => d.section_id === firstBranchSection.id);
            if (pDetail?.velocity_m_s) vParallel = pDetail.velocity_m_s;
        }
        // Em paralelo a vazão divide pelo número de ramais
        if (vParallel === 0) vParallel = calcVel(firstBranchSection.diameter_mm, flowM3h / Math.max(parallelCount, 1));
    }

    // 4. Discharge After summary
    const totalAfterLen = dischargeAfter.reduce((acc, s) => acc + (s.length_m || 0), 0);
    const firstAfter = dischargeAfter[0];
    let vAfter = 0;
    if (firstAfter) {
        if (result?.details) {
            const aDetail = result.details.find(d => d.section_id === firstAfter.id);
            if (aDetail?.velocity_m_s) vAfter = aDetail.velocity_m_s;
        }
        if (vAfter === 0) vAfter = calcVel(firstAfter.diameter_mm, flowM3h);
    }

    // Fallback general discharge if before/parallel/after not filled explicitly
    const mainDischarge = firstBefore || firstBranchSection || firstAfter || { diameter_mm: 80, length_m: 20 };
    let vDisGeneral = vBefore || vParallel || vAfter;
    if (vDisGeneral === 0) vDisGeneral = calcVel(mainDischarge.diameter_mm, flowM3h);

    // Color code velocity based on recommended range [0.6 - 2.5 m/s]
    const getVelColor = (v: number) => {
        if (v <= 0) return 'var(--color-neutral-400)';
        if (v > 2.5 || v < 0.6) return '#e0a94b'; // warning (yellow/amber)
        return '#5fd08a'; // good (green)
    };

    const vSucColor = getVelColor(vSuc);

    // Format helpers
    const f = (n: number, dec = 2) => isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const num = (n: number) => isNaN(n) ? '0' : Math.round(n).toString();

    // Static head split estimate for display (hs vs hd)
    const hs = Math.min(Math.max(staticHead * 0.2, 1), 5);
    const hd = Math.max(staticHead - hs, 0);

    return (
        <div className="w-full bg-[var(--color-surface)] rounded-xl border border-[var(--color-divider)] p-4 relative overflow-hidden">
            {/* Inline CSS animation for flow and pump rotation */}
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
                    transform-origin: 172px 200px;
                    animation: bmbSpin 3.5s linear infinite;
                }
            `}} />

            <svg 
                viewBox="0 0 380 240" 
                className="w-full h-auto block select-none"
                style={{ maxHeight: printMode ? '220px' : '260px' }}
            >
                {/* Suction Tank */}
                <rect x={12} y={150} width={78} height={70} rx={4} fill="none" stroke="var(--color-neutral-600, #75798c)" strokeWidth={1.5} />
                <rect x={14} y={178} width={74} height={40} fill="color-mix(in srgb, #9184d9 22%, transparent)" />
                <text x={51} y={234} fill="var(--color-neutral-500, #75798c)" fontSize={9} textAnchor="middle" fontWeight="500">Sucção</text>

                {/* Discharge Tank */}
                <rect x={300} y={22} width={70} height={66} rx={4} fill="none" stroke="var(--color-neutral-600, #75798c)" strokeWidth={1.5} />
                <rect x={302} y={40} width={66} height={46} fill="color-mix(in srgb, #9184d9 22%, transparent)" />
                <text x={335} y={102} fill="var(--color-neutral-500, #75798c)" fontSize={9} textAnchor="middle" fontWeight="500">Recalque</text>

                {/* Suction Pipe Path */}
                <path 
                    d="M 51 184 L 51 200 L 150 200" 
                    fill="none" 
                    stroke="#9184d9" 
                    strokeWidth={3} 
                    strokeDasharray="8 4"
                    className={printMode ? '' : 'flow-animated'}
                />

                {/* Pump Outer Circle */}
                <circle cx={172} cy={200} r={22} fill="var(--color-surface, #161826)" stroke="#9184d9" strokeWidth={2} />

                {/* Pump Inner Impeller Animation */}
                <g className={printMode ? '' : 'pump-spinning'}>
                    <path 
                        d="M 172 186 A 14 14 0 0 1 184 208 M 172 186 A 14 14 0 0 0 160 208 M 172 186 L 172 200" 
                        fill="none" 
                        stroke="#9184d9" 
                        strokeWidth={2} 
                    />
                </g>
                <text x={172} y={236} fill="#9184d9" fontSize={9} textAnchor="middle" fontWeight="700" letterSpacing="0.05em">BOMBA</text>

                {/* Discharge Pipe Path */}
                <path 
                    d="M 194 200 L 250 200 L 250 55 L 300 55" 
                    fill="none" 
                    stroke="#9184d9" 
                    strokeWidth={3} 
                    strokeDasharray="8 4"
                    className={printMode ? '' : 'flow-animated'}
                />

                {/* Suction Labels */}
                <text x={100} y={194} fill="var(--color-text, #ffffff)" fontSize={9} textAnchor="middle" fontFamily="var(--font-mono, monospace)">
                    DN {num(mainSuction.diameter_mm)} · {num(totalSucLen)}m{suctionSections.length > 1 ? ` (${suctionSections.length}tr)` : ''}
                </text>
                <text x={100} y={214} fill={vSucColor} fontSize={10} textAnchor="middle" fontWeight="700" fontFamily="var(--font-mono, monospace)">
                    {f(vSuc, 2)} m/s
                </text>

                {/* Discharge Labels: Dynamic representation based on sections present */}
                {firstBefore ? (
                    <>
                        {/* Trecho Antes da Bifurcação (saída da bomba) */}
                        <text x={222} y={185} fill="var(--color-text, #ffffff)" fontSize={8.5} textAnchor="middle" fontFamily="var(--font-mono, monospace)">
                            Antes: DN {num(firstBefore.diameter_mm)} · {num(totalBeforeLen)}m
                        </text>
                        <text x={222} y={196} fill={getVelColor(vBefore)} fontSize={8.5} textAnchor="middle" fontWeight="700" fontFamily="var(--font-mono, monospace)">
                            {f(vBefore, 2)} m/s
                        </text>
                    </>
                ) : null}

                {parallelCount > 0 ? (
                    /* Badge ou indicador de Ramais Paralelos no trecho vertical */
                    <g transform="translate(250, 130)">
                        <rect x={-45} y={-14} width={90} height={28} rx={6} fill="#1e2030" stroke="#9184d9" strokeWidth={1.2} />
                        <text x={0} y={-2} fill="var(--color-text, #ffffff)" fontSize={8.5} textAnchor="middle" fontWeight="700">
                            {parallelCount} Ramais ({num(firstBranchSection?.diameter_mm || 0)}mm)
                        </text>
                        <text x={0} y={9} fill={getVelColor(vParallel)} fontSize={8.5} textAnchor="middle" fontWeight="700" fontFamily="var(--font-mono, monospace)">
                            V: {f(vParallel, 2)} m/s
                        </text>
                    </g>
                ) : (
                    /* Caso sem paralelos, mostra informações gerais do recalque no trecho vertical */
                    <>
                        <text x={268} y={130} fill="var(--color-text, #ffffff)" fontSize={9} textAnchor="middle" fontFamily="var(--font-mono, monospace)">
                            DN {num(mainDischarge.diameter_mm)}
                        </text>
                        <text x={268} y={145} fill="var(--color-text, #ffffff)" fontSize={9} textAnchor="middle" fontFamily="var(--font-mono, monospace)">
                            {num(firstBefore ? (mainDischarge.length_m || 20) : (totalBeforeLen + totalAfterLen || mainDischarge.length_m || 20))}m
                        </text>
                        <text x={268} y={162} fill={getVelColor(vDisGeneral)} fontSize={10} textAnchor="middle" fontWeight="700" fontFamily="var(--font-mono, monospace)">
                            {f(vDisGeneral, 2)} m/s
                        </text>
                    </>
                )}

                {firstAfter ? (
                    <>
                        {/* Trecho Após Junção (entrada do reservatório) */}
                        <text x={275} y={42} fill="var(--color-text, #ffffff)" fontSize={8.5} textAnchor="middle" fontFamily="var(--font-mono, monospace)">
                            Após: DN {num(firstAfter.diameter_mm)} · {num(totalAfterLen)}m
                        </text>
                        <text x={275} y={53} fill={getVelColor(vAfter)} fontSize={8.5} textAnchor="middle" fontWeight="700" fontFamily="var(--font-mono, monospace)">
                            {f(vAfter, 2)} m/s
                        </text>
                    </>
                ) : null}

                {/* hd Dimension Line */}
                <line x1={355} y1={200} x2={355} y2={88} stroke="var(--color-neutral-700, #b2b6ca)" strokeWidth={1} strokeDasharray="2 2" />
                <path d="M 352 92 L 355 86 L 358 92 M 352 196 L 355 202 L 358 196" fill="none" stroke="var(--color-neutral-700, #b2b6ca)" strokeWidth={1} />
                <text x={366} y={148} fill="var(--color-neutral-400, #595d6c)" fontSize={9} fontWeight="600">hd {f(hd, 1)}m</text>

                {/* hs Dimension Line */}
                <line x1={32} y1={200} x2={32} y2={178} stroke="var(--color-neutral-700, #b2b6ca)" strokeWidth={1} strokeDasharray="2 2" />
                <text x={22} y={192} fill="var(--color-neutral-400, #595d6c)" fontSize={9} fontWeight="600">hs {f(hs, 1)}m</text>
            </svg>
        </div>
    );
};
