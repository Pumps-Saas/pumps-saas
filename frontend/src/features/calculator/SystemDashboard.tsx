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
import { Play, Sparkles, LayoutGrid, FileText, Settings2, Droplets, ArrowRight, Activity, Layers, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { generatePDFReport, ReportData } from './services/pdfGenerator';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { EconomicDashboard } from './EconomicDashboard';
import { ProjectManager } from '../projects/ProjectManager';
import { Zap } from 'lucide-react';

// UI Components for the Nocturne Layout
const CardHeader = ({ icon: Icon, title, minimized, toggle }: { icon: any, title: string, minimized?: boolean, toggle?: () => void }) => (
    <div className="flex items-center justify-between p-3.5 border-b border-[var(--color-divider)] bg-[var(--color-bg)]/40 cursor-pointer hover:bg-white/5 transition-colors select-none" onClick={toggle}>
        <div className="flex items-center gap-2.5 text-white font-semibold text-sm tracking-tight">
            <Icon className="w-4 h-4 text-[#9184d9]" />
            {title}
        </div>
        {toggle && <ArrowRight className={`w-3.5 h-3.5 text-muted transition-transform duration-150 ${minimized ? '' : 'rotate-90'}`} />}
    </div>
);

export const SystemDashboard: React.FC = () => {
    // Store State
    const calculate = useSystemStore(state => state.calculateOperatingPoint);
    const isCalculating = useSystemStore(state => state.isCalculating);
    const result = useSystemStore(state => state.operatingPoint);
    const error = useSystemStore(state => state.calculationError);
    const activeView = useSystemStore(state => state.activeView);
    const setActiveView = useSystemStore(state => state.setActiveView);
    const uiLanguage = useSystemStore(state => state.uiLanguage);

    // Local UI State
    const [minimized, setMinimized] = useState<Record<string, boolean>>({});
    const [systemCurvePoints, setSystemCurvePoints] = useState<any[]>([]);

    // PDF State
    const [pdfStatus, setPdfStatus] = useState<'idle' | 'generating' | 'ready'>('idle');
    const [pdfFilename, setPdfFilename] = useState<string>('');
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
    const pdfDocRef = React.useRef<any>(null);

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
            const existingBase = dataMap.get(p.flow) || { flow: p.flow };
            existingBase.basePumpHead = p.head;
            if (p.npshr !== undefined) {
                existingBase.baseNpshRequired = p.npshr;
            }
            dataMap.set(p.flow, existingBase);

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
            const diagramEl = document.getElementById('pdf-diagram');
            const systemChartEl = document.getElementById('pdf-chart-system');
            const npshChartEl = document.getElementById('pdf-chart-npsh');
            const economicEl = document.getElementById('pdf-economic-dashboard');

            let diagramImg, chart1Img, chart2Img, economicImg;
            let diagramRatio = 1;

            try {
                if (diagramEl) {
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
                    // @ts-ignore
                    const canvas = await html2canvas(economicEl, { scale: 1.5, backgroundColor: '#ffffff', logging: true, useCORS: true, allowTaint: true });
                    economicImg = canvas.toDataURL('image/jpeg', 0.8);
                }
            } catch (e: any) {
                console.error("Failed to capture Economic Chart", e);
            }

            const storeState = useSystemStore.getState();
            const capex = storeState.pump_cost + storeState.installation_cost;
            const powerKw = result?.power_kw || 0;
            const annualEnergyCost = powerKw * storeState.hours_per_day * storeState.days_per_year * storeState.energy_cost_per_kwh;
            const annualMaintenanceCost = capex * (storeState.maintenance_rate / 100);
            const opex = annualEnergyCost + annualMaintenanceCost;

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
        <div className="flex flex-col gap-6 text-[var(--color-text)]">
            
            {/* VIEW 1: PAINEL / HUB */}
            {activeView === 'hub' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="card border border-[var(--color-divider)] p-4 flex items-center justify-between">
                            <div>
                                <span className="text-xs text-muted block uppercase font-semibold">Fluido Ativo</span>
                                <span className="text-base font-bold text-white mt-1 block">{fluid.name}</span>
                            </div>
                            <Droplets className="w-8 h-8 text-[#9184d9]/40" />
                        </div>
                        <div className="card border border-[var(--color-divider)] p-4 flex items-center justify-between">
                            <div>
                                <span className="text-xs text-muted block uppercase font-semibold">Desnível Estático</span>
                                <span className="text-base font-bold text-white mt-1 block">{staticHead.toFixed(1)} mca</span>
                            </div>
                            <Activity className="w-8 h-8 text-[#5fd08a]/40" />
                        </div>
                        <div className="card border border-[var(--color-divider)] p-4 flex items-center justify-between">
                            <div>
                                <span className="text-xs text-muted block uppercase font-semibold">Ponto Operacional</span>
                                <span className="text-base font-bold text-white mt-1 block">
                                    {result ? `${result.flow_op.toFixed(1)} m³/h @ ${result.head_op.toFixed(1)} m` : 'Não Calculado'}
                                </span>
                            </div>
                            <TrendingUp className="w-8 h-8 text-[#e0a94b]/40" />
                        </div>
                        <div className="card border border-[var(--color-divider)] p-4 flex flex-col justify-center gap-2">
                            <button onClick={() => setActiveView('calc')} className="btn btn-primary w-full text-xs">
                                <Play className="w-3.5 h-3.5" /> Ir para Novo Cálculo
                            </button>
                        </div>
                    </div>

                    <ProjectManager />
                </div>
            )}

            {/* VIEW 2: NOVO CÁLCULO (Mescla Consciente - 2 colunas) */}
            {activeView === 'calc' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
                    
                    {/* ESQUERDA: Seções e Inputs (Nocturne Retráteis) */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                        
                        {/* Seção 1: Condições Operacionais e Geometria Estática */}
                        <div className="card border border-[var(--color-divider)] p-0 overflow-hidden">
                            <CardHeader icon={Settings2} title={uiLanguage === 'pt' ? "Condições do Sistema (Pressões & Desnível)" : "System Conditions"} minimized={minimized['conditions']} toggle={() => toggleSection('conditions')} />
                            {!minimized['conditions'] && (
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="field">
                                        <label>{uiLanguage === 'pt' ? 'Desnível Estático (ΔZ mca)' : 'Static Head (m)'}</label>
                                        <Input type="number" value={staticHead} onChange={e => setStaticHead(Number(e.target.value))} className="input" />
                                    </div>
                                    <div className="field">
                                        <label>{uiLanguage === 'pt' ? 'Altitude do Local (m)' : 'Altitude (m)'}</label>
                                        <Input type="number" value={altitude} onChange={e => setAltitude(Number(e.target.value))} className="input" />
                                    </div>
                                    <div className="field">
                                        <label>{uiLanguage === 'pt' ? 'Pressão de Sucção (barg)' : 'Suction Press. (barg)'}</label>
                                        <Input type="number" value={pSuction} onChange={e => setPressure('pressure_suction_bar_g', Number(e.target.value))} className="input" />
                                    </div>
                                    <div className="field">
                                        <label>{uiLanguage === 'pt' ? 'Pressão de Recalque (barg)' : 'Discharge Press. (barg)'}</label>
                                        <Input type="number" value={pDischarge} onChange={e => setPressure('pressure_discharge_bar_g', Number(e.target.value))} className="input" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Seção 2: Propriedades do Fluido */}
                        <div className="card border border-[var(--color-divider)] p-0 overflow-hidden">
                            <CardHeader icon={Droplets} title={uiLanguage === 'pt' ? "Propriedades do Fluido" : "Fluid Properties"} minimized={minimized['fluid']} toggle={() => toggleSection('fluid')} />
                            {!minimized['fluid'] && (
                                <div className="p-4">
                                    <FluidManager />
                                </div>
                            )}
                        </div>

                        {/* Seção 3: Rede de Tubulação (Sucção & Recalque) */}
                        <div className="card border border-[var(--color-divider)] p-0 overflow-hidden">
                            <CardHeader icon={LayoutGrid} title={uiLanguage === 'pt' ? "Rede de Tubulação (Sucção & Recalque)" : "Piping Network"} minimized={minimized['pipes']} toggle={() => toggleSection('pipes')} />
                            {!minimized['pipes'] && (
                                <div className="p-0">
                                    <div className="p-4 border-b border-[var(--color-divider)] bg-[var(--color-bg)]/20">
                                        <PipeSegmentManager type="suction" />
                                    </div>
                                    <div className="p-4">
                                        <PipeSegmentManager type="discharge" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Seção 4: Curva e Especificação da Bomba */}
                        <div className="card border border-[var(--color-divider)] p-0 overflow-hidden">
                            <CardHeader icon={Layers} title={uiLanguage === 'pt' ? "Curva Hidráulica da Bomba" : "Pump Curve Specification"} minimized={minimized['pump']} toggle={() => toggleSection('pump')} />
                            {!minimized['pump'] && (
                                <div className="p-4">
                                    <PumpCurveEditor />
                                </div>
                            )}
                        </div>

                        {/* Seção 5: Parâmetros de Energia e Custo */}
                        <div className="card border border-[var(--color-divider)] p-0 overflow-hidden">
                            <CardHeader icon={Zap} title={uiLanguage === 'pt' ? "Configuração de Operação & Energia" : "Energy & Cost Configuration"} minimized={minimized['energy']} toggle={() => toggleSection('energy')} />
                            {!minimized['energy'] && (
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="field">
                                        <label>{uiLanguage === 'pt' ? 'Eficiência Motor (%)' : 'Motor Eff. (%)'}</label>
                                        <Input type="number" step="0.1" value={efficiencyMotor * 100} onChange={e => setEnergyConfig('efficiency_motor', Number(e.target.value) / 100)} className="input" />
                                    </div>
                                    <div className="field">
                                        <label>{uiLanguage === 'pt' ? 'Horas / Dia' : 'Hours/Day'}</label>
                                        <Input type="number" value={hoursPerDay} onChange={e => setEnergyConfig('hours_per_day', Number(e.target.value))} className="input" />
                                    </div>
                                    <div className="field">
                                        <label>{uiLanguage === 'pt' ? 'Dias / Ano' : 'Days/Year'}</label>
                                        <Input type="number" value={daysPerYear} onChange={e => setEnergyConfig('days_per_year', Number(e.target.value))} className="input" />
                                    </div>
                                    <div className="field">
                                        <label>{uiLanguage === 'pt' ? 'Tarifa (R$/kWh)' : 'Cost (R$/kWh)'}</label>
                                        <Input type="number" step="0.01" value={energyCost} onChange={e => setEnergyConfig('energy_cost_per_kwh', Number(e.target.value))} className="input" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* DIREITA: Botoeira Principal, Destaques em Tempo Real & Diagrama Sticky */}
                    <div className="lg:col-span-5 flex flex-col gap-5 lg:sticky lg:top-20">
                        
                        {/* Botoeira de Ação e Status */}
                        <div className="card border border-[var(--color-divider)] p-4 flex flex-col sm:flex-row gap-3 items-center justify-between bg-gradient-to-r from-[#232532] to-[#262a60]">
                            <div>
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-[#5fd08a]" />
                                    <span>Motor Hidráulico Integrado</span>
                                </div>
                                <div className="text-xs text-muted mt-0.5">Pressão atmosférica calculada: <strong className="text-white">{pAtm.toFixed(3)} bar</strong></div>
                            </div>

                            <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                {result && (
                                    <button onClick={handleGeneratePDF} className="btn btn-secondary text-xs shrink-0 border-[#9184d9]/40 hover:bg-[#9184d9]/10 text-white">
                                        <FileText className="w-3.5 h-3.5 text-[#9184d9]" /> PDF
                                    </button>
                                )}
                                <button
                                    onClick={() => calculate()}
                                    disabled={isCalculating}
                                    className="btn btn-primary bg-[#9184d9] text-white hover:bg-[#796cbf] font-bold py-2 px-5 text-sm shadow-lg w-full sm:w-auto flex items-center justify-center gap-2"
                                >
                                    {isCalculating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                    <span>{uiLanguage === 'pt' ? 'Calcular Ponto' : 'Calculate'}</span>
                                </button>
                            </div>
                        </div>

                        {/* KPIs em tempo real */}
                        <CockpitKPIs result={result} isCalculating={isCalculating} error={error} />

                        {/* Diagrama 3D / Isometric */}
                        <div className="card border border-[var(--color-divider)] p-4">
                            <div className="flex items-center justify-between border-b border-[var(--color-divider)] pb-2.5 mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                                    <LayoutGrid className="w-4 h-4 text-[#9184d9]" /> Visualização Esquemática do Sistema (Ao Vivo)
                                </span>
                                {result && <span className="tag tag-accent text-[10px]">Interativo</span>}
                            </div>
                            <div className="w-full h-[360px] bg-[var(--color-bg)]/40 rounded-lg p-2 relative overflow-x-auto overflow-y-hidden border border-[var(--color-divider)]">
                                {result ? (
                                    <div className="w-[700px] sm:w-[850px] h-full mx-auto flex-shrink-0">
                                        <SystemSchematic result={result} />
                                    </div>
                                ) : (
                                    <div className="h-full w-full flex flex-col items-center justify-center text-muted gap-2 text-xs text-center">
                                        <LayoutGrid className="w-10 h-10 opacity-20" />
                                        <span>Clique em <strong>Calcular Ponto</strong> acima para gerar a representação hidráulica</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* VIEW 3: RESULTADOS (Gráficos, NPSH e Tabelas de Perdas) */}
            {activeView === 'results' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-[var(--color-divider)] pb-3">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <TrendingUp className="text-[#9184d9] w-6 h-6" /> Análise Operacional do Ponto de Interseção
                            </h2>
                            <p className="text-xs text-muted mt-1">Curvas de Altura Manométrica vs Vazão e Curva dedicada de NPSHa x NPSHr</p>
                        </div>
                        <button onClick={() => calculate()} disabled={isCalculating} className="btn btn-primary text-xs">
                            <Play className="w-3.5 h-3.5 fill-current" /> Recalcular Ponto
                        </button>
                    </div>

                    <CockpitKPIs result={result} isCalculating={isCalculating} error={error} />

                    {/* Gráficos de Curva (System + NPSHa x NPSHr explicitamente preservados) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card border border-[var(--color-divider)] p-5">
                            <h3 className="text-sm font-bold text-white border-b border-[var(--color-divider)] pb-2.5 mb-4">
                                Curva Hidráulica do Sistema vs. Curva da Bomba (AMT x Vazão)
                            </h3>
                            <div className="h-[340px] w-full">
                                <HeadFlowChart data={chartData} operatingPoint={result} />
                            </div>
                        </div>

                        <div className="card border border-[var(--color-divider)] p-5">
                            <h3 className="text-sm font-bold text-white border-b border-[var(--color-divider)] pb-2.5 mb-4">
                                Curva de NPSH Disponível vs. NPSH Requerido (NPSHa x NPSHr)
                            </h3>
                            <div className="h-[340px] w-full">
                                <NPSHChart data={chartData} operatingPoint={result} />
                            </div>
                        </div>
                    </div>

                    {/* Detalhamento de Perdas por Trecho */}
                    <DetailedLosses result={result} />
                </div>
            )}

            {/* VIEW 4: BOMBAS (Comparação & Catálogo) */}
            {activeView === 'pumps' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-[var(--color-divider)] pb-3">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Settings2 className="text-[#9184d9] w-6 h-6" /> Curvas, Catálogo e Configuração de Bombas
                            </h2>
                            <p className="text-xs text-muted mt-1">Crie bombas via pontos operacionais, ajuste RPMs e verifique atendimento hidráulico</p>
                        </div>
                        <button onClick={() => setActiveView('calc')} className="btn btn-secondary text-xs">
                            Voltar ao Dimensionamento
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8">
                            <div className="card border border-[var(--color-divider)] p-5">
                                <PumpCurveEditor />
                            </div>
                        </div>
                        <div className="lg:col-span-4 flex flex-col gap-4">
                            <div className="card border border-[var(--color-divider)] p-5 bg-[var(--color-bg)]/40">
                                <h3 className="text-sm font-bold text-white mb-2">Simulação de Rotação (VFD)</h3>
                                <p className="text-xs text-muted mb-4">Ajuste a rotação de operação atual vs RPM nominal da curva para verificar as Leis de Semelhança de Rateau.</p>
                                <div className="flex flex-col gap-3">
                                    <div className="field">
                                        <label>RPM Nominal da Curva (Base)</label>
                                        <Input type="number" value={pumpBaseRpm} disabled className="input opacity-70" />
                                    </div>
                                    <div className="field">
                                        <label>RPM Atual / Requerido na Operação</label>
                                        <Input type="number" value={pumpCurrentRpm} onChange={e => useSystemStore.getState().setPumpCurrentRpm(Number(e.target.value))} className="input border-[#9184d9]" />
                                    </div>
                                    <div className="field">
                                        <label>Bombas em Paralelo</label>
                                        <Input type="number" min="1" max="10" value={parallelPumps} onChange={e => useSystemStore.getState().setParallelPumps(Number(e.target.value))} className="input" />
                                    </div>
                                    <button onClick={() => calculate()} className="btn btn-primary mt-2 text-xs">
                                        <Play className="w-3.5 h-3.5" /> Recalcular Sistema com Nova Rotação
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 5: FINANÇAS (Análise Econômica / LCC) */}
            {activeView === 'finance' && (
                <EconomicDashboard />
            )}

            {/* VIEW 6: RELATÓRIO (Memorial e Exportação PDF) */}
            {activeView === 'report' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                    <div className="card border border-[var(--color-divider)] p-6 bg-gradient-to-r from-[#232532] to-[#262a60] flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                                <FileText className="w-6 h-6 text-[#9184d9]" /> Memorial Técnico de Cálculo & Exportação
                            </h2>
                            <p className="text-xs text-muted mt-1 max-w-xl">
                                Relatório completo documentando o balanço de energia hidráulica, parcelas de perdas e gráficos para anexar a folhas de dados de especificação.
                            </p>
                        </div>
                        <div className="flex gap-3 shrink-0">
                            <button
                                onClick={handleGeneratePDF}
                                disabled={!result || pdfStatus === 'generating'}
                                className="btn btn-primary bg-[#9184d9] hover:bg-[#796cbf] text-white py-2.5 px-6 font-bold text-sm shadow-lg flex items-center gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                <span>{pdfStatus === 'generating' ? 'Gerando PDF...' : 'Exportar Relatório PDF'}</span>
                            </button>
                        </div>
                    </div>

                    {result ? (
                        <>
                            <CalculationMemorial result={result} />
                            <DetailedLosses result={result} />
                        </>
                    ) : (
                        <div className="card border border-[var(--color-divider)] p-12 text-center text-muted">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <h3 className="text-base font-bold text-white">Nenhum cálculo efetuado na sessão atual</h3>
                            <p className="text-xs mt-1">Vá até a aba <strong>Novo cálculo</strong> e clique em Calcular para preencher as equações do memorial.</p>
                        </div>
                    )}
                </div>
            )}

            {/*
                HIDDEN PDF CAPTURE ZONE (100% Inviolável - Mescla Consciente)
                Garante que os IDs exatos existam no DOM para html2canvas gerar os relatórios em alta resolução
             */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '1200px', backgroundColor: 'white', zIndex: -9999, opacity: 0, pointerEvents: 'none' }}>
                <div id="pdf-diagram" style={{ width: '1200px', padding: '20px' }}>
                    {result && <SystemSchematic result={result} printMode={false} />}
                </div>
                <div id="pdf-chart-system" style={{ width: '1200px', height: '900px' }}>
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
                <div className="dialog-backdrop animate-in fade-in duration-200">
                    <div className="dialog w-full max-w-[440px] items-center text-center p-6">
                        {pdfStatus === 'generating' ? (
                            <>
                                <Sparkles className="w-10 h-10 text-[#9184d9] animate-spin mb-3" />
                                <h3 className="text-lg font-bold text-white">Gerando Relatório Técnico...</h3>
                                <p className="text-xs text-muted mt-2">
                                    Aguarde enquanto os diagramas hidráulicos e curvas são renderizados em alta fidelidade.
                                </p>
                            </>
                        ) : (
                            <>
                                <FileText className="w-12 h-12 text-[#5fd08a] mb-3" />
                                <h3 className="text-lg font-bold text-white">Relatório Técnico Prontificado!</h3>
                                <p className="text-xs text-muted mt-1.5 mb-5">
                                    O documento PDF foi montado com o memorial de cálculo completo e tabelas de perdas.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        className="btn btn-secondary flex-1"
                                        onClick={() => {
                                            setPdfStatus('idle');
                                            setDisclaimerAccepted(false);
                                            pdfDocRef.current = null;
                                        }}
                                    >
                                        Fechar
                                    </button>
                                    <button
                                        className="btn btn-primary flex-1 bg-[#5fd08a] border-[#5fd08a] text-[#161826] hover:bg-[#4ebe78] font-bold disabled:opacity-40"
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
                                    </button>
                                </div>
                                <div className="mt-4 w-full p-3 bg-[#e0a94b]/15 border border-[#e0a94b]/40 rounded-lg text-left">
                                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            className="mt-0.5 w-4 h-4 text-[#9184d9] rounded border-gray-600 focus:ring-[#9184d9]"
                                            checked={disclaimerAccepted}
                                            onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                                        />
                                        <span className="text-[11px] text-white/90 font-medium leading-normal">
                                            Declaro ciência de que as curvas da biblioteca global são aproximações algorítmicas otimizadas para pré-dimensionamento. Assumo a responsabilidade técnica de validar as folhas de dados finais diretamente com o fabricante antes de qualquer aquisição ou aplicação industrial real.
                                        </span>
                                    </label>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
