import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { PipeSegmentManager } from './components/PipeSegmentManager';
import { PumpCurveEditor } from './components/PumpCurveEditor';
import { HeadFlowChart } from './components/HeadFlowChart';
import { NPSHChart } from './components/NPSHChart';
import { ResultsDisplay } from './components/ResultsDisplay';
import { FluidManager } from './components/FluidManager';
import { SystemSchematic } from './components/SystemSchematic';
import { useSystemStore } from './stores/useSystemStore';
import { Button } from '@/components/ui/Button';
import { Play, Sparkles, LayoutGrid, FileText, Settings2, Droplets, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { generatePDFReport, ReportData } from './services/pdfGenerator';
import html2canvas from 'html2canvas';

// UI Components for the New Layout
const CardHeader = ({ icon: Icon, title, minimized, toggle }: { icon: any, title: string, minimized?: boolean, toggle?: () => void }) => (
    <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={toggle}>
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Icon className="w-4 h-4 text-sky-600" />
            {title}
        </div>
        {toggle && <ArrowRight className={`w-3 h-3 text-slate-400 transition-transform ${minimized ? '' : 'rotate-90'}`} />}
    </div>
);

export const SystemDashboard: React.FC = () => {
    // Store State
    const calculate = useSystemStore(state => state.calculateOperatingPoint);
    const isCalculating = useSystemStore(state => state.isCalculating);
    const result = useSystemStore(state => state.operatingPoint); // Corrected from 'result' to 'operatingPoint' based on store
    const error = useSystemStore(state => state.calculationError);

    // UI State
    const [activeTab, setActiveTab] = useState<'system' | 'npsh' | 'schematic'>('system');
    const [minimized, setMinimized] = useState<Record<string, boolean>>({});
    const [systemCurvePoints, setSystemCurvePoints] = useState<any[]>([]);

    const toggleSection = (id: string) => setMinimized(prev => ({ ...prev, [id]: !prev[id] }));

    // Store Accessors
    const fluid = useSystemStore(state => state.fluid);
    const suction = useSystemStore(state => state.suction_sections);
    const dischargeBefore = useSystemStore(state => state.discharge_sections_before);
    const dischargeParallel = useSystemStore(state => state.discharge_parallel_sections);
    const dischargeAfter = useSystemStore(state => state.discharge_sections_after);

    // Inputs
    const staticHead = useSystemStore(state => state.static_head);
    const setStaticHead = useSystemStore(state => state.setStaticHead);
    const pSuction = useSystemStore(state => state.pressure_suction_bar_g);
    const pDischarge = useSystemStore(state => state.pressure_discharge_bar_g);
    const pAtm = useSystemStore(state => state.atmospheric_pressure_bar);
    const altitude = useSystemStore(state => state.altitude_m);
    const setPressure = useSystemStore(state => state.setPressure);
    const setAltitude = useSystemStore(state => state.setAltitude);

    const pumpCurve = useSystemStore(state => state.pump_curve);


    // Initial calculation (optional, removed to avoid auto-calc on load if unwanted, but user asked for it in checklist)
    // Keeping logic consistent: Fetch curve on input change.
    useEffect(() => {
        const fetchSystemCurve = async () => {
            try {
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
            dataMap.set(result.flow_op, existing);
        }

        return Array.from(dataMap.values()).sort((a, b) => a.flow - b.flow);
    }, [systemCurvePoints, pumpCurve, result]);


    const handleGeneratePDF = async () => {
        try {
            // Capture elements from the hidden render zone
            const diagramEl = document.getElementById('pdf-diagram');
            const systemChartEl = document.getElementById('pdf-chart-system');
            const npshChartEl = document.getElementById('pdf-chart-npsh');

            let diagramImg, chart1Img, chart2Img;

            if (diagramEl) {
                const canvas = await html2canvas(diagramEl, { scale: 2, backgroundColor: '#ffffff' });
                diagramImg = canvas.toDataURL('image/png');
            }
            if (systemChartEl) {
                const canvas = await html2canvas(systemChartEl, { scale: 2, backgroundColor: '#ffffff' });
                chart1Img = canvas.toDataURL('image/png');
            }
            if (npshChartEl) {
                const canvas = await html2canvas(npshChartEl, { scale: 2, backgroundColor: '#ffffff' });
                chart2Img = canvas.toDataURL('image/png');
            }

            // Enrich segments logic for PDF report
            const enrichSegments = (segments: any[]) => {
                return segments.map(seg => {
                    const segResult = result?.details?.find((d: any) => d.section_id === seg.id);
                    return {
                        ...seg,
                        loss_m: segResult ? segResult.total_loss_m : null
                    };
                });
            };

            const allDischargeSegments = [
                ...dischargeBefore,
                ...Object.values(dischargeParallel).flat(),
                ...dischargeAfter
            ];

            const data: ReportData = {
                projectName: "Pump Selection Project",
                scenarioName: "Scenario A",
                fluid: {
                    name: fluid.name,
                    temperature: 20,
                    density: fluid.rho,
                    viscosity: fluid.nu,
                    vaporPressure: fluid.pv_kpa
                },
                operatingConditions: {
                    flow: result?.flow_op || 0,
                    head: result?.head_op || 0,
                    staticHead: staticHead,
                    pressureSuction: pSuction,
                    pressureDischarge: pDischarge,
                    altitude: altitude,
                    atmosphericPressure: pAtm
                },
                pump: {
                    manufacturer: useSystemStore.getState().pump_manufacturer,
                    model: useSystemStore.getState().pump_model,
                    points: pumpCurve
                },
                results: {
                    dutyFlow: result?.flow_op || 0,
                    dutyHead: result?.head_op || 0,
                    efficiency: result?.efficiency_op,
                    power: result?.power_kw,
                    npshAvailable: result?.npsha_op || 0,
                    npshRequired: result?.npshr_op,
                    headBreakdown: result ? {
                        static: result.head_breakdown?.static_head_m,
                        pressure: result.head_breakdown?.pressure_head_m,
                        friction: result.head_breakdown?.friction_head_m,
                        total: result.head_breakdown?.total_head_m
                    } : undefined
                },
                suction: {
                    totalLength: suction.reduce((acc, s) => acc + s.length_m, 0),
                    totalLoss: result?.details?.filter((d: any) => suction.find(s => s.id === d.section_id)).reduce((acc: any, d: any) => acc + d.total_loss_m, 0) || 0,
                    segments: enrichSegments(suction)
                },
                discharge: {
                    totalLength: allDischargeSegments.reduce((acc: any, s: any) => acc + s.length_m, 0),
                    totalLoss: result?.details?.filter((d: any) =>
                        allDischargeSegments.find((s: any) => s.id === d.section_id)
                    ).reduce((acc: any, d: any) => acc + d.total_loss_m, 0) || 0,
                    segments: enrichSegments(allDischargeSegments)
                },
                charts: {
                    systemCurveImg: chart1Img,
                    npshCurveImg: chart2Img,
                    networkDiagramImg: diagramImg
                }
            };

            await generatePDFReport(data);

        } catch (error) {
            console.error("PDF Fail", error);
            alert("Erro ao gerar PDF.");
        }
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden">
            {/* 1. Header (Minimalist) */}
            <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-white font-bold tracking-tighter shadow-sm">
                        P+
                    </div>
                    <h1 className="text-lg font-bold text-slate-800 tracking-tight">Pumps<span className="text-sky-600">SaaS</span></h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-100 rounded-md px-3 py-1.5 border border-slate-200">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patm</span>
                        <div className="text-sm font-medium w-16 text-right px-2">{pAtm.toFixed(3)}</div>
                        <span className="text-xs text-slate-400">bar</span>
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-1"></div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 hover:text-sky-600 gap-2"
                        onClick={handleGeneratePDF}
                    >
                        <FileText className="w-4 h-4" /> PDF
                    </Button>

                    <Button
                        onClick={() => calculate()}
                        disabled={isCalculating}
                        className="bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 transition-all active:scale-95"
                        size="sm"
                    >
                        {isCalculating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current mr-2" />}
                        Calculate
                    </Button>
                </div>
            </header>

            {/* 2. Content Grid */}
            <main className="flex-1 flex flex-col overflow-hidden">

                {/* Top Section: Inputs & Charts */}
                <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">

                    {/* LEFT COLUMN: Inputs (Scrollable) */}
                    <aside className="col-span-12 lg:col-span-6 bg-white border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar">

                        {/* Section: System Conditions (RESTORED) */}
                        <div className="border-b border-slate-100">
                            <CardHeader icon={Settings2} title="System Conditions" minimized={minimized['conditions']} toggle={() => toggleSection('conditions')} />
                            {!minimized['conditions'] && (
                                <div className="p-4 grid grid-cols-2 gap-4 bg-white">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Static Head (m)</label>
                                        <Input type="number" value={staticHead} onChange={e => setStaticHead(Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Altitude (m)</label>
                                        <Input type="number" value={altitude} onChange={e => setAltitude(Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Suction Press. (bar)</label>
                                        <Input type="number" value={pSuction} onChange={e => setPressure('pressure_suction_bar_g', Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Discharge Press. (bar)</label>
                                        <Input type="number" value={pDischarge} onChange={e => setPressure('pressure_discharge_bar_g', Number(e.target.value))} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section: Fluid */}
                        <div className="border-b border-slate-100">
                            <CardHeader icon={Droplets} title="Fluid Properties" minimized={minimized['fluid']} toggle={() => toggleSection('fluid')} />
                            {!minimized['fluid'] && (
                                <div className="p-4 bg-white">
                                    <FluidManager />
                                </div>
                            )}
                        </div>

                        {/* Section: Pipes (RESTORED SUCTION) */}
                        <div className="border-b border-slate-100">
                            <CardHeader icon={LayoutGrid} title="Piping Network" minimized={minimized['pipes']} toggle={() => toggleSection('pipes')} />
                            {!minimized['pipes'] && (
                                <div className="p-0">
                                    {/* Explicitly render Suction Manager */}
                                    <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                                        <PipeSegmentManager type="suction" />
                                    </div>
                                    {/* Explicitly render Discharge Manager */}
                                    <div className="p-4">
                                        <PipeSegmentManager type="discharge" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section: Pump */}
                        <div className="border-b border-slate-100 mb-20"> {/* Margin for footer scroll */}
                            <CardHeader icon={Settings2} title="Pump Curve" minimized={minimized['pump']} toggle={() => toggleSection('pump')} />
                            {!minimized['pump'] && (
                                <div className="p-4">
                                    <PumpCurveEditor />
                                </div>
                            )}
                        </div>

                    </aside>

                    {/* RIGHT COLUMN: Results & Charts (Main Stage) */}
                    <section className="col-span-12 lg:col-span-6 bg-slate-50/50 flex flex-col overflow-y-auto">

                        {/* Results & Charts Grid */}
                        <div className="p-4 flex-1 grid grid-cols-1 gap-4">

                            {/* Results KPI Bar */}
                            {result && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <ResultsDisplay result={result} isCalculating={isCalculating} error={error} />
                                </div>
                            )}

                            {/* Charts Tabs */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full min-h-[500px]">
                                <div className="flex border-b border-slate-100 overflow-x-auto">
                                    <button
                                        onClick={() => setActiveTab('schematic')}
                                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 min-w-[120px] ${activeTab === 'schematic' ? 'border-sky-600 text-sky-700 bg-sky-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        System Schematic
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('system')}
                                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 min-w-[120px] ${activeTab === 'system' ? 'border-sky-600 text-sky-700 bg-sky-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        System Head Curve
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('npsh')}
                                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 min-w-[120px] ${activeTab === 'npsh' ? 'border-sky-600 text-sky-700 bg-sky-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        NPSH Analysis
                                    </button>
                                </div>

                                <div className="p-4 flex-1 flex flex-col">
                                    {activeTab === 'schematic' && (
                                        <div className="flex-1 flex justify-center items-center overflow-hidden bg-slate-50/30 rounded-lg border border-slate-100 p-4">
                                            <div className="w-full">
                                                <SystemSchematic result={result} />
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === 'system' && (
                                        <div className="h-full w-full min-h-[300px]">
                                            <HeadFlowChart data={chartData} operatingPoint={result} />
                                        </div>
                                    )}
                                    {activeTab === 'npsh' && (
                                        <div className="h-full w-full min-h-[300px]">
                                            <NPSHChart data={chartData} operatingPoint={result} />
                                        </div>
                                    )}
                                </div>

                                {!result && !isCalculating && activeTab !== 'schematic' && (
                                    <div className="p-4 text-center text-sm text-slate-400 italic bg-slate-50/50">
                                        Click "Calculate" to view results.
                                    </div>
                                )}
                            </div>

                        </div>
                    </section>
                </div>

            </main>

            {/*
                HIDDEN PDF CAPTURE ZONE
                Render everything needed for PDF here, always visible to html2canvas (but hidden from user via css properties that html2canvas ignores or standard absolute positioning offscreen)
             */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '1200px', backgroundColor: 'white' }}>
                <div id="pdf-diagram" style={{ width: '1200px', height: '800px' }}>
                    {result && <SystemSchematic result={result} />}
                </div>
                <div id="pdf-chart-system" style={{ width: '1000px', height: '600px' }}>
                    <HeadFlowChart data={chartData} operatingPoint={result} />
                </div>
                <div id="pdf-chart-npsh" style={{ width: '1000px', height: '600px' }}>
                    <NPSHChart data={chartData} operatingPoint={result} />
                </div>
            </div>
        </div>
    );
};
