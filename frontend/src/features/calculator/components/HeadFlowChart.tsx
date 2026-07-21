import React from 'react';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
    ReferenceDot
} from 'recharts';
import { OperatingPointResult } from '@/types/engineering';
import { useSystemStore } from '@/features/calculator/stores/useSystemStore';

interface HeadFlowChartProps {
    data: any[];
    operatingPoint: OperatingPointResult | null;
    printMode?: boolean;
}

export const HeadFlowChart: React.FC<HeadFlowChartProps> = ({ data, operatingPoint, printMode = false }) => {
    const uiTheme = useSystemStore(state => state.uiTheme);
    const isLight = printMode || uiTheme === 'light';

    // Style Constants - High Quality (Scaled for 1200x900)
    const axisFontSize = printMode ? 24 : 12;
    const labelFontSize = printMode ? 28 : 14;
    const legendFontSize = printMode ? 28 : 14;
    const lineWidth = printMode ? 4 : 2;
    const dotSize = printMode ? 6 : 4;
    const gridStroke = isLight ? "#e2e8f0" : "rgba(255,255,255,0.15)";
    const labelFill = isLight ? '#333' : '#fff';
    const tickFill = isLight ? '#666' : '#ccc';

    const chartMargins = printMode
        ? { top: 40, right: 60, left: 100, bottom: 120 }
        : { top: 20, right: 30, left: 10, bottom: 10 };

    const containerClass = printMode
        ? "h-full w-full relative block"
        : "h-full w-full relative flex flex-col";

    const innerClass = printMode
        ? "h-full w-full relative flex flex-col items-center justify-center" // Centered flex for legend alignment
        : "flex-1 min-h-0 w-full relative";

    return (
        <div className={containerClass}>
            {/* Title for both Print and Screen modes, styled differently */}
            {printMode ? (
                <h3 className="text-black font-sans mb-8 text-center w-full" style={{ fontSize: '64px', fontWeight: 'bold', fontFamily: 'sans-serif', textAlign: 'center' }}>
                    System vs Pump Curve
                </h3>
            ) : (
                <h4 className="text-sm font-semibold text-slate-500 mb-2 text-center uppercase tracking-wider flex-none">
                    System Analysis
                </h4>
            )}

            <div className={innerClass}>
                {/* Print Mode OP Box: Absolute centered above legend */}
                {printMode && operatingPoint && (
                    <div
                        className="bg-white/90 rounded shadow-sm text-green-700 font-semibold absolute"
                        style={{ fontSize: legendFontSize, border: '2px solid #bbf7d0', padding: '12px 32px', fontFamily: 'sans-serif', textAlign: 'center', top: -35, left: '50%', transform: 'translateX(-50%)', zIndex: 10, whiteSpace: 'nowrap' }}
                    >
                        OP: {operatingPoint.flow_op.toFixed(1)} m³/h @ {operatingPoint.head_op.toFixed(1)} m
                    </div>
                )}
                
                <ResponsiveContainer width="100%" height={printMode ? "85%" : "100%"}>
                    <ComposedChart data={data} margin={chartMargins}>
                        <CartesianGrid stroke={gridStroke} />
                        <XAxis
                            dataKey="flow"
                            type="number"
                            unit=" m³/h"
                            domain={[0, 'auto']}
                            label={{ value: 'Flow Rate (m³/h)', position: 'insideBottom', offset: printMode ? -80 : -40, style: { fontSize: labelFontSize, fill: labelFill, fontWeight: 600 } }}
                            tick={{ fontSize: axisFontSize, fill: tickFill }}
                            tickFormatter={(val) => Math.round(val).toString()}
                            tickMargin={printMode ? 20 : 10}
                        />
                        <YAxis
                            label={{ value: 'Head (m)', angle: -90, position: 'insideLeft', style: { fontSize: labelFontSize, fill: labelFill, fontWeight: 600, textAnchor: 'middle' }, offset: printMode ? 0 : 10, dx: printMode ? -60 : -10 }}
                            domain={[0, 'auto']}
                            tick={{ fontSize: axisFontSize, fill: tickFill }}
                            tickFormatter={(val) => Math.round(val).toString()}
                            tickMargin={printMode ? 15 : 10}
                        />
                        <Tooltip
                            labelFormatter={(value) => `Flow: ${Number(value).toFixed(2)} m³/h`}
                            formatter={(value: any, name: any) => [
                                typeof value === 'number' ? value.toFixed(2) + ' m' : value,
                                name === 'pumpHead' ? 'Adjusted Pump' : name === 'basePumpHead' ? 'Base Pump' : 'System Head'
                            ]}
                            contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                            labelStyle={{ color: '#cbd5e1', fontWeight: 600, paddingBottom: '4px', borderBottom: '1px solid #334155', marginBottom: '4px' }}
                            itemStyle={{ fontWeight: 500 }}
                        />
                        {/* Legend: Centered and aligned */}
                        <Legend
                            verticalAlign="top"
                            height={printMode ? 70 : 40}
                            iconType="circle"
                            wrapperStyle={{ fontSize: legendFontSize, paddingTop: '0px', paddingBottom: printMode ? '40px' : '10px', display: 'flex', justifyContent: 'center', width: '100%', fontFamily: 'sans-serif' }}
                        />

                        {/* Adjusted Pump Curve */}
                        <Line
                            type="monotone"
                            dataKey="pumpHead"
                            stroke="#2563eb"
                            name="Adjusted Pump"
                            strokeWidth={lineWidth}
                            dot={{ r: dotSize, fill: '#2563eb' }}
                            connectNulls
                            isAnimationActive={false}
                        />

                        {/* Base Pump Curve (Option B) */}
                        <Line
                            type="monotone"
                            dataKey="basePumpHead"
                            stroke="#94a3b8"
                            name="Base Pump"
                            strokeWidth={lineWidth}
                            strokeDasharray="5 5"
                            dot={{ r: Math.max(0, dotSize - 2), fill: '#94a3b8' }}
                            connectNulls
                            isAnimationActive={false}
                            opacity={0.6}
                        />

                        {/* System Curve */}
                        <Line
                            type="monotone"
                            dataKey="systemHead"
                            stroke="#ef4444"
                            name="System Head"
                            strokeWidth={lineWidth}
                            dot={false}
                            connectNulls
                            isAnimationActive={false}
                        />

                        {operatingPoint && (
                            <>
                                <ReferenceLine x={operatingPoint.flow_op} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={printMode ? 2 : 1} />
                                <ReferenceLine y={operatingPoint.head_op} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={printMode ? 2 : 1} />
                                <ReferenceDot x={operatingPoint.flow_op} y={operatingPoint.head_op} r={5} fill="#22c55e" stroke="#fff" strokeWidth={2} />
                            </>
                        )}

                    </ComposedChart>
                </ResponsiveContainer>

                {/* Screen Mode OP Label - Absolute positioned */}
                {!printMode && operatingPoint && (
                    <div
                        className={`bg-white/90 p-1.5 rounded border border-green-200 shadow-sm text-green-700 font-semibold pointer-events-none absolute`}
                        style={{ top: 8, right: 16, fontSize: '12px' }}
                    >
                        OP: {operatingPoint.flow_op.toFixed(1)} m³/h @ {operatingPoint.head_op.toFixed(1)} m
                    </div>
                )}
            </div>
        </div>
    );
};
