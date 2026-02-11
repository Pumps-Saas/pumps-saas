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
}

export const NPSHChart: React.FC<NPSHChartProps> = ({ data, operatingPoint }) => {
    return (
        <div className="h-80 w-full relative">
            <h4 className="text-sm font-semibold text-slate-500 mb-2 text-center uppercase tracking-wider">
                NPSH Analysis
            </h4>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        dataKey="flow"
                        type="number"
                        unit=" m³/h"
                        domain={['dataMin', 'dataMax']}
                        label={{ value: 'Flow Rate (m³/h)', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis
                        label={{ value: 'NPSH (m)', angle: -90, position: 'insideLeft' }}
                        domain={[0, 'auto']}
                    />
                    <Tooltip
                        labelFormatter={(value) => `Flow: ${Number(value).toFixed(2)} m³/h`}
                        formatter={(value: any, name: any) => [
                            typeof value === 'number' ? value.toFixed(2) + ' m' : value,
                            name === 'npshAvailable' ? 'NPSH Available' : 'NPSH Required'
                        ]}
                    />
                    <Legend verticalAlign="top" iconType="circle" />

                    {/* NPSH Available */}
                    <Line
                        type="monotone"
                        dataKey="npshAvailable"
                        stroke="#10b981" // Emerald 500
                        name="NPSH Available"
                        strokeWidth={2}
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
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={{ r: 3, fill: '#f59e0b' }}
                        connectNulls
                        isAnimationActive={false}
                    />


                    {operatingPoint && (
                        <ReferenceLine x={operatingPoint.flow_op} stroke="#22c55e" strokeDasharray="3 3" />
                    )}

                    {operatingPoint && operatingPoint.npsh_available && (
                        <ReferenceLine y={operatingPoint.npsh_available} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
                    )}

                </ComposedChart>
            </ResponsiveContainer>
            {operatingPoint && operatingPoint.npsh_available && operatingPoint.npsh_required !== null && (
                <div className="absolute top-2 right-4 bg-white/90 p-1.5 rounded border border-slate-200 shadow-sm text-xs text-slate-600 font-medium pointer-events-none">
                    <div>NPSHa: {operatingPoint.npsh_available.toFixed(2)}m</div>
                    <div>NPSHr: {operatingPoint.npsh_required?.toFixed(2)}m</div>
                </div>
            )}
        </div>
    );
};
