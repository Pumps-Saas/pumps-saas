import React from 'react';
import { Plus, Trash2, Save, FolderOpen } from 'lucide-react';
import { useSystemStore } from '../stores/useSystemStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PumpCurvePoint } from '@/types/engineering';

export const PumpCurveEditor: React.FC = () => {
    const points = useSystemStore(state => state.pump_curve);
    const setPoints = useSystemStore(state => state.setPumpCurve);

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

    return (
        <Card title="Pump Curve Data"
            action={
                <div className="flex space-x-2">
                    <Button size="sm" variant="outline" icon={<FolderOpen size={14} />}>Load</Button>
                    <Button size="sm" variant="outline" icon={<Save size={14} />}>Save</Button>
                </div>
            }
        >
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
                                <th className="px-3 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {points.map((point, index) => (
                                <tr key={index}>
                                    <td className="px-3 py-2">
                                        <Input
                                            type="number"
                                            value={point.flow}
                                            onChange={(e) => updatePoint(index, 'flow', parseFloat(e.target.value) || 0)}
                                            className="h-8 text-sm"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <Input
                                            type="number"
                                            value={point.head}
                                            onChange={(e) => updatePoint(index, 'head', parseFloat(e.target.value) || 0)}
                                            className="h-8 text-sm"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <Input
                                            type="number"
                                            value={point.efficiency}
                                            onChange={(e) => updatePoint(index, 'efficiency', parseFloat(e.target.value) || 0)}
                                            className="h-8 text-sm"
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
