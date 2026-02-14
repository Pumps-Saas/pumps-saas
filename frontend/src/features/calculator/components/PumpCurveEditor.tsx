import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, FolderOpen, Database } from 'lucide-react';
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

    const { addToast } = useToast();

    // Persistence State
    const [savedPumps, setSavedPumps] = useState<any[]>([]);
    const [selectedPumpId, setSelectedPumpId] = useState("");

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

    const addPoint = () => {
        setPoints([...points, { flow: 0, head: 0, efficiency: 0 }]);
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

                {/* Metadata Inputs */}
                <div className="grid grid-cols-2 gap-2">
                    <Input
                        label="Manufacturer"
                        value={manufacturer}
                        onChange={(e) => setPumpDetails(e.target.value, model)}
                        placeholder="e.g. KSB"
                    />
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
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
                            className="mb-[2px]"
                            title="Save current curve to Library"
                        >
                            Save
                        </Button>
                    </div>
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
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Flow (m³/h)</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Head (m)</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Eff (%)</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">NPSHr (m)</th>
                                <th className="px-3 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {points.map((point, index) => (
                                <tr key={index}>
                                    <td className="px-3 py-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={point.flow}
                                            onChange={(e) => updatePoint(index, 'flow', Math.max(0, parseFloat(e.target.value) || 0))}
                                            className="h-8 text-sm"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={point.head}
                                            onChange={(e) => updatePoint(index, 'head', Math.max(0, parseFloat(e.target.value) || 0))}
                                            className="h-8 text-sm"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={point.efficiency}
                                            onChange={(e) => updatePoint(index, 'efficiency', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                            className="h-8 text-sm"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            value={point.npshr || ''}
                                            onChange={(e) => updatePoint(index, 'npshr', Math.max(0, parseFloat(e.target.value)))}
                                            className="h-8 text-sm"
                                            placeholder="Opt"
                                        />
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button onClick={() => removePoint(index)} className="text-slate-400 hover:text-red-500">
                                            <Trash2 size={16} />
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
