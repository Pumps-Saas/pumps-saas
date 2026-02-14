import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { PipeSegmentManager } from './components/PipeSegmentManager';
import { PumpCurveEditor } from './components/PumpCurveEditor';
import { HeadFlowChart } from './components/HeadFlowChart';
import { NPSHChart } from './components/NPSHChart';
import { ResultsDisplay } from './components/ResultsDisplay';
import { FluidManager } from './components/FluidManager';
import { SystemNetworkDiagram } from './components/SystemNetworkDiagram';
import { useSystemStore } from './stores/useSystemStore';
import { Button } from '@/components/ui/Button';
import { Play, AlertCircle, LayoutGrid, Table2, FileText } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { generatePDFReport } from './services/pdfGenerator';

export const SystemDashboard: React.FC = () => {
    // Store State
    const calculate = useSystemStore(state => state.calculateOperatingPoint);
    const isCalculating = useSystemStore(state => state.isCalculating);
    const result = useSystemStore(state => state.operatingPoint);
    const error = useSystemStore(state => state.calculationError);

    const [viewMode, setViewMode] = useState<'kpi' | 'diagram'>('kpi');
    const [systemCurvePoints, setSystemCurvePoints] = useState<any[]>([]);

    const pumpCurve = useSystemStore(state => state.pump_curve);

    // State Accessors
    const staticHead = useSystemStore(state => state.static_head);
    const setStaticHead = useSystemStore(state => state.setStaticHead);

    const pSuction = useSystemStore(state => state.pressure_suction_bar_g);
    const pDischarge = useSystemStore(state => state.pressure_discharge_bar_g);
    const pAtm = useSystemStore(state => state.atmospheric_pressure_bar);
    const altitude = useSystemStore(state => state.altitude_m);
    const setPressure = useSystemStore(state => state.setPressure);
    const setAltitude = useSystemStore(state => state.setAltitude);

    // Inputs for System Curve Fetch
    const fluid = useSystemStore(state => state.fluid);
    const suction = useSystemStore(state => state.suction_sections);
    const dischargeBefore = useSystemStore(state => state.discharge_sections_before);
    const dischargeParallel = useSystemStore(state => state.discharge_parallel_sections);
    const dischargeAfter = useSystemStore(state => state.discharge_sections_after);

    // Fetch System Curve when inputs change
    useEffect(() => {
        const fetchSystemCurve = async () => {
            try {
                // Determine max flow based on pump curve or default
                const maxFlow = pumpCurve.length > 0
                    ? Math.max(...pumpCurve.map(p => p.flow)) * 1.2
                    : 100;

                const response = await axios.post('http://localhost:8000/api/v1/calculate/system-curve', {
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

        const timer = setTimeout(fetchSystemCurve, 500);
        return () => clearTimeout(timer);
    }, [suction, dischargeBefore, dischargeParallel, dischargeAfter, fluid, staticHead, pumpCurve, pSuction, pDischarge, pAtm]);

    // Process Chart Data
    const chartData = useMemo(() => {
        const dataMap = new Map<number, any>();

        // 1. System Curve
        systemCurvePoints.forEach(p => {
            dataMap.set(p.flow, {
                flow: p.flow,
                systemHead: p.head,
                npshAvailable: p.npsh_available
            });
        });

        // 2. Pump Curve
        pumpCurve.forEach(p => {
            const existing = dataMap.get(p.flow) || { flow: p.flow };
            existing.pumpHead = p.head;
            if (p.npshr !== undefined) existing.npshRequired = p.npshr;
            dataMap.set(p.flow, existing);
        });

        // 3. Operating Point
        if (result) {
            const existing = dataMap.get(result.flow_op) || { flow: result.flow_op };
            // Ensure we have OP data if it wasn't in the curve points
            dataMap.set(result.flow_op, existing);
        }

        return Array.from(dataMap.values()).sort((a, b) => a.flow - b.flow);
    }, [systemCurvePoints, pumpCurve, result]);

    // PDF Export Logic
    const handleExportPDF = () => {
        if (!result) return;

        // Flatten discharge sections for the report (Parallel branches are complex, for now we list main line sections)
        // TODO: Better representation of parallel branches in PDF
        const dischargeSegments = [
            ...dischargeBefore,
            ...Object.values(dischargeParallel).flat(), // Simple flatten for list view
            ...dischargeAfter
        ];

        generatePDFReport({
            projectName: "Pump Analysis", // Placeholder until we have project context here
            scenarioName: "Scenario 1",
            fluid: {
                name: fluid.name,
                temperature: 20, // Default for now
                density: fluid.rho,
                viscosity: fluid.nu,
                vaporPressure: fluid.pv_kpa
            },
            operatingConditions: {
                flow: result.flow_op,
                head: result.head_op,
                staticHead: staticHead,
                pressureSuction: pSuction,
                pressureDischarge: pDischarge,
                altitude: altitude,
                atmosphericPressure: pAtm
            },
            pump: {
                manufacturer: "Generic", // Placeholder
                model: "Custom Curve"
            },
            results: {
                dutyFlow: result.flow_op,
                dutyHead: result.head_op,
                efficiency: result.efficiency_op,
                power: result.power_kw,
                npshAvailable: result.npsh_available || 0,
                npshRequired: result.npsh_required,
                headBreakdown: result.head_breakdown ? {
                    static: result.head_breakdown.static_head_m,
                    pressure: result.head_breakdown.pressure_head_m,
                    friction: result.head_breakdown.friction_head_m,
                    total: result.head_breakdown.total_head_m
                } : undefined
            },
            suction: {
                totalLength: suction.reduce((acc, s) => acc + s.length_m, 0),
                totalLoss: 0, // Not calculated per line yet in frontend summary
                segments: suction
            },
            discharge: {
                totalLength: dischargeSegments.reduce((acc, s) => acc + s.length_m, 0),
                totalLoss: 0,
                segments: dischargeSegments
            }
        });
    };

    return (
        <div className="space-y-6 pb-20">

            {/* Top Controls: Global Parameters - Improved Grid Layout */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left: Operating Conditions (Cols 1-5) */}
                    <div className="lg:col-span-5 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide border-b pb-2">
                            Operating Conditions
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Geometric Static Head (m)"
                                type="number"
                                value={staticHead}
                                onChange={(e) => setStaticHead(parseFloat(e.target.value) || 0)}
                                helperText="Elevation Diff (Z2 - Z1)"
                            />
                            <Input
                                label="Altitude (m)"
                                type="number"
                                value={altitude}
                                onChange={(e) => setAltitude(parseFloat(e.target.value) || 0)}
                                helperText={`Patm: ${pAtm.toFixed(3)} bar`}
                            />
                            <Input
                                label="Suction Tank Press. (bar g)"
                                type="number"
                                value={pSuction}
                                onChange={(e) => setPressure('pressure_suction_bar_g', parseFloat(e.target.value) || 0)}
                            />
                            <Input
                                label="Discharge Tank Press. (bar g)"
                                type="number"
                                value={pDischarge}
                                onChange={(e) => setPressure('pressure_discharge_bar_g', parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    {/* Middle: Fluid Manager (Cols 6-9) */}
                    <div className="lg:col-span-4">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide border-b pb-2 mb-4">
                            Fluid
                        </h3>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <FluidManager />
                        </div>
                    </div>

                    {/* Right: Validation & Action (Cols 10-12) */}
                    <div className="lg:col-span-3 flex flex-col justify-end space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-md border border-red-200 text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        <Button
                            size="lg"
                            onClick={calculate}
                            isLoading={isCalculating}
                            disabled={pumpCurve.length < 3}
                            icon={<Play size={20} fill="currentColor" />}
                            className="shadow-lg shadow-blue-500/20 w-full"
                        >
                            {isCalculating ? 'Calculating...' : 'Run Calculation'}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleExportPDF}
                            disabled={!result}
                            icon={<FileText size={18} />}
                            className="w-full border-blue-200 hover:bg-blue-50 text-blue-700"
                        >
                            Export PDF Report
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Network Configuration */}
                <div className="lg:col-span-6 space-y-8">

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-blue-600 pl-3">
                            1. Pump Performance
                        </h2>
                        <PumpCurveEditor />
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-4 border-l-4 border-emerald-600 pl-3">
                            2. Pipe Network
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <PipeSegmentManager type="suction" />
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <PipeSegmentManager type="discharge" />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Visualization & Results */}
                <div className="lg:col-span-6 space-y-6 sticky top-24 self-start">

                    {result && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="flex border-b border-slate-100">
                                <button
                                    className={`flex items-center px-4 py-3 text-sm font-medium ${viewMode === 'kpi' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                                    onClick={() => setViewMode('kpi')}
                                >
                                    <Table2 size={16} className="mr-2" />
                                    Results & Data
                                </button>
                                <button
                                    className={`flex items-center px-4 py-3 text-sm font-medium ${viewMode === 'diagram' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                                    onClick={() => setViewMode('diagram')}
                                >
                                    <LayoutGrid size={16} className="mr-2" />
                                    Network Diagram
                                </button>
                            </div>

                            <div className="p-4">
                                {viewMode === 'kpi' ? (
                                    <ResultsDisplay
                                        result={result}
                                        isCalculating={isCalculating}
                                        error={error}
                                    />
                                ) : (
                                    <SystemNetworkDiagram result={result} />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Chart 1: Head vs Flow */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <HeadFlowChart
                            data={chartData}
                            operatingPoint={result}
                        />
                        {!result && !isCalculating && (
                            <div className="text-center text-slate-400 mt-4 text-sm italic">
                                Run calculation to see intersection.
                            </div>
                        )}
                    </div>

                    {/* Chart 2: NPSH Analysis */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <NPSHChart
                            data={chartData}
                            operatingPoint={result}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
