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
    ReferenceLine
} from 'recharts';
import { OperatingPointResult } from '@/types/engineering';

interface HeadFlowChartProps {
    data: any[];
    operatingPoint: OperatingPointResult | null;
    printMode?: boolean;
}

export const HeadFlowChart: React.FC<HeadFlowChartProps> = ({ data, operatingPoint, printMode = false }) => {
    // Style Constants - High Quality (Scaled for 1200x900)
    const axisFontSize = printMode ? 24 : 12;
    const labelFontSize = printMode ? 28 : 14;
    const legendFontSize = printMode ? 28 : 14;
    const lineWidth = printMode ? 4 : 2;
    const dotSize = printMode ? 6 : 4;
    const gridStroke = printMode ? "#ccc" : "#e2e8f0";

    const chartMargins = printMode
        ? { top: 40, right: 60, left: 100, bottom: 90 }
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
                <h3 className="text-[#2980b9] font-sans mb-8 ml-12" style={{ fontSize: '64px', fontWeight: 'bold' }}>
                    System vs Pump Curve
                </h3>
            ) : (
                <h4 className="text-sm font-semibold text-slate-500 mb-2 text-center uppercase tracking-wider flex-none">
                    System vs Pump Head
                </h4>
            )}
            <div className={innerClass}>
                <ResponsiveContainer width="100%" height={printMode ? "85%" : "100%"}>
                    <ComposedChart data={data} margin={chartMargins}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis
                            dataKey="flow"
                            type="number"
                            unit=" m³/h"
                            domain={['dataMin', 'dataMax']}
                            label={{ value: 'Flow Rate (m³/h)', position: 'insideBottom', offset: printMode ? -60 : -40, style: { fontSize: labelFontSize, fill: '#333', fontWeight: 600 } }}
                            tick={{ fontSize: axisFontSize, fill: '#666' }}
                            tickMargin={printMode ? 20 : 10}
                        />
                        <YAxis
                            label={{ value: 'Head (m)', angle: -90, position: 'insideLeft', style: { fontSize: labelFontSize, fill: '#333', fontWeight: 600, textAnchor: 'middle' }, offset: printMode ? 0 : 10, dx: printMode ? -60 : -10 }}
                            domain={[0, 'auto']}
                            tick={{ fontSize: axisFontSize, fill: '#666' }}
                            tickMargin={printMode ? 15 : 10}
                        />
                        <Tooltip
                            labelFormatter={(value) => `Flow: ${Number(value).toFixed(2)} m³/h`}
                            formatter={(value: any, name: any) => [
                                typeof value === 'number' ? value.toFixed(2) + ' m' : value,
                                name === 'pumpHead' ? 'Pump Head' : 'System Head'
                            ]}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        {/* Legend: Centered and aligned */}
                        <Legend
                            verticalAlign="top"
                            height={printMode ? 70 : 40}
                            iconType="circle"
                            wrapperStyle={{ fontSize: legendFontSize, paddingTop: '0px', paddingBottom: printMode ? '40px' : '10px', display: 'flex', justifyContent: 'center', width: '100%' }}
                        />

                        {/* Pump Curve */}
                        <Line
                            type="monotone"
                            dataKey="pumpHead"
                            stroke="#2563eb"
                            name="Pump Head"
                            strokeWidth={lineWidth}
                            dot={{ r: dotSize, fill: '#2563eb' }}
                            connectNulls
                            isAnimationActive={false}
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
                            <ReferenceLine x={operatingPoint.flow_op} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={printMode ? 2 : 1} />
                        )}
                        {operatingPoint && (
                            <ReferenceLine y={operatingPoint.head_op} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={printMode ? 2 : 1} />
                        )}

                    </ComposedChart>
                </ResponsiveContainer>

                {/* OP Label - Aligned with Legend if possible, or placed clearly */}
                {operatingPoint && (
                    <div
                        className={`bg-white/90 p-1.5 rounded border border-green-200 shadow-sm text-green-700 font-semibold pointer-events-none`}
                        style={printMode ? { fontSize: legendFontSize, border: '2px solid #bbf7d0', position: 'absolute', top: 5, right: 40, padding: '16px' } : { position: 'absolute', top: 8, right: 16, fontSize: '12px' }}
                    >
                        OP: {operatingPoint.flow_op.toFixed(1)} m³/h @ {operatingPoint.head_op.toFixed(1)} m
                    </div>
                )}
            </div>
        </div>
    );
};
