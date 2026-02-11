import React, { useState } from 'react';
import { PipeSegmentManager } from './components/PipeSegmentManager';
import { PumpCurveEditor } from './components/PumpCurveEditor';
import { SystemChart } from './components/SystemChart';
import { ResultsDisplay } from './components/ResultsDisplay';
import { FluidManager } from './components/FluidManager';
import { SystemNetworkDiagram } from './components/SystemNetworkDiagram';
import { useSystemStore } from './stores/useSystemStore';
import { useHydraulicCalculation } from './hooks/useHydraulicCalculation';
import { Button } from '@/components/ui/Button';
import { Play, AlertCircle, LayoutGrid, Table2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export const SystemDashboard: React.FC = () => {
    const { calculateOperatingPoint, isCalculating, result, error } = useHydraulicCalculation();
    const [viewMode, setViewMode] = useState<'kpi' | 'diagram'>('kpi');

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

    return (
        <div className="space-y-6 pb-20">

            {/* Top Controls: Global Parameters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left: Pressures & Head */}
                    <div className="flex-1 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide border-b pb-2">
                            Operating Conditions
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Input
                                label="Geometric Static Head (m)"
                                type="number"
                                value={staticHead}
                                onChange={(e) => setStaticHead(parseFloat(e.target.value) || 0)}
                                helperText="Elevation Diff (Z2 - Z1)"
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
                            <Input
                                label="Altitude (m)"
                                type="number"
                                value={altitude}
                                onChange={(e) => setAltitude(parseFloat(e.target.value) || 0)}
                                helperText={`Patm: ${pAtm.toFixed(3)} bar`}
                            />
                        </div>
                    </div>

                    {/* Middle: Fluid Manager */}
                    <div className="w-full md:w-80">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide border-b pb-2 mb-4">
                            Fluid
                        </h3>
                        <FluidManager />
                    </div>

                    {/* Right: Action */}
                    <div className="flex flex-col justify-end w-full md:w-auto min-w-[180px]">
                        {error && (
                            <div className="mb-2 text-red-600 text-xs bg-red-50 p-2 rounded border border-red-100 flex items-start">
                                <AlertCircle size={14} className="mr-1 mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        <Button
                            size="lg"
                            onClick={calculateOperatingPoint}
                            isLoading={isCalculating}
                            icon={<Play size={20} fill="currentColor" />}
                            className="shadow-lg shadow-blue-500/20 w-full"
                        >
                            Calculate
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

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">System Analysis</h3>
                        <SystemChart
                            pumpCurve={pumpCurve}
                            operatingPoint={result}
                            staticHead={staticHead}
                        />
                        {!result && !isCalculating && (
                            <div className="text-center text-slate-400 mt-4 text-sm">
                                Run calculation to see operating point intersection.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
