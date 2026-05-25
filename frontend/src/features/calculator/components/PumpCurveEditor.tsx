import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Sparkles, Search } from 'lucide-react';
import { useSystemStore } from '../stores/useSystemStore';
import { Card } from '@/components/ui/Card';
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

    // Local state for inputs to avoid jitter, sync on blur or change? 
    // Actually, direct store update for inputs is fine for this scale.

    useEffect(() => {
        loadPumps();
    }, []);

    const loadPumps = async () => {
        try {
            const res = await api.pumps.list();
            setSavedPumps(res.data);
        } catch (error) {
            console.error("Failed to load pumps", error);
        }
    };

    const handleLoadPump = (pumpId: string) => {
        setSelectedPumpId(pumpId);
        if (!pumpId) return;

        const pump = savedPumps.find(p => p.id.toString() === pumpId);
        if (pump) {
            setPoints(pump.curve_points);
            setPumpDetails(pump.manufacturer, pump.model);
        }
    };

    const handleSavePump = async () => {
        if (!manufacturer || !model) {
            addToast("Please enter Manufacturer and Model", 'warning');
            return;
        }
        if (points.length < 3) {
            addToast("Please enter at least 3 points", 'warning');
            return;
        }

        try {
            await api.pumps.create({
                manufacturer,
                model,
                curve_points: points
            });
            addToast("Pump Saved to Library!", 'success');
            loadPumps();
        } catch (error: any) {
            console.error("Failed to save pump", error);
            addToast(`Failed to save: ${error.response?.data?.detail || error.message}`, 'error');
        }
    };

    const handleDeletePump = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedPumpId) return;
        if (!confirm("Delete this pump from library?")) return;

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
                addToast("No suitable pumps found for this system.", 'warning');
            } else {
                addToast(`Found ${res.data.length} optimal pumps!`, 'success');
            }
        } catch (error: any) {
            console.error("Auto select failed", error);
            addToast(error.response?.status === 403 ? "Premium Feature Required" : "Failed to auto-select pump", 'error');
        } finally {
            setIsAutoSelecting(false);
        }
    };

    const applyAiPump = (pump: any) => {
        setPoints(pump.curve_points);
        setPumpDetails(pump.manufacturer, pump.model);
        setAiResults([]); // Close list
        addToast(`Applied ${pump.manufacturer} ${pump.model}`, 'success');
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
        { label: "Select from Library...", value: "" },
        ...savedPumps.map(p => ({ label: `${p.manufacturer} - ${p.model}`, value: p.id.toString() }))
    ];

    return (
        <Card title="Pump Curve Data & Library">
            <div className="space-y-4 mb-4 border-b border-slate-200 pb-4">
                {/* Library Controls */}
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <Select
                            label="Load from Library"
                            options={pumpOptions}
                            value={selectedPumpId}
                            onChange={(e) => handleLoadPump(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="primary"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                        onClick={handleAutoSelect}
                        disabled={isAutoSelecting}
                        icon={isAutoSelecting ? <Sparkles className="animate-spin" size={16} /> : <Search size={16} />}
                        title="Busca Avançada com Inteligência Artificial [PREMIUM]"
                    >
                        Auto Select
                    </Button>
                    {selectedPumpId && (
                        <Button
                            variant="primary"
                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                            onClick={handleDeletePump}
                            icon={<Trash2 size={16} />}
                        >
                            Delete
                        </Button>
                    )}
                </div>

                {/* AI Results Dropdown */}
                {aiResults.length > 0 && (
                    <div className="mt-2 bg-white border border-indigo-200 rounded-lg shadow-lg p-3 w-full animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-1"><Sparkles size={14}/> Top Recommendations</h4>
                        <div className="flex flex-col gap-2">
                            {aiResults.map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-indigo-50/50 p-2 rounded border border-indigo-100 hover:bg-indigo-100 transition-colors">
                                    <div>
                                        <div className="font-semibold text-sm text-slate-800">{p.manufacturer} {p.model}</div>
                                        <div className="text-xs text-slate-500">Operates at {p.flow_op.toFixed(1)} m³/h @ {p.head_op.toFixed(1)} m (Eff: {p.efficiency_op.toFixed(1)}%)</div>
                                    </div>
                                    <Button size="sm" onClick={() => applyAiPump(p)} className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs px-3">
                                        Apply
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Metadata Inputs */}
                <div className="flex flex-col sm:flex-row gap-2 items-end w-full">
                    <div className="grid grid-cols-2 gap-2 w-full sm:flex-1">
                        <Input
                            label="Manufacturer"
                            value={manufacturer}
                            onChange={(e) => setPumpDetails(e.target.value, model)}
                            placeholder="e.g. KSB"
                        />
                        <Input
                            label="Model"
                            value={model}
                            onChange={(e) => setPumpDetails(manufacturer, e.target.value)}
                            placeholder="e.g. MegaCPK 50-200"
                        />
                    </div>
                    <Button
                        onClick={handleSavePump}
                        icon={<Save size={16} />}
                        className="w-full sm:w-auto mb-[2px]"
                        title="Save current curve to Library"
                    >
                        Save
                    </Button>
                </div>
                
                {/* Premium Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full mt-4 bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-md border border-amber-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 sm:mb-0 sm:col-span-3">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-200 px-2 py-0.5 rounded tracking-wide">PREMIUM</span>
                        <span className="text-sm font-medium text-amber-900">Advanced Hydraulics</span>
                    </div>
                    <Input
                        label="Base Speed (RPM)"
                        type="number"
                        value={pump_base_rpm || ''}
                        onChange={(e) => setPumpBaseRpm(Number(e.target.value))}
                    />
                    <Input
                        label="Operating Speed (VFD)"
                        type="number"
                        value={pump_current_rpm || ''}
                        onChange={(e) => setPumpCurrentRpm(Number(e.target.value))}
                    />
                    <Input
                        label="Pumps in Parallel"
                        type="number"
                        min="1"
                        value={parallel_pumps || ''}
                        onChange={(e) => setParallelPumps(Math.max(1, Number(e.target.value)))}
                    />
                </div>
            </div>

            <div className="mb-4 text-sm text-slate-500">
                Enter at least 3 points to define the pump curve.
            </div>

            {points.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border-dashed border-2 border-slate-200">
                    <p className="text-slate-400 mb-2">No curve data defined.</p>
                    <Button size="sm" onClick={addPoint} icon={<Plus size={14} />}>
                        Add First Point
                    </Button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead>
                            <tr>
                                <th className="px-1 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[70px] sm:min-w-[80px]">Flow <span className="hidden sm:inline">(m³/h)</span></th>
                                <th className="px-1 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[70px] sm:min-w-[80px]">Head <span className="hidden sm:inline">(m)</span></th>
                                <th className="px-1 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[60px] sm:min-w-[70px]">Eff <span className="hidden sm:inline">(%)</span></th>
                                <th className="px-1 sm:px-3 py-2 text-left text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[60px] sm:min-w-[70px]">NPSHr <span className="hidden sm:inline">(m)</span></th>
                                <th className="px-1 sm:px-3 py-2 w-8 sm:w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {points.map((point, index) => (
                                <tr key={index}>
                                    <td className="px-1 sm:px-3 py-1 sm:py-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={point.flow ?? ''}
                                            onChange={(e) => updatePoint(index, 'flow', e.target.value === '' ? '' as any : Math.max(0, parseFloat(e.target.value)))}
                                            className="h-8 text-[11px] sm:text-sm px-1 sm:px-3"
                                        />
                                    </td>
                                    <td className="px-1 sm:px-3 py-1 sm:py-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={point.head ?? ''}
                                            onChange={(e) => updatePoint(index, 'head', e.target.value === '' ? '' as any : Math.max(0, parseFloat(e.target.value)))}
                                            className="h-8 text-[11px] sm:text-sm px-1 sm:px-3"
                                        />
                                    </td>
                                    <td className="px-1 sm:px-3 py-1 sm:py-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={point.efficiency ?? ''}
                                            onChange={(e) => updatePoint(index, 'efficiency', e.target.value === '' ? '' as any : Math.min(100, Math.max(0, parseFloat(e.target.value))))}
                                            className="h-8 text-[11px] sm:text-sm px-1 sm:px-3"
                                        />
                                    </td>
                                    <td className="px-1 sm:px-3 py-1 sm:py-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={point.npshr ?? ''}
                                            onChange={(e) => updatePoint(index, 'npshr', e.target.value === '' ? '' as any : Math.max(0, parseFloat(e.target.value)))}
                                            className="h-8 text-[11px] sm:text-sm px-1 sm:px-3"
                                            placeholder="Opt"
                                        />
                                    </td>
                                    <td className="px-1 sm:px-3 py-1 sm:py-2 text-center">
                                        <button onClick={() => removePoint(index)} className="text-slate-400 hover:text-red-500">
                                            <Trash2 size={16} className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-4">
                        <Button size="sm" variant="secondary" onClick={addPoint} icon={<Plus size={14} className="w-full" />}>
                            Add Point
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
};
