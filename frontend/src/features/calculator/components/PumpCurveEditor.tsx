import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Sparkles, Search } from 'lucide-react';
import { useSystemStore } from '../stores/useSystemStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PumpCurvePoint } from '@/types/engineering';
import { api } from '@/api/client';
import { useToast } from '@/components/ui/Toast';

export const PumpCurveEditor: React.FC = () => {
    // Store State
    const points = useSystemStore(state => state.pump_curve);
    const setPoints = useSystemStore(state => state.setPumpCurve);
    const manufacturer = useSystemStore(state => state.pump_manufacturer);
    const model = useSystemStore(state => state.pump_model);
    const setPumpDetails = useSystemStore(state => state.setPumpDetails);
    
    // Premium State
    const pump_base_rpm = useSystemStore(state => state.pump_base_rpm);
    const pump_current_rpm = useSystemStore(state => state.pump_current_rpm);
    const parallel_pumps = useSystemStore(state => state.parallel_pumps);
    const setPumpBaseRpm = useSystemStore(state => state.setPumpBaseRpm);
    const setPumpCurrentRpm = useSystemStore(state => state.setPumpCurrentRpm);
    const setParallelPumps = useSystemStore(state => state.setParallelPumps);

    const { addToast } = useToast();

    // Persistence State
    const [savedPumps, setSavedPumps] = useState<any[]>([]);
    const [selectedPumpId, setSelectedPumpId] = useState("");
    const [isLoadingPumps, setIsLoadingPumps] = useState(true);

    // AI Select State
    const pSuction = useSystemStore(state => state.pressure_suction_bar_g);
    const pDischarge = useSystemStore(state => state.pressure_discharge_bar_g);
    const staticHead = useSystemStore(state => state.static_head);
    const fluid = useSystemStore(state => state.fluid);
    const suction = useSystemStore(state => state.suction_sections);
    const dischargeBefore = useSystemStore(state => state.discharge_sections_before);
    const dischargeParallel = useSystemStore(state => state.discharge_parallel_sections);
    const dischargeAfter = useSystemStore(state => state.discharge_sections_after);

    const [isAutoSelecting, setIsAutoSelecting] = useState(false);
    const [aiResults, setAiResults] = useState<any[]>([]);

    useEffect(() => {
        loadPumps();
    }, []);

    const loadPumps = async () => {
        setIsLoadingPumps(true);
        try {
            const res = await api.pumps.list();
            setSavedPumps(res.data);
        } catch (error) {
            console.error("Failed to load pumps", error);
        } finally {
            setIsLoadingPumps(false);
        }
    };

    const handleLoadPump = async (pumpId: string) => {
        setSelectedPumpId(pumpId);
        if (!pumpId) return;

        try {
            const res = await api.pumps.get(pumpId);
            const pump = res.data;
            setPoints(pump.curve_points);
            setPumpDetails(pump.manufacturer, pump.model);
        } catch (error) {
            console.error("Failed to fetch full pump details", error);
            addToast("Falha ao carregar curva da bomba", 'error');
        }
    };

    const handleSavePump = async () => {
        if (!manufacturer || !model) {
            addToast("Preencha o Fabricante e Modelo", 'warning');
            return;
        }
        if (points.length < 3) {
            addToast("Insira pelo menos 3 pontos operacionais", 'warning');
            return;
        }

        try {
            await api.pumps.create({
                manufacturer,
                model,
                curve_points: points
            });
            addToast("Bomba salva na biblioteca!", 'success');
            loadPumps();
        } catch (error: any) {
            console.error("Failed to save pump", error);
            addToast(`Falha ao salvar: ${error.response?.data?.detail || error.message}`, 'error');
        }
    };

    const handleDeletePump = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedPumpId) return;
        if (!confirm("Excluir esta bomba da biblioteca?")) return;

        try {
            await api.pumps.delete(parseInt(selectedPumpId));
            setSelectedPumpId("");
            setPumpDetails("", "");
            loadPumps();
        } catch (error) {
            console.error("Failed to delete pump", error);
        }
    };

    const handleAutoSelect = async () => {
        setIsAutoSelecting(true);
        setAiResults([]);
        try {
            const res = await api.pumps.autoSelect({
                suction_sections: suction,
                discharge_sections_before: dischargeBefore,
                discharge_parallel_sections: dischargeParallel,
                discharge_sections_after: dischargeAfter,
                fluid: fluid,
                static_head_m: staticHead,
                pressure_suction_bar_g: pSuction,
                pressure_discharge_bar_g: pDischarge,
                atmospheric_pressure_bar: 1.013,
                flow_min_m3h: 0,
                flow_max_m3h: 100,
                steps: 30
            });
            setAiResults(res.data);
            if (res.data.length === 0) {
                addToast("Nenhuma bomba ideal encontrada para este sistema.", 'warning');
            } else {
                addToast(`Encontradas ${res.data.length} bombas recomendadas!`, 'success');
            }
        } catch (error: any) {
            console.error("Auto select failed", error);
            addToast(error.response?.status === 403 ? "Recurso Premium Requerido" : "Falha na seleção inteligente", 'error');
        } finally {
            setIsAutoSelecting(false);
        }
    };

    const applyAiPump = (pump: any) => {
        setPoints(pump.curve_points);
        setPumpDetails(pump.manufacturer, pump.model);
        setAiResults([]); // Close list
        addToast(`Aplicada ${pump.manufacturer} ${pump.model}`, 'success');
    };

    const addPoint = () => {
        setPoints([...points, { flow: '' as any, head: '' as any, efficiency: '' as any }]);
    };

    const updatePoint = (index: number, field: keyof PumpCurvePoint, value: number) => {
        const newPoints = [...points];
        newPoints[index] = { ...newPoints[index], [field]: value };
        setPoints(newPoints);
    };

    const removePoint = (index: number) => {
        const newPoints = points.filter((_, i) => i !== index);
        setPoints(newPoints);
    };

    const pumpOptions = [
        { label: isLoadingPumps ? "Carregando biblioteca de bombas..." : "Selecione uma Bomba da Biblioteca...", value: "" },
        ...savedPumps.map(p => ({ label: `${p.manufacturer} - ${p.model}`, value: p.id.toString() }))
    ];

    return (
        <div className="flex flex-col gap-5 text-[var(--color-text)]">
            <div className="flex flex-col gap-4 border-b border-[var(--color-divider)] pb-4">
                {/* Library Controls */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-end">
                    <div className="flex-1">
                        <Select
                            label="Carregar Curva da Biblioteca Catálogo"
                            options={pumpOptions}
                            value={selectedPumpId}
                            onChange={(e) => handleLoadPump(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="primary"
                            className="bg-[#9184d9] hover:bg-[#796cbf] text-white font-bold flex-1 sm:flex-initial"
                            onClick={handleAutoSelect}
                            disabled={isAutoSelecting}
                            icon={isAutoSelecting ? <Sparkles className="animate-spin text-[#e0a94b]" size={15} /> : <Search size={15} />}
                            title="Seleção Automática com Inteligência Algorítmica"
                        >
                            Auto Seleção AI
                        </Button>
                        {selectedPumpId && (
                            <Button
                                variant="danger"
                                className="bg-[#e06b6b]/15 text-[#e06b6b] hover:bg-[#e06b6b]/30 border border-[#e06b6b]/40"
                                onClick={handleDeletePump}
                                icon={<Trash2 size={15} />}
                            >
                                Excluir
                            </Button>
                        )}
                    </div>
                </div>

                {/* AI Results Dropdown */}
                {aiResults.length > 0 && (
                    <div className="bg-[var(--color-surface)] border border-[#9184d9] rounded-xl p-4 shadow-xl animate-in fade-in duration-200">
                        <h4 className="text-xs font-bold text-[#9184d9] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Sparkles size={15} className="text-[#e0a94b]" /> Recomendações Hidráulicas da AI
                        </h4>
                        <div className="flex flex-col gap-2.5">
                            {aiResults.map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-[var(--color-bg)]/60 p-3 rounded-lg border border-[var(--color-divider)] hover:border-[#9184d9]/50 transition-colors">
                                    <div>
                                        <div className="font-bold text-sm text-white flex items-center gap-2">
                                            <span>{p.manufacturer} {p.model}</span>
                                            <span className="tag tag-accent text-[10px]">Recomendada</span>
                                        </div>
                                        <div className="text-xs text-muted mt-1 font-mono">
                                            Ponto Ótimo: {p.flow_op.toFixed(1)} m³/h @ {p.head_op.toFixed(1)} m (Rendimento: {p.efficiency_op.toFixed(1)}%)
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={() => applyAiPump(p)} className="bg-[#5fd08a] text-[#161826] hover:bg-[#4ebe78] font-bold h-8 px-4 text-xs">
                                        Aplicar Curva
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Metadata Inputs */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-end w-full">
                    <div className="grid grid-cols-2 gap-2.5 w-full sm:flex-1">
                        <Input
                            label="Fabricante da Bomba"
                            value={manufacturer}
                            onChange={(e) => setPumpDetails(e.target.value, model)}
                            placeholder="Ex: KSB, Sulzer, Schneider..."
                        />
                        <Input
                            label="Modelo da Bomba"
                            value={model}
                            onChange={(e) => setPumpDetails(manufacturer, e.target.value)}
                            placeholder="Ex: MegaCPK 50-200"
                        />
                    </div>
                    <Button
                        onClick={handleSavePump}
                        icon={<Save size={15} />}
                        className="w-full sm:w-auto bg-[#5fd08a] text-[#161826] hover:bg-[#4ebe78] font-bold"
                        title="Salvar curva atual na biblioteca"
                    >
                        Salvar
                    </Button>
                </div>
                
                {/* Premium Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-2 bg-[var(--color-bg)]/60 p-3.5 rounded-lg border border-[var(--color-divider)]">
                    <div className="flex items-center gap-2 mb-1 sm:mb-0 sm:col-span-3">
                        <span className="text-[10px] font-bold text-[#161826] bg-[#e0a94b] px-2 py-0.5 rounded uppercase">Inversor / Leis de Semelhança</span>
                        <span className="text-xs font-semibold text-white">Simulação e Ajuste Rotacional (Rateau)</span>
                    </div>
                    <Input
                        label="RPM Nominal (Base da Curva)"
                        type="number"
                        value={pump_base_rpm || ''}
                        onChange={(e) => setPumpBaseRpm(Number(e.target.value))}
                    />
                    <Input
                        label="RPM Operacional (Atual via VFD)"
                        type="number"
                        value={pump_current_rpm || ''}
                        onChange={(e) => setPumpCurrentRpm(Number(e.target.value))}
                    />
                    <Input
                        label="Bombas Operando em Paralelo"
                        type="number"
                        min="1"
                        value={parallel_pumps || ''}
                        onChange={(e) => setParallelPumps(Math.max(1, Number(e.target.value)))}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted">
                <span>Insira pelo menos <strong>3 pontos operacionais</strong> (Vazão x AMT) da curva do fabricante para interpolação polinomial.</span>
                <Button size="sm" variant="secondary" onClick={addPoint} icon={<Plus size={13} className="mr-1" />} className="text-[#9184d9] border-[#9184d9]/30">
                    Adicionar Ponto
                </Button>
            </div>

            {points.length === 0 ? (
                <div className="text-center py-10 bg-[var(--color-bg)]/40 rounded-lg border-dashed border border-[var(--color-divider)]">
                    <p className="text-muted text-xs mb-3 italic">Nenhum ponto da curva inserido no momento.</p>
                    <Button size="md" onClick={addPoint} icon={<Plus size={15} />} className="bg-[#9184d9] text-white">
                        Adicionar Primeiro Ponto
                    </Button>
                </div>
            ) : (
                <div className="border border-[var(--color-divider)] rounded-lg overflow-hidden">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Vazão (m³/h)</th>
                                <th>Alt. Manométrica (mca)</th>
                                <th>Rendimento (%)</th>
                                <th>NPSHr (m) <span className="text-[10px] font-normal opacity-70">(Opcional)</span></th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {points.map((point, index) => (
                                <tr key={index}>
                                    <td className="py-2 px-3">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={point.flow ?? ''}
                                            onChange={(e) => updatePoint(index, 'flow', e.target.value === '' ? '' as any : Math.max(0, parseFloat(e.target.value)))}
                                            className="h-8 text-xs font-mono"
                                            placeholder="Ex: 25.0"
                                        />
                                    </td>
                                    <td className="py-2 px-3">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={point.head ?? ''}
                                            onChange={(e) => updatePoint(index, 'head', e.target.value === '' ? '' as any : Math.max(0, parseFloat(e.target.value)))}
                                            className="h-8 text-xs font-mono"
                                            placeholder="Ex: 45.0"
                                        />
                                    </td>
                                    <td className="py-2 px-3">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={point.efficiency ?? ''}
                                            onChange={(e) => updatePoint(index, 'efficiency', e.target.value === '' ? '' as any : Math.min(100, Math.max(0, parseFloat(e.target.value))))}
                                            className="h-8 text-xs font-mono"
                                            placeholder="Ex: 72.5"
                                        />
                                    </td>
                                    <td className="py-2 px-3">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={point.npshr ?? ''}
                                            onChange={(e) => updatePoint(index, 'npshr', e.target.value === '' ? '' as any : Math.max(0, parseFloat(e.target.value)))}
                                            className="h-8 text-xs font-mono"
                                            placeholder="Ex: 2.1"
                                        />
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                        <button onClick={() => removePoint(index)} className="text-muted hover:text-[#e06b6b] p-1.5 transition-colors" title="Excluir ponto">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
