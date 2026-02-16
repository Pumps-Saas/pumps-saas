import React, { useMemo } from 'react';
import { useSystemStore } from '../stores/useSystemStore';
import { OperatingPointResult } from '@/types/engineering';

interface SystemSchematicProps {
    result: OperatingPointResult | null;
    printMode?: boolean;
}

export const SystemSchematic: React.FC<SystemSchematicProps> = ({ result, printMode = false }) => {
    // Get Topology
    const suction = useSystemStore(state => state.suction_sections);
    const dischargeBefore = useSystemStore(state => state.discharge_sections_before);
    const dischargeParallel = useSystemStore(state => state.discharge_parallel_sections);
    const dischargeAfter = useSystemStore(state => state.discharge_sections_after);

    // Helpers
    const getResult = (id: string) => result?.details?.find(d => d.section_id === id);

    // SVG Constants


    // Style Multipliers (Refined for better balance)
    const textScale = printMode ? 1.8 : 1; // Reduced from 2.5
    const strokeScale = printMode ? 2.0 : 1;
    const baseFontSize = 10 * textScale;
    const headerFontSize = 12 * textScale;
    const strokeWidth = 1.5 * strokeScale;
    const heavyStroke = 2 * strokeScale;

    // Background Filter for Text (to prevent overlap)
    const textBgFilter = (
        <defs>
            <filter x="-0.1" y="0" width="1.2" height="1" id="solid-bg">
                <feFlood floodColor="white" result="bg" />
                <feMerge>
                    <feMergeNode in="bg" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <marker id="arrowhead" markerWidth={10 * strokeScale} markerHeight={7 * strokeScale} refX={9 * strokeScale} refY={3.5 * strokeScale} orient="auto">
                <polygon points={`0 0, ${10 * strokeScale} ${3.5 * strokeScale}, 0 ${7 * strokeScale}`} fill="black" />
            </marker>
        </defs>
    );

    const elements = useMemo(() => {
        const svgElements: React.ReactNode[] = [];
        let cursorX = 50;

        // --- Dynamic Spacing Logic ---
        // Goal: Keep diagram width constrained so icons remain large.
        // If we have many segments, we reduce the arrow length.
        const totalSegments = suction.length + dischargeBefore.length + dischargeAfter.length + (Object.keys(dischargeParallel).length > 0 ? 1 : 0);

        // Increasing distribution to use side white space and fix overlaps.
        // Base spacing 250 (was 210). Min 130 (was 95).
        let dynamicSpacing = 250;
        if (totalSegments > 2) {
            dynamicSpacing = Math.max(130, 250 - (totalSegments - 2) * 40);
        }

        const COMPONENT_SPACING = printMode ? 200 : dynamicSpacing;
        const TANK_WIDTH = 100;
        const PIPE_Y = 150;
        const PARALLEL_OFFSET = 100;

        // --- 1. Suction Tank (Blue Cylinder) ---
        // Cylinder Body
        svgElements.push(
            <g key="suction-tank" transform={`translate(${cursorX}, ${PIPE_Y - 35})`}>
                {/* Cylinder Side/Body */}
                <path d="M0,15 L0,55 A20,10 0 0,0 100,55 L100,15" fill="#add8e6" stroke="black" strokeWidth={strokeWidth} />
                {/* Cylinder Top (Ellipse) */}
                <ellipse cx="50" cy="15" rx="50" ry="10" fill="#bee3f8" stroke="black" strokeWidth={strokeWidth} />
                {/* Label */}
                <text x="50" y="35" textAnchor="middle" fontSize={baseFontSize} fontWeight="bold" fill="black">
                    <tspan x="50" dy="0">Reservatório</tspan>
                    <tspan x="50" dy={baseFontSize * 1.2}>Sucção</tspan>
                </text>
            </g>
        );
        cursorX += TANK_WIDTH;

        // Helper: Draw Pipe Segment
        const drawPipe = (startX: number, endX: number, y: number, name: string, id: string, labelYOffset = -25) => {
            const res = getResult(id);
            const midX = (startX + endX) / 2;

            // Line
            svgElements.push(
                <line key={`pipe-${id}`} x1={startX} y1={y} x2={endX} y2={y} stroke="black" strokeWidth={strokeWidth} markerEnd="url(#arrowhead)" />
            );

            // Label Box
            const currentLabelOffset = printMode ? labelYOffset * 1.8 : labelYOffset;

            svgElements.push(
                <text key={`label-${id}`} x={midX} y={y + currentLabelOffset} textAnchor="middle" fontSize={baseFontSize} fill="black" filter="url(#solid-bg)">
                    <tspan x={midX} dy="0" fontWeight="bold">{name}</tspan>
                    {res && (
                        <>
                            <tspan x={midX} dy={baseFontSize * 1.2}>{result?.flow_op.toFixed(1)} m³/h</tspan>
                            <tspan x={midX} dy={baseFontSize * 1.2}>{res.velocity_m_s.toFixed(2)} m/s</tspan>
                            <tspan x={midX} dy={baseFontSize * 1.2}>Perda: {res.total_loss_m.toFixed(2)} m</tspan>
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
        });

        // --- 3. Pump (Orange Circle) ---
        const pumpRadius = 40;
        const pumpCenterX = cursorX + pumpRadius;

        svgElements.push(
            <g key="pump" transform={`translate(${pumpCenterX}, ${PIPE_Y})`}>
                <circle r={pumpRadius} fill="#ffa500" stroke="black" strokeWidth={heavyStroke} />
                <text x="0" y="5" textAnchor="middle" fontSize={headerFontSize} fontWeight="bold" fill="black">Bomba</text>
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
            // Shorter branch length too
            const branchLength = Math.max(260, COMPONENT_SPACING + 130);
            const mergeX = splitX + branchLength;

            // Draw Split Pipe (Vertical)
            const topY = PIPE_Y - PARALLEL_OFFSET;
            const bottomY = PIPE_Y + PARALLEL_OFFSET;

            // Vertical Line at Split
            svgElements.push(
                <line key="split-vertical" x1={splitX} y1={topY} x2={splitX} y2={bottomY} stroke="black" strokeWidth={strokeWidth} />
            );
            // Dots
            svgElements.push(<circle key="split-dot" cx={splitX} cy={PIPE_Y} r={3 * strokeScale} fill="black" />);


            branchKeys.forEach((key, bIdx) => {
                const isTop = bIdx === 0;
                // If more than 2, this logic needs expansion, but for now 2 is typical.
                // Improve spacing if we have multiples
                const branchY = isTop ? topY : bottomY;
                const segments = dischargeParallel[key];
                const s = segments[0];

                if (s) {
                    drawPipe(splitX, mergeX, branchY, `${key}`, s.id, -20);
                } else {
                    // Empty Branch
                    svgElements.push(
                        <line key={`branch-empty-${key}`} x1={splitX} y1={branchY} x2={mergeX} y2={branchY} stroke="#94a3b8" strokeWidth={strokeWidth} strokeDasharray="4 4" />
                    );
                    svgElements.push(
                        <text key={`label-empty-${key}`} x={(splitX + mergeX) / 2} y={branchY - 10} textAnchor="middle" fontSize={baseFontSize} fill="#94a3b8" fontStyle="italic" filter="url(#solid-bg)">
                            {key} (Empty)
                        </text>
                    );
                }
            });

            // Vertical Line at Merge
            svgElements.push(
                <line key="merge-vertical" x1={mergeX} y1={topY} x2={mergeX} y2={bottomY} stroke="black" strokeWidth={strokeWidth} />
            );
            svgElements.push(<circle key="merge-dot" cx={mergeX} cy={PIPE_Y} r={3 * strokeScale} fill="black" />);

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
        const endTankCenterX = cursorX + endTankRadius;

        svgElements.push(
            <g key="end-tank" transform={`translate(${endTankCenterX}, ${PIPE_Y})`}>
                <circle r={endTankRadius} fill="#d1d5db" stroke="black" strokeWidth={heavyStroke} />
                <text x="0" y="5" textAnchor="middle" fontSize={headerFontSize} fontWeight="bold" fill="black">Fim</text>
            </g>
        );
        cursorX = endTankCenterX + endTankRadius;

        // Add extra padding at the end
        return { svgElements, totalWidth: cursorX + 100 };
    }, [suction, dischargeBefore, dischargeParallel, dischargeAfter, result, printMode, baseFontSize, headerFontSize, strokeWidth, heavyStroke]);

    return (
        <div style={{ width: '100%', background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <svg width="100%" height="auto" viewBox={`0 0 ${elements.totalWidth} 400`} preserveAspectRatio="xMidYMid meet">
                {textBgFilter}
                {elements.svgElements}
            </svg>
        </div>
    );
};
