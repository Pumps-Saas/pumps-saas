import React, { useMemo } from 'react';
import { useSystemStore } from '../stores/useSystemStore';
import { OperatingPointResult } from '@/types/engineering';

interface SystemSchematicProps {
    result: OperatingPointResult | null;
}

export const SystemSchematic: React.FC<SystemSchematicProps> = ({ result }) => {
    // Get Topology
    const suction = useSystemStore(state => state.suction_sections);
    const dischargeBefore = useSystemStore(state => state.discharge_sections_before);
    const dischargeParallel = useSystemStore(state => state.discharge_parallel_sections);
    const dischargeAfter = useSystemStore(state => state.discharge_sections_after);

    // Helpers
    const getResult = (id: string) => result?.details?.find(d => d.section_id === id);

    // SVG Constants
    const PIPE_Y = 150; // Main centerline Y
    const COMPONENT_SPACING = 300; // Spacing between major components
    const PARALLEL_OFFSET = 80; // Vertical offset for branches

    const elements = useMemo(() => {
        const svgElements: React.ReactNode[] = [];
        let cursorX = 50;

        // --- 1. Suction Tank (Blue Cylinder) ---
        // Cylinder Body
        svgElements.push(
            <g key="suction-tank" transform={`translate(${cursorX}, ${PIPE_Y - 35})`}>
                {/* Cylinder Side/Body */}
                <path d="M0,15 L0,55 A20,10 0 0,0 100,55 L100,15" fill="#add8e6" stroke="black" strokeWidth="1" />
                {/* Cylinder Top (Ellipse) */}
                <ellipse cx="50" cy="15" rx="50" ry="10" fill="#bee3f8" stroke="black" strokeWidth="1" />
                {/* Label */}
                <text x="50" y="35" textAnchor="middle" fontSize="10" fontWeight="bold" fill="black">
                    <tspan x="50" dy="0">Reservatório</tspan>
                    <tspan x="50" dy="12">Sucção</tspan>
                </text>
            </g>
        );
        cursorX += 100; // Tank Width

        // Helper: Draw Pipe Segment
        const drawPipe = (startX: number, endX: number, y: number, name: string, id: string, labelYOffset = -25) => {
            const res = getResult(id);
            const midX = (startX + endX) / 2;

            // Line
            svgElements.push(
                <line key={`pipe-${id}`} x1={startX} y1={y} x2={endX} y2={y} stroke="black" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
            );

            // Label Box (Invisible bg for spacing? No, transparent as requested)
            // Text
            svgElements.push(
                <text key={`label-${id}`} x={midX} y={y + labelYOffset} textAnchor="middle" fontSize="10" fill="black">
                    <tspan x={midX} dy="0" fontWeight="bold">{name}</tspan>
                    {res && (
                        <>
                            <tspan x={midX} dy="12">{result?.flow_op.toFixed(1)} m³/h</tspan>
                            <tspan x={midX} dy="12">{res.velocity_m_s.toFixed(2)} m/s</tspan>
                            <tspan x={midX} dy="12">Perda: {res.total_loss_m.toFixed(2)} m</tspan>
                        </>
                    )}
                </text>
            );
        };

        // --- 2. Suction Pipes ---
        suction.forEach((s, idx) => {
            const endX = cursorX + COMPONENT_SPACING;
            drawPipe(cursorX, endX, PIPE_Y, s.name || `Sucção ${idx + 1}`, s.id);
            cursorX = endX;
            // Junction Dot if not last (actually logic is segments are lines, so dot is automatic? No dots in print, just continuous line to pump)
            // Print shows continuous. We just move cursor.
        });

        // --- 3. Pump (Orange Circle) ---
        // Pump is centered on current cursorX + radius
        const pumpRadius = 40;
        const pumpCenterX = cursorX + pumpRadius;

        svgElements.push(
            <g key="pump" transform={`translate(${pumpCenterX}, ${PIPE_Y})`}>
                <circle r={pumpRadius} fill="#ffa500" stroke="black" strokeWidth="2" />
                <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="black">Bomba</text>
            </g>
        );
        cursorX = pumpCenterX + pumpRadius;


        // --- 4. Discharge Before ---
        dischargeBefore.forEach((s, idx) => {
            const endX = cursorX + COMPONENT_SPACING;
            drawPipe(cursorX, endX, PIPE_Y, s.name || `Recalque ${idx + 1}`, s.id);
            cursorX = endX;
        });


        // --- 5. Parallel Branches ---
        const branchKeys = Object.keys(dischargeParallel);
        if (branchKeys.length > 0) {
            const splitX = cursorX;
            const branchLength = COMPONENT_SPACING + 100;
            const mergeX = splitX + branchLength;

            // Draw Split Pipe (Vertical)
            // Top Y, Bottom Y
            const topY = PIPE_Y - PARALLEL_OFFSET;
            const bottomY = PIPE_Y + PARALLEL_OFFSET; // Assuming 2 branches for now based on print style

            // Vertical Line at Split
            svgElements.push(
                <line key="split-vertical" x1={splitX} y1={topY} x2={splitX} y2={bottomY} stroke="black" strokeWidth="1.5" />
            );
            // Dots at intersection?
            svgElements.push(<circle key="split-dot" cx={splitX} cy={PIPE_Y} r="3" fill="black" />);


            branchKeys.forEach((key, bIdx) => {
                const isTop = bIdx === 0;
                const branchY = isTop ? topY : bottomY;
                const segments = dischargeParallel[key];

                // For simplicity, visualizing the first segment of the branch on the horizontal run
                // Real schematic might need multiple segments chained. Assuming 1 for layout cleanliness.
                const s = segments[0];

                if (s) {
                    // Horizontal Line
                    drawPipe(splitX, mergeX, branchY, `${key} (${s.name})`, s.id, -20);
                } else {
                    // Empty Branch Placeholder
                    svgElements.push(
                        <line key={`branch-empty-${key}`} x1={splitX} y1={branchY} x2={mergeX} y2={branchY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 4" />
                    );
                    svgElements.push(
                        <text key={`label-empty-${key}`} x={(splitX + mergeX) / 2} y={branchY - 10} textAnchor="middle" fontSize="10" fill="#94a3b8" fontStyle="italic">
                            {key} (Empty)
                        </text>
                    );
                }

                // If there are more segments, we'd need to chain them inside the branch length. 
                // For now, simple representation.
            });

            // Vertical Line at Merge
            svgElements.push(
                <line key="merge-vertical" x1={mergeX} y1={topY} x2={mergeX} y2={bottomY} stroke="black" strokeWidth="1.5" />
            );
            svgElements.push(<circle key="merge-dot" cx={mergeX} cy={PIPE_Y} r="3" fill="black" />);

            cursorX = mergeX;
        }

        // --- 6. Discharge After ---
        dischargeAfter.forEach((s, idx) => {
            const endX = cursorX + COMPONENT_SPACING;
            drawPipe(cursorX, endX, PIPE_Y, s.name || `Final ${idx + 1}`, s.id);
            cursorX = endX;
        });

        // --- 7. Discharge Tank (Grey Circle) ---
        const endTankRadius = 35;
        const endTankCenterX = cursorX + endTankRadius; // Slight gap? No, consume line end.
        // Actually drawPipe went to cursorX.

        svgElements.push(
            <g key="end-tank" transform={`translate(${endTankCenterX}, ${PIPE_Y})`}>
                <circle r={endTankRadius} fill="#d1d5db" stroke="black" strokeWidth="2" />
                <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="black">Fim</text>
            </g>
        );
        cursorX = endTankCenterX + endTankRadius;

        return { svgElements, totalWidth: cursorX + 50 };
    }, [suction, dischargeBefore, dischargeParallel, dischargeAfter, result]);

    return (
        <div style={{ width: '100%', background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <svg width="100%" height="auto" viewBox={`0 0 ${elements.totalWidth} 300`} preserveAspectRatio="xMidYMid meet">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="black" />
                    </marker>
                </defs>
                {elements.svgElements}
            </svg>
        </div>
    );
};
