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

interface NPSHChartProps {
    data: any[];
    operatingPoint: OperatingPointResult | null;
    printMode?: boolean;
}

export const NPSHChart: React.FC<NPSHChartProps> = ({ data, operatingPoint, printMode = false }) => {
    // Style Constants
    const axisFontSize = printMode ? 30 : 12;
    const labelFontSize = printMode ? 36 : 14;
    const legendFontSize = printMode ? 32 : 14;
    const lineWidth = printMode ? 5 : 2;
    const dotSize = printMode ? 10 : 4;
    const gridStroke = printMode ? "#ccc" : "#e2e8f0";

    const containerClass = printMode
        ? "h-full w-full relative block"
        : "h-full w-full relative flex flex-col";

    const innerClass = printMode
        ? "h-full w-full relative"
        : "flex-1 min-h-0 w-full relative";

    return (
        <div className={containerClass}>
            {!printMode && (
                <h4 className="text-sm font-semibold text-slate-500 mb-2 text-center uppercase tracking-wider flex-none">
                    NPSH Analysis
                </h4>
            )}
            <div className={innerClass}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis
                            dataKey="flow"
                            type="number"
                            unit=" m³/h"
                            domain={['dataMin', 'dataMax']}
                            label={{ value: 'Flow Rate (m³/h)', position: 'insideBottom', offset: -10, style: { fontSize: labelFontSize, fill: '#333', fontWeight: 600 } }}
                            tick={{ fontSize: axisFontSize, fill: '#666' }}
                            tickMargin={10}
                        />
                        <YAxis
                            label={{ value: 'NPSH (m)', angle: -90, position: 'insideLeft', style: { fontSize: labelFontSize, fill: '#333', fontWeight: 600 }, offset: 10 }}
                            domain={[0, 'auto']}
                            tick={{ fontSize: axisFontSize, fill: '#666' }}
                            tickMargin={10}
                        />
                        <Tooltip
                            labelFormatter={(value) => `Flow: ${Number(value).toFixed(2)} m³/h`}
                            formatter={(value: any, name: any) => [
                                typeof value === 'number' ? value.toFixed(2) + ' m' : value,
                                name === 'npshAvailable' ? 'NPSH Available' : 'NPSH Required'
                            ]}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ fontSize: legendFontSize, paddingTop: printMode ? '20px' : '0' }} />

                        {/* NPSH Available */}
                        <Line
                            type="monotone"
                            dataKey="npshAvailable"
                            stroke="#10b981" // Emerald 500
                            name="NPSH Available"
                            strokeWidth={lineWidth}
                            strokeDasharray="5 5"
                            dot={false}
                            connectNulls
                            isAnimationActive={false}
                        />

                        {/* NPSH Required */}
                        <Line
                            type="monotone"
                            dataKey="npshRequired"
                            stroke="#f59e0b" // Amber 500
                            name="NPSH Required"
                            strokeWidth={lineWidth}
                            strokeDasharray="3 3"
                            dot={{ r: dotSize, fill: '#f59e0b' }}
                            connectNulls
                            isAnimationActive={false}
                        />


                        {operatingPoint && (
                            <ReferenceLine x={operatingPoint.flow_op} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={printMode ? 3 : 1} />
                        )}

                        {operatingPoint && operatingPoint.npsh_available && (
                            <ReferenceLine y={operatingPoint.npsh_available} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} strokeWidth={printMode ? 3 : 1} />
                        )}

                    </ComposedChart>
                </ResponsiveContainer>
                {operatingPoint && operatingPoint.npsh_available && operatingPoint.npsh_required !== null && (
                    <div className={`absolute top-2 right-4 bg-white/90 p-1.5 rounded border border-slate-200 shadow-sm text-slate-600 font-medium pointer-events-none ${printMode ? 'text-2xl p-4 border-2' : 'text-xs'}`}>
                        <div>NPSHa: {operatingPoint.npsh_available.toFixed(2)}m</div>
                        <div>NPSHr: {operatingPoint.npsh_required?.toFixed(2)}m</div>
                    </div>
                )}
            </div>
        </div>
    );
};
