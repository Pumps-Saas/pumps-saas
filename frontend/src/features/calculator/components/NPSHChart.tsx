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
        ? "h-full w-full relative flex flex-col items-center justify-center"
        : "flex-1 min-h-0 w-full relative";

    return (
        <div className={containerClass}>
            {/* Title for both Print and Screen modes, styled differently */}
            {printMode ? (
                <h3 className="text-[#2980b9] font-sans mb-8 ml-12" style={{ fontSize: '64px', fontWeight: 'bold' }}>
                    NPSH Available vs Required
                </h3>
            ) : (
                <h4 className="text-sm font-semibold text-slate-500 mb-2 text-center uppercase tracking-wider flex-none">
                    NPSH Analysis
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
                            label={{ value: 'NPSH (m)', angle: -90, position: 'insideLeft', style: { fontSize: labelFontSize, fill: '#333', fontWeight: 600, textAnchor: 'middle' }, offset: printMode ? 0 : 10, dx: printMode ? -60 : -10 }}
                            domain={[0, 'auto']}
                            tick={{ fontSize: axisFontSize, fill: '#666' }}
                            tickMargin={printMode ? 15 : 10}
                        />
                        <Tooltip
                            labelFormatter={(value) => `Flow: ${Number(value).toFixed(2)} m³/h`}
                            formatter={(value: any, name: any) => [
                                typeof value === 'number' ? value.toFixed(2) + ' m' : value,
                                name === 'npshAvailable' ? 'NPSH Available' : 'NPSH Required'
                            ]}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend
                            verticalAlign="top"
                            height={printMode ? 70 : 60}
                            iconType="circle"
                            wrapperStyle={{ fontSize: legendFontSize, paddingTop: '0px', paddingBottom: printMode ? '40px' : '20px', display: 'flex', justifyContent: 'center', width: '100%' }}
                        />

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
                    <div className={`absolute bg-white/90 rounded border shadow-sm text-slate-600 font-medium pointer-events-none ${printMode ? 'border-2 text-slate-700' : 'text-xs'}`} style={printMode ? { fontSize: legendFontSize, top: 40, right: 60, padding: '24px' } : { top: 8, right: 16, padding: '6px' }}>
                        <div>NPSHa: {operatingPoint.npsh_available.toFixed(2)}m</div>
                        <div>NPSHr: {operatingPoint.npsh_required?.toFixed(2)}m</div>
                    </div>
                )}
            </div>
        </div>
    );
};
