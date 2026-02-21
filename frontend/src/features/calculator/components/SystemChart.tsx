import React, { useMemo, useEffect, useState } from 'react';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceDot,
    ReferenceLine
} from 'recharts';
import { OperatingPointResult, PumpCurvePoint } from '@/types/engineering';
import axios from 'axios';
import { useSystemStore } from '../stores/useSystemStore';

interface SystemChartProps {
    pumpCurve: PumpCurvePoint[];
    operatingPoint: OperatingPointResult | null;
    staticHead: number;
}

export const SystemChart: React.FC<SystemChartProps> = ({ pumpCurve, operatingPoint, staticHead }) => {
    const [systemCurvePoints, setSystemCurvePoints] = useState<{ flow: number, head: number }[]>([]);

    // Get store state for API call
    const fluid = useSystemStore(state => state.fluid);
    const suction = useSystemStore(state => state.suction_sections);
    const dischargeBefore = useSystemStore(state => state.discharge_sections_before);
    const dischargeParallel = useSystemStore(state => state.discharge_parallel_sections);
    const dischargeAfter = useSystemStore(state => state.discharge_sections_after);

    // Pressures
    const pSuction = useSystemStore(state => state.pressure_suction_bar_g);
    const pDischarge = useSystemStore(state => state.pressure_discharge_bar_g);
    const pAtm = useSystemStore(state => state.atmospheric_pressure_bar);

    // Fetch System Curve when inputs change
    useEffect(() => {
        const fetchSystemCurve = async () => {
            try {
                // Determine max flow based on pump curve or default
                const maxFlow = pumpCurve.length > 0
                    ? Math.max(...pumpCurve.map(p => p.flow)) * 1.2
                    : 100;

                const response = await axios.post('http://127.0.0.1:8000/api/v1/calculate/system-curve', {
                    suction_sections: suction,
                    discharge_sections_before: dischargeBefore,
                    discharge_parallel_sections: dischargeParallel,
                    discharge_sections_after: dischargeAfter,
                    fluid: fluid,
                    static_head_m: staticHead,

                    // Pressure Fields
                    pressure_suction_bar_g: pSuction,
                    pressure_discharge_bar_g: pDischarge,
                    atmospheric_pressure_bar: pAtm,

                    flow_min_m3h: 0,
                    flow_max_m3h: maxFlow,
                    steps: 30
                });
                setSystemCurvePoints(response.data.points);
            } catch (error) {
                console.error("Failed to fetch system curve", error);
            }
        };

        // Debounce or just run? For now run.
        const timer = setTimeout(fetchSystemCurve, 500);
        return () => clearTimeout(timer);
    }, [suction, dischargeBefore, dischargeParallel, dischargeAfter, fluid, staticHead, pumpCurve, pSuction, pDischarge, pAtm]);

    const chartData = useMemo(() => {
        // We need to merge System Curve points and Pump Curve points into a single "flow"-indexed array
        // or just rely on Recharts ability to handle multiple lines if they share X-axis domain.
        // Recharts prefers a single array of objects { flow: x, system: y, pump: z }

        // 1. Create base array from System Curve
        const dataMap = new Map<number, any>();

        systemCurvePoints.forEach(p => {
            // @ts-ignore - API returns npsh_available
            dataMap.set(p.flow, { flow: p.flow, systemHead: p.head, npshAvailable: p.npsh_available });
        });

        // 2. Add Pump Curve points (exact)
        pumpCurve.forEach(p => {
            const existing = dataMap.get(p.flow) || { flow: p.flow };
            existing.pumpHead = p.head;
            if (p.npshr !== undefined) existing.npshRequired = p.npshr;
            dataMap.set(p.flow, existing);
        });

        // 3. Add Operating Point (exact)
        if (operatingPoint) {
            const existing = dataMap.get(operatingPoint.flow_op) || { flow: operatingPoint.flow_op };
            // We can optionally add it to data or just use ReferenceDot
            dataMap.set(operatingPoint.flow_op, existing);
        }

        return Array.from(dataMap.values()).sort((a, b) => a.flow - b.flow);
    }, [systemCurvePoints, pumpCurve, operatingPoint]);

    return (
        <div className="h-96 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                        formatter={(value: number, name: string) => [
                            value.toFixed(2) + ' m',
                            name === 'pumpHead' ? 'Pump Head' : 'System Head'
                        ]}
                    />
                    <Legend verticalAlign="top" />

                    {/* NPSH Axis (Right) */}
                    <YAxis
                        yAxisId="npsh"
                        orientation="right"
                        label={{ value: 'NPSH (m)', angle: 90, position: 'insideRight' }}
                        domain={[0, 'auto']}
                    />

                    {/* Pump Curve */}
                    <Line
                        yAxisId={0}
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
                        yAxisId={0}
                        type="monotone"
                        dataKey="systemHead"
                        stroke="#ef4444"
                        name="System Head"
                        strokeWidth={3}
                        dot={false}
                        connectNulls
                        isAnimationActive={false}
                    />

                    {/* NPSH Available */}
                    <Line
                        yAxisId="npsh"
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
                        yAxisId="npsh"
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
                        <ReferenceLine yAxisId={0} x={operatingPoint.flow_op} stroke="#22c55e" strokeDasharray="3 3" />
                    )}
                    {operatingPoint && (
                        <ReferenceLine yAxisId={0} y={operatingPoint.head_op} stroke="#22c55e" strokeDasharray="3 3" />
                    )}

                </ComposedChart>
            </ResponsiveContainer>
            {operatingPoint && (
                <div className="absolute top-2 right-12 bg-white/90 p-2 rounded border border-green-200 shadow-sm text-sm text-green-700 font-semibold">
                    OP: {operatingPoint.flow_op.toFixed(1)} m³/h @ {operatingPoint.head_op.toFixed(1)} m
                </div>
            )}
        </div>
    );
};
