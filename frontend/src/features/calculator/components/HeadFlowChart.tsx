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
}

export const HeadFlowChart: React.FC<HeadFlowChartProps> = ({ data, operatingPoint }) => {
    return (
        <div className="h-80 w-full relative">
            <h4 className="text-sm font-semibold text-slate-500 mb-2 text-center uppercase tracking-wider">
                System vs Pump Head
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
                        label={{ value: 'Head (m)', angle: -90, position: 'insideLeft' }}
                        domain={[0, 'auto']}
                    />
                    <Tooltip
                        labelFormatter={(value) => `Flow: ${Number(value).toFixed(2)} m³/h`}
                        formatter={(value: any, name: any) => [
                            typeof value === 'number' ? value.toFixed(2) + ' m' : value,
                            name === 'pumpHead' ? 'Pump Head' : 'System Head'
                        ]}
                    />
                    <Legend verticalAlign="top" iconType="circle" />

                    {/* Pump Curve */}
                    <Line
                        type="monotone"
                        dataKey="pumpHead"
                        stroke="#2563eb"
                        name="Pump Head"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#2563eb' }}
                        connectNulls
                        isAnimationActive={false}
                    />

                    {/* System Curve */}
                    <Line
                        type="monotone"
                        dataKey="systemHead"
                        stroke="#ef4444"
                        name="System Head"
                        strokeWidth={3}
                        dot={false}
                        connectNulls
                        isAnimationActive={false}
                    />

                    {operatingPoint && (
                        <ReferenceLine x={operatingPoint.flow_op} stroke="#22c55e" strokeDasharray="3 3" />
                    )}
                    {operatingPoint && (
                        <ReferenceLine y={operatingPoint.head_op} stroke="#22c55e" strokeDasharray="3 3" />
                    )}

                </ComposedChart>
            </ResponsiveContainer>
            {operatingPoint && (
                <div className="absolute top-2 right-4 bg-white/90 p-1.5 rounded border border-green-200 shadow-sm text-xs text-green-700 font-semibold pointer-events-none">
                    OP: {operatingPoint.flow_op.toFixed(1)} m³/h @ {operatingPoint.head_op.toFixed(1)} m
                </div>
            )}
        </div>
    );
};
