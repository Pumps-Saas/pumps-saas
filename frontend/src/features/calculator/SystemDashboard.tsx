import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { PipeSegmentManager } from './components/PipeSegmentManager';
import { PumpCurveEditor } from './components/PumpCurveEditor';
import { HeadFlowChart } from './components/HeadFlowChart';
import { NPSHChart } from './components/NPSHChart';
import { CockpitKPIs, CalculationMemorial, DetailedLosses } from './components/ResultsDisplay';
import { FluidManager } from './components/FluidManager';
import { SystemSchematic } from './components/SystemSchematic';
import { useSystemStore } from './stores/useSystemStore';
import { Button } from '@/components/ui/Button';
import { Play, Sparkles, LayoutGrid, FileText, Settings2, Droplets, ArrowRight, HelpCircle, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { generatePDFReport, ReportData } from './services/pdfGenerator';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { SupportModal } from '../support/SupportModal';
import { NotificationPanel } from '../support/NotificationPanel';
import { EconomicDashboard } from './EconomicDashboard';

import { Zap } from 'lucide-react';

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
    const [mainView, setMainView] = useState<'hydraulic' | 'economic'>('hydraulic');
    const [activeTab, setActiveTab] = useState<'system' | 'losses' | 'memorial'>('system');
    const [minimized, setMinimized] = useState<Record<string, boolean>>({});
    const [systemCurvePoints, setSystemCurvePoints] = useState<any[]>([]);

    // PDF State
    const [pdfStatus, setPdfStatus] = useState<'idle' | 'generating' | 'ready'>('idle');
    const [pdfFilename, setPdfFilename] = useState<string>('');
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
    const pdfDocRef = React.useRef<any>(null); // To store the jsPDF instance

    // Support Modal State
    const [isSupportOpen, setIsSupportOpen] = useState(false);

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

    const efficiencyMotor = useSystemStore(state => state.efficiency_motor);
    const hoursPerDay = useSystemStore(state => state.hours_per_day);
    const daysPerYear = useSystemStore(state => state.days_per_year);
    const energyCost = useSystemStore(state => state.energy_cost_per_kwh);
    const setEnergyConfig = useSystemStore(state => state.setEnergyConfig);

    const pumpCurve = useSystemStore(state => state.pump_curve);
    const pumpBaseRpm = useSystemStore(state => state.pump_base_rpm);
    const pumpCurrentRpm = useSystemStore(state => state.pump_current_rpm);
    const parallelPumps = useSystemStore(state => state.parallel_pumps);

    // Initial calculation (optional, removed to avoid auto-calc on load if unwanted, but user asked for it in checklist)
    // Keeping logic consistent: Fetch curve on input change.
    useEffect(() => {
        const fetchSystemCurve = async () => {
            try {
                const speedRatio = (pumpBaseRpm && pumpCurrentRpm) ? (pumpCurrentRpm / pumpBaseRpm) : 1.0;
                const parallel = parallelPumps || 1;
                const maxFlow = pumpCurve.length > 0
                    ? Math.max(...pumpCurve.map(p => p.flow)) * speedRatio * parallel * 1.2
                    : 100;

                const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
                const response = await axios.post(`${API_URL}/calculate/system-curve`, {
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
    }, [suction, dischargeBefore, dischargeParallel, dischargeAfter, fluid, staticHead, pumpCurve, pSuction, pDischarge, pAtm, parallelPumps, pumpBaseRpm, pumpCurrentRpm]);

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
        const speedRatio = (pumpBaseRpm && pumpCurrentRpm) ? (pumpCurrentRpm / pumpBaseRpm) : 1.0;
        const parallel = parallelPumps || 1;

        pumpCurve.forEach(p => {
            // Base Curve (Original)
            const existingBase = dataMap.get(p.flow) || { flow: p.flow };
            existingBase.basePumpHead = p.head;
            if (p.npshr !== undefined) {
                existingBase.baseNpshRequired = p.npshr;
            }
            dataMap.set(p.flow, existingBase);

            // Adjusted Curve (VFD + Parallel)
            const adjFlow = p.flow * speedRatio * parallel;
            const adjHead = p.head * (speedRatio ** 2);
            const existingAdj = dataMap.get(adjFlow) || { flow: adjFlow };
            existingAdj.pumpHead = adjHead;
            
            if (p.npshr !== undefined) {
                existingAdj.npshRequired = p.npshr * (speedRatio ** 2);
            }
            dataMap.set(adjFlow, existingAdj);
        });

        // 3. Operating Point
        if (result) {
            const existing = dataMap.get(result.flow_op) || { flow: result.flow_op };
            dataMap.set(result.flow_op, existing);
        }

        return Array.from(dataMap.values()).sort((a, b) => a.flow - b.flow);
    }, [systemCurvePoints, pumpCurve, result, pumpBaseRpm, pumpCurrentRpm, parallelPumps]);


    const handleGeneratePDF = async () => {
        setPdfStatus('generating');
        try {
            // Capture elements from the hidden render zone
            const diagramEl = document.getElementById('pdf-diagram');
            const systemChartEl = document.getElementById('pdf-chart-system');
            const npshChartEl = document.getElementById('pdf-chart-npsh');
            const economicEl = document.getElementById('pdf-economic-dashboard');

            let diagramImg, chart1Img, chart2Img, economicImg;
            let diagramRatio = 1;

            console.log("Starting PDF generation...");

            try {
                if (diagramEl) {
                    console.log("Capturing Diagram...");
                    // @ts-ignore
                    const canvas = await html2canvas(diagramEl, { scale: 2.0, backgroundColor: '#ffffff', logging: true, useCORS: true, allowTaint: true });
                    diagramImg = canvas.toDataURL('image/jpeg', 0.8);
                    diagramRatio = canvas.width / canvas.height;
                }
            } catch (e: any) {
                console.error("Failed to capture Diagram", e);
                alert(`Erro ao capturar Diagrama: ${e.message}`);
                return;
            }

            try {
                if (systemChartEl) {
                    console.log("Capturing System Chart...");
                    // @ts-ignore
                    const canvas = await html2canvas(systemChartEl, { scale: 1.5, backgroundColor: '#ffffff', logging: true, useCORS: true, allowTaint: true });
                    chart1Img = canvas.toDataURL('image/jpeg', 0.8);
                }
            } catch (e: any) {
                console.error("Failed to capture System Chart", e);
                alert(`Erro ao capturar Gráfico do Sistema: ${e.message}`);
                return;
            }

            try {
                if (npshChartEl) {
                    console.log("Capturing NPSH Chart...");
                    // @ts-ignore
                    const canvas = await html2canvas(npshChartEl, { scale: 1.5, backgroundColor: '#ffffff', logging: true, useCORS: true, allowTaint: true });
                    chart2Img = canvas.toDataURL('image/jpeg', 0.8);
                }
            } catch (e: any) {
                console.error("Failed to capture NPSH Chart", e);
                alert(`Erro ao capturar Gráfico NPSH: ${e.message}`);
                return;
            }

            try {
                if (economicEl) {
                    console.log("Capturing Economic Chart...");
                    // @ts-ignore
                    const canvas = await html2canvas(economicEl, { scale: 1.5, backgroundColor: '#ffffff', logging: true, useCORS: true, allowTaint: true });
                    economicImg = canvas.toDataURL('image/jpeg', 0.8);
                }
            } catch (e: any) {
                console.error("Failed to capture Economic Chart", e);
            }

            // Calculate economic data for PDF
            const storeState = useSystemStore.getState();
            const capex = storeState.pump_cost + storeState.installation_cost;
            const powerKw = result?.power_kw || 0;
            const annualEnergyCost = powerKw * storeState.hours_per_day * storeState.days_per_year * storeState.energy_cost_per_kwh;
            const annualMaintenanceCost = capex * (storeState.maintenance_rate / 100);
            const opex = annualEnergyCost + annualMaintenanceCost;

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
                    costPerYear: result?.cost_per_year,
                    npshAvailable: result?.npsh_available || 0,
                    npshRequired: result?.npsh_required,
                    npshMargin: (() => {
                        const a = result?.npsh_available || 0;
                        const r = result?.npsh_required || 0;
                        if (r > 0) return `${(((a - r) / r) * 100).toFixed(1)} %`;
                        if (a > 0) return '> 100%';
                        return '-';
                    })(),
                    isExtrapolated: result?.is_extrapolated,
                    cavitationRisk: result?.cavitation_risk,
                    lowNpshMarginLevel: (() => {
                        if (!result?.npsh_required || !result?.npsh_available || result.npsh_required <= 0) return 'safe';
                        const marginPercent = ((result.npsh_available - result.npsh_required) / result.npsh_required) * 100;
                        if (marginPercent < 0) return 'danger';
                        if (marginPercent < 20) return 'warning';
                        return 'safe';
                    })(),
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
                    networkDiagramImg: diagramImg,
                    networkDiagramRatio: diagramRatio,
                    economicImg: economicImg
                },
                economic: {
                    capex: capex,
                    opex: opex
                }
            };

            const { doc, filename } = generatePDFReport(data);
            pdfDocRef.current = doc;
            setPdfFilename(filename);
            setPdfStatus('ready');

        } catch (error: any) {
            setPdfStatus('idle');
            console.error("PDF Fail", error);
            alert(`Erro Geral ao gerar PDF: ${error.message || error}`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
            {/* 1. Header (Minimalist) */}
            <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-2 sm:px-4 shrink-0 z-30 shadow-sm sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-white font-bold tracking-tighter shadow-sm">
                        P+
                    </div>
                    <h1 className="text-lg font-bold text-slate-800 tracking-tight">Pumps<span className="text-sky-600">SaaS</span></h1>
                </div>

                <div className="flex items-center gap-1 sm:gap-3">
                    <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-md px-3 py-1.5 border border-slate-200">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patm</span>
                        <div className="text-sm font-medium w-16 text-right px-2">{pAtm.toFixed(3)}</div>
                        <span className="text-xs text-slate-400">bar</span>
                    </div>

                    <div className="hidden md:block h-6 w-px bg-slate-200 mx-1"></div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 hover:text-sky-600 gap-2"
                        onClick={handleGeneratePDF}
                    >
                        <FileText className="w-4 h-4" /> <span className="hidden sm:inline">PDF</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="text-slate-600 hover:text-sky-600 gap-2 border-slate-200 flex items-center justify-center px-2 sm:px-3"
                        onClick={() => setIsSupportOpen(true)}
                        title="Suporte"
                    >
                        <HelpCircle className="w-4 h-4 sm:hidden" />
                        <span className="hidden sm:inline">Suporte</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className={`text-slate-600 gap-2 border-slate-200 flex items-center justify-center px-2 sm:px-3 transition-colors ${mainView === 'economic' ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' : 'hover:text-amber-600 hover:bg-amber-50'}`}
                        onClick={() => setMainView(mainView === 'hydraulic' ? 'economic' : 'hydraulic')}
                        title="Análise Financeira [PREMIUM]"
                    >
                        <DollarSign className="w-4 h-4" />
                        <span className="hidden sm:inline font-semibold">{mainView === 'economic' ? 'Voltar ao Sistema' : 'Análise Financeira'}</span>
                    </Button>

                    {/* Add vertical divider */}
                    <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                    <NotificationPanel />

                    <Button
                        onClick={() => calculate()}
                        disabled={isCalculating}
                        className="bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 transition-all active:scale-95 flex-shrink-0 px-2 sm:px-3"
                        size="sm"
                    >
                        {isCalculating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current mr-0 sm:mr-2" />}
                        <span className="hidden sm:inline">Calculate</span>
                    </Button>
                </div>
            </header>

            {/* 2. Content Grid (Scrollable Main Page) */}
            <main className="flex-1 w-full max-w-[1920px] mx-auto p-2 sm:p-4 flex flex-col gap-4 sm:gap-6">
                
                {mainView === 'economic' ? (
                    <EconomicDashboard />
                ) : (
                    <>
                        {/* Top Section: Inputs & Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                            {/* LEFT COLUMN: Inputs (Natural Height) */}
                            <aside className="lg:col-span-7 flex flex-col gap-4">

                                {/* Section: System Conditions */}
                                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                    <CardHeader icon={Settings2} title="System Conditions" minimized={minimized['conditions']} toggle={() => toggleSection('conditions')} />
                                    {!minimized['conditions'] && (
                                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Static Head (m)</label>
                                                <Input type="number" value={staticHead} onChange={e => setStaticHead(Number(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Altitude (m)</label>
                                                <Input type="number" value={altitude} onChange={e => setAltitude(Number(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Suction Press. (barg)</label>
                                                <Input type="number" value={pSuction} onChange={e => setPressure('pressure_suction_bar_g', Number(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Discharge Press. (barg)</label>
                                                <Input type="number" value={pDischarge} onChange={e => setPressure('pressure_discharge_bar_g', Number(e.target.value))} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section: Energy & Cost */}
                                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                    <CardHeader icon={Zap} title="Energy & Cost Configuration" minimized={minimized['energy']} toggle={() => toggleSection('energy')} />
                                    {!minimized['energy'] && (
                                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Motor Eff. (%)</label>
                                                <Input type="number" step="0.1" value={efficiencyMotor * 100} onChange={e => setEnergyConfig('efficiency_motor', Number(e.target.value) / 100)} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Hours/Day</label>
                                                <Input type="number" value={hoursPerDay} onChange={e => setEnergyConfig('hours_per_day', Number(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Days/Year</label>
                                                <Input type="number" value={daysPerYear} onChange={e => setEnergyConfig('days_per_year', Number(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Cost (R$/kWh)</label>
                                                <Input type="number" step="0.01" value={energyCost} onChange={e => setEnergyConfig('energy_cost_per_kwh', Number(e.target.value))} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section: Fluid */}
                                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                    <CardHeader icon={Droplets} title="Fluid Properties" minimized={minimized['fluid']} toggle={() => toggleSection('fluid')} />
                                    {!minimized['fluid'] && (
                                        <div className="p-4 bg-white">
                                            <FluidManager />
                                        </div>
                                    )}
                                </div>

                                {/* Section: Pipes */}
                                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                    <CardHeader icon={LayoutGrid} title="Piping Network" minimized={minimized['pipes']} toggle={() => toggleSection('pipes')} />
                                    {!minimized['pipes'] && (
                                        <div className="p-0">
                                            <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                                                <PipeSegmentManager type="suction" />
                                            </div>
                                            <div className="p-4">
                                                <PipeSegmentManager type="discharge" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section: Pump */}
                                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                    <CardHeader icon={Settings2} title="Pump Curve" minimized={minimized['pump']} toggle={() => toggleSection('pump')} />
                                    {!minimized['pump'] && (
                                        <div className="p-4">
                                            <PumpCurveEditor />
                                        </div>
                                    )}
                                </div>

                            </aside>

                            {/* RIGHT COLUMN: Results & Charts (Sticky) */}
                            <section className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-6">

                                {/* Results KPI Bar (Cockpit Analítico) */}
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <CockpitKPIs result={result} isCalculating={isCalculating} error={error} />
                                </div>

                                {/* Bloco Dinâmico Inferior (Sistema de Abas) */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
                                    <div className="flex border-b border-slate-100 overflow-x-auto custom-scrollbar">
                                        <button
                                            onClick={() => setActiveTab('system')}
                                            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'system' ? 'border-sky-600 text-sky-700 bg-sky-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            📈 Curvas (System/NPSH)
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('losses')}
                                            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'losses' ? 'border-sky-600 text-sky-700 bg-sky-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            📋 Detalhamento de Perdas
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('memorial')}
                                            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'memorial' ? 'border-sky-600 text-sky-700 bg-sky-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            📐 Memorial de Cálculo
                                        </button>
                                    </div>

                                    <div className="p-4 flex-1 flex flex-col h-[500px] overflow-y-auto custom-scrollbar">
                                        {activeTab === 'system' && (
                                            <div className="flex flex-col gap-6 h-full">
                                                <div className="h-[300px] w-full shrink-0">
                                                    <HeadFlowChart data={chartData} operatingPoint={result} />
                                                </div>
                                                <div className="h-[250px] w-full shrink-0">
                                                    <NPSHChart data={chartData} operatingPoint={result} />
                                                </div>
                                            </div>
                                        )}
                                        {activeTab === 'losses' && (
                                            <DetailedLosses result={result} />
                                        )}
                                        {activeTab === 'memorial' && (
                                            <CalculationMemorial result={result} />
                                        )}
                                    </div>

                                    {!result && !isCalculating && (
                                        <div className="p-4 text-center text-sm text-slate-400 italic bg-slate-50/50 border-t border-slate-100">
                                            Click "Calculate" to view results.
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Bottom Section: Full Width Schematic */}
                        <section className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mt-4">
                            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                                <LayoutGrid className="w-5 h-5 text-sky-600" />
                                <h3 className="text-base font-bold text-slate-700">System Schematic Visualization (3D Isometric)</h3>
                            </div>

                            <div className="w-full h-[600px] bg-slate-50/30 p-4 relative overflow-x-auto overflow-y-hidden custom-scrollbar">
                                {result ? (
                                    <div className="w-[800px] sm:w-[1000px] h-full mx-auto flex-shrink-0">
                                        <SystemSchematic result={result} />
                                    </div>
                                ) : (
                                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                        <LayoutGrid className="w-12 h-12 opacity-20" />
                                        <span className="text-sm">Calculate to generate system schematic</span>
                                    </div>
                                )}
                            </div>
                        </section>
                    </>
                )}

            </main>

            {/*
                HIDDEN PDF CAPTURE ZONE
                Render everything needed for PDF here, always visible to html2canvas
             */}
            <div style={{ position: 'fixed', left: 0, top: 0, width: '1200px', backgroundColor: 'white', zIndex: -9999, opacity: 0, pointerEvents: 'none' }}>
                <div id="pdf-diagram" style={{ width: '1200px', padding: '20px' }}>
                    {/* User requested Exact Copy of Application -> printMode={false} */}
                    {result && <SystemSchematic result={result} printMode={false} />}
                </div>
                {/* Reduced Chart dimensions to reasonable print size */}
                <div id="pdf-chart-system" style={{ width: '1200px', height: '900px' }}> {/* Boxier Aspect Ratio */}
                    <HeadFlowChart data={chartData} operatingPoint={result} printMode={true} />
                </div>
                <div id="pdf-chart-npsh" style={{ width: '1200px', height: '900px' }}>
                    <NPSHChart data={chartData} operatingPoint={result} printMode={true} />
                </div>
                <div id="pdf-economic-dashboard" style={{ width: '1200px', padding: '20px' }}>
                    <EconomicDashboard />
                </div>
            </div>

            {/* PDF Generate Modal */}
            {pdfStatus !== 'idle' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-[400px] p-6 flex flex-col items-center animate-in zoom-in-95 duration-200">
                        {pdfStatus === 'generating' ? (
                            <>
                                <Sparkles className="w-10 h-10 text-sky-600 animate-spin mb-4" />
                                <h3 className="text-lg font-bold text-slate-800">Gerando Relatório...</h3>
                                <p className="text-sm text-slate-500 mt-2 text-center">
                                    Aguarde enquanto os gráficos são renderizados. Isso pode levar alguns segundos.
                                </p>
                            </>
                        ) : (
                            <>
                                <FileText className="w-12 h-12 text-emerald-500 mb-4" />
                                <h3 className="text-lg font-bold text-slate-800">Relatório Pronto!</h3>
                                <p className="text-sm text-slate-500 mt-2 text-center mb-6">
                                    O seu PDF foi gerado e está pronto para download com o formato correto.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setPdfStatus('idle');
                                            setDisclaimerAccepted(false);
                                            pdfDocRef.current = null;
                                        }}
                                    >
                                        Fechar
                                    </Button>
                                    <Button
                                        className="flex-1 bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!disclaimerAccepted}
                                        onClick={() => {
                                            if (pdfDocRef.current) {
                                                const blob = pdfDocRef.current.output('blob');
                                                saveAs(blob, pdfFilename);

                                                setPdfStatus('idle');
                                                setDisclaimerAccepted(false);
                                                pdfDocRef.current = null;
                                            }
                                        }}
                                    >
                                        Baixar PDF
                                    </Button>
                                </div>
                                <div className="mt-4 w-full p-3 bg-amber-50 border border-amber-200 rounded-md">
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="mt-1 w-4 h-4 text-sky-600 rounded border-gray-300 focus:ring-sky-500"
                                            checked={disclaimerAccepted}
                                            onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                                        />
                                        <span className="text-[11px] text-amber-800 font-medium leading-tight">
                                            Declaro ciência de que as curvas da biblioteca global são aproximações algorítmicas otimizadas para pré-dimensionamento. Assumo a responsabilidade técnica de validar as folhas de dados finais diretamente com o fabricante antes de qualquer aquisição ou aplicação industrial real.
                                        </span>
                                    </label>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <SupportModal
                isOpen={isSupportOpen}
                onClose={() => setIsSupportOpen(false)}
            />
        </div>
    );
};
