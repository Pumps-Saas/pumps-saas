import React, { useMemo } from 'react';
import { useSystemStore } from '../stores/useSystemStore';
import { OperatingPointResult } from '@/types/engineering';

interface SystemSchematicProps {
    result: OperatingPointResult | null;
    printMode?: boolean;
}

// --- Isometric Math Utilities ---
const ANGLE = Math.PI / 6; // 30 degrees
const COS_A = Math.cos(ANGLE);
const SIN_A = Math.sin(ANGLE);

const isoX = (x: number, y: number) => (x - y) * COS_A;
const isoY = (x: number, y: number, z: number = 0) => (x + y) * SIN_A - z;

export const SystemSchematic: React.FC<SystemSchematicProps> = ({ result, printMode = false }) => {
    // Get Topology
    const suction = useSystemStore(state => state.suction_sections);
    const dischargeBefore = useSystemStore(state => state.discharge_sections_before);
    const dischargeParallel = useSystemStore(state => state.discharge_parallel_sections);
    const dischargeAfter = useSystemStore(state => state.discharge_sections_after);

    // Helpers
    const getResult = (id: string) => result?.details?.find(d => d.section_id === id);

    // --- Sizing Constants ---
    const textScale = printMode ? 1.5 : 1;
    const baseFontSize = 14 * textScale;
    const strokeScale = printMode ? 1.5 : 1;
    
    // Grid spacing
    const SEGMENT_LEN = 150;
    const BRANCH_SPACING = 100;

    const elements = useMemo(() => {
        const svgElements: React.ReactNode[] = [];
        
        // We will keep track of the current logical (x, y, z) position.
        let cx = 0;
        let cy = 0;
        let cz = 0;

        // Draw an Isometric Cylinder (Tank)
        const drawIsoTank = (key: string, x: number, y: number, z: number, r: number, h: number, color: string, label: string) => {
            const bx = isoX(x, y);
            const by = isoY(x, y, z);
            const ty = isoY(x, y, z + h);

            const rx = r * COS_A;
            const ry = r * SIN_A;

            const cTop = '#93c5fd';
            const cWall = color;

            svgElements.push(
                <g key={key}>
                    {/* Back half of bottom (hidden mostly) */}
                    <path d={`M ${bx - rx} ${by} A ${rx} ${ry} 0 0 1 ${bx + rx} ${by}`} fill="none" stroke="none" />
                    {/* Cylinder Body */}
                    <path d={`M ${bx - rx} ${by} L ${bx - rx} ${ty} A ${rx} ${ry} 0 0 0 ${bx + rx} ${ty} L ${bx + rx} ${by} A ${rx} ${ry} 0 0 1 ${bx - rx} ${by} Z`} fill={cWall} stroke="#1e3a8a" strokeWidth={1 * strokeScale} />
                    {/* Top Face */}
                    <ellipse cx={bx} cy={ty} rx={rx} ry={ry} fill={cTop} stroke="#1e3a8a" strokeWidth={1 * strokeScale} />
                    {/* Label */}
                    <text x={bx} y={ty - 20 * strokeScale} textAnchor="middle" fontSize={baseFontSize * 1.2} fontWeight="bold" fill="#1e293b">{label}</text>
                </g>
            );
        };

        // Draw Isometric Pump (Horizontal Cylinder)
        const drawIsoPump = (key: string, x: number, y: number, z: number, r: number, len: number) => {
            const bx = isoX(x, y);
            const by = isoY(x, y, z);
            const ex = isoX(x + len, y);
            const ey = isoY(x + len, y, z);
            
            const rx = r * SIN_A; // Simplified cross section for along X axis
            const ry = r;

            svgElements.push(
                <g key={key}>
                    {/* Pump Body */}
                    <path d={`M ${bx} ${by - ry} L ${ex} ${ey - ry} A ${rx} ${ry} 0 0 1 ${ex} ${ey + ry} L ${bx} ${by + ry} A ${rx} ${ry} 0 0 0 ${bx} ${by - ry} Z`} fill="#f59e0b" stroke="#92400e" strokeWidth={1.5 * strokeScale} />
                    {/* Pump Face */}
                    <ellipse cx={ex} cy={ey} rx={rx} ry={ry} fill="#fbbf24" stroke="#92400e" strokeWidth={1.5 * strokeScale} />
                    {/* Label */}
                    <text x={ex} y={ey - r - 10} textAnchor="middle" fontSize={baseFontSize * 1.2} fontWeight="bold" fill="#78350f">Pump</text>
                </g>
            );
        };

        // Draw Isometric Pipe
        const drawIsoPipe = (key: string, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, label: string, details?: string[]) => {
            const px1 = isoX(x1, y1);
            const py1 = isoY(x1, y1, z1);
            const px2 = isoX(x2, y2);
            const py2 = isoY(x2, y2, z2);

            const midX = (px1 + px2) / 2;
            const midY = (py1 + py2) / 2;

            // Thick line for pipe
            svgElements.push(
                <g key={key}>
                    <line x1={px1} y1={py1} x2={px2} y2={py2} stroke="#94a3b8" strokeWidth={12 * strokeScale} strokeLinecap="round" />
                    <line x1={px1} y1={py1} x2={px2} y2={py2} stroke="#cbd5e1" strokeWidth={6 * strokeScale} strokeLinecap="round" />
                    
                    {/* Label Background */}
                    <rect x={midX - 40} y={midY - 30} width={80} height={20 + (details ? details.length * 15 : 0)} fill="rgba(255,255,255,0.85)" rx={4} />
                    <text x={midX} y={midY - 15} textAnchor="middle" fontSize={baseFontSize} fontWeight="bold" fill="#334155">{label}</text>
                    {details && details.map((d, i) => (
                        <text key={i} x={midX} y={midY + (i * 15)} textAnchor="middle" fontSize={baseFontSize * 0.8} fill="#64748b">{d}</text>
                    ))}
                </g>
            );
        };


        // --- 1. Suction Tank ---
        drawIsoTank("tank-suction", cx, cy, cz, 40, 80, "#60a5fa", "Source");
        // Move forward a bit
        cx += 40;

        // --- 2. Suction Pipes ---
        suction.forEach((s, idx) => {
            const nextX = cx + SEGMENT_LEN;
            const res = getResult(s.id);
            const details = res ? [
                `${res.velocity_m_s.toFixed(2)} m/s`,
                `Loss: ${res.total_loss_m.toFixed(2)} m`
            ] : [];
            
            drawIsoPipe(`suc-${s.id}`, cx, cy, cz, nextX, cy, cz, s.name || `Suc ${idx+1}`, details);
            cx = nextX;
        });

        // --- 3. Pump ---
        drawIsoPump("main-pump", cx, cy, cz, 25, 60);
        cx += 60;

        // --- 4. Discharge Before ---
        dischargeBefore.forEach((s, idx) => {
            const nextX = cx + SEGMENT_LEN;
            const res = getResult(s.id);
            const details = res ? [
                `${res.velocity_m_s.toFixed(2)} m/s`,
                `Loss: ${res.total_loss_m.toFixed(2)} m`
            ] : [];
            
            drawIsoPipe(`disB-${s.id}`, cx, cy, cz, nextX, cy, cz, s.name || `Dis ${idx+1}`, details);
            cx = nextX;
        });

        // --- 5. Parallel Branches ---
        const branchKeys = Object.keys(dischargeParallel);
        if (branchKeys.length > 0) {
            const startX = cx;
            const branchLenX = SEGMENT_LEN;
            const endX = startX + branchLenX;

            branchKeys.forEach((key, bIdx) => {
                // Offset Y based on branch index (first branch goes +Y, second goes -Y, etc)
                // If 1 branch: Y=0. If 2 branches: Y= -50, +50.
                const offsetMultiplier = bIdx - (branchKeys.length - 1) / 2;
                const branchY = cy + (offsetMultiplier * BRANCH_SPACING);

                // Draw connector to branch Y
                drawIsoPipe(`conn-in-${key}`, startX, cy, cz, startX, branchY, cz, "");

                // Draw branch pipe along X
                const segments = dischargeParallel[key];
                const s = segments[0];
                if (s) {
                    const res = getResult(s.id);
                    const details = res ? [
                        `${res.velocity_m_s.toFixed(2)} m/s`,
                        `Loss: ${res.total_loss_m.toFixed(2)} m`
                    ] : [];
                    drawIsoPipe(`par-${s.id}`, startX, branchY, cz, endX, branchY, cz, key, details);
                } else {
                    // Empty branch line
                    drawIsoPipe(`par-empty-${key}`, startX, branchY, cz, endX, branchY, cz, `${key} (Empty)`);
                }

                // Draw connector back to main line
                drawIsoPipe(`conn-out-${key}`, endX, branchY, cz, endX, cy, cz, "");
            });
            cx = endX;
        }

        // --- 6. Discharge After ---
        dischargeAfter.forEach((s, idx) => {
            const nextX = cx + SEGMENT_LEN;
            const res = getResult(s.id);
            const details = res ? [
                `${res.velocity_m_s.toFixed(2)} m/s`,
                `Loss: ${res.total_loss_m.toFixed(2)} m`
            ] : [];
            
            drawIsoPipe(`disA-${s.id}`, cx, cy, cz, nextX, cy, cz, s.name || `Fin ${idx+1}`, details);
            cx = nextX;
        });

        // --- 7. Discharge Tank ---
        cx += 20; // small gap
        cz += 40; // End tank usually higher, let's put it higher visually
        drawIsoTank("tank-discharge", cx, cy, cz, 40, 80, "#9ca3af", "Destination");

        // Calculate bounding box to center the SVG
        // cx is max X. cy range is depending on branches. cz is max Z.
        // The iso projection bounding box:
        const minIsoX = isoX(0, branchKeys.length > 0 ? (branchKeys.length * BRANCH_SPACING) : 0);
        const maxIsoX = isoX(cx + 80, branchKeys.length > 0 ? -(branchKeys.length * BRANCH_SPACING) : 0);
        
        const minIsoY = isoY(0, branchKeys.length > 0 ? -(branchKeys.length * BRANCH_SPACING) : 0, cz + 100);
        const maxIsoY = isoY(cx + 80, branchKeys.length > 0 ? (branchKeys.length * BRANCH_SPACING) : 0, 0);

        const width = maxIsoX - minIsoX + 200;
        const height = maxIsoY - minIsoY + 200;

        return { 
            svgElements, 
            viewBox: `${minIsoX - 100} ${minIsoY - 100} ${width} ${height}`,
            width, height
        };
    }, [suction, dischargeBefore, dischargeParallel, dischargeAfter, result, printMode, baseFontSize, strokeScale]);

    return (
        <div style={{ width: '100%', height: '100%', background: 'white', borderRadius: '8px' }} className="flex items-center justify-center">
            <svg width="100%" height="100%" viewBox={elements.viewBox} preserveAspectRatio="xMidYMid meet" style={{ minHeight: '400px' }}>
                {/* Optional grid background or floor plane can be added here */}
                <polygon points={`${isoX(-100, -200)},${isoY(-100, -200, -20)} ${isoX(1000, -200)},${isoY(1000, -200, -20)} ${isoX(1000, 200)},${isoY(1000, 200, -20)} ${isoX(-100, 200)},${isoY(-100, 200, -20)}`} fill="#f1f5f9" stroke="#e2e8f0" />
                {elements.svgElements}
            </svg>
        </div>
    );
};
