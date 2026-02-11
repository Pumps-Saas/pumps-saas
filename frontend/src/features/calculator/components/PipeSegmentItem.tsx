import React, { useState } from 'react';
import { Trash2, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { PipeSection, PipeFitting } from '@/types/engineering';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FittingsManager } from './FittingsManager';
import { useReferenceStore } from '../stores/useReferenceStore';

interface PipeSegmentItemProps {
    segment: PipeSection;
    onUpdate: (id: string, updates: Partial<PipeSection>) => void;
    onRemove: (id: string) => void;
}

export const PipeSegmentItem: React.FC<PipeSegmentItemProps> = ({ segment, onUpdate, onRemove }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { materials, diameters } = useReferenceStore();

    // Convert reference objects to options
    const materialOptions = Object.entries(materials).map(([name, roughness]) => ({
        label: name,
        value: roughness
    }));

    const diameterOptions = Object.entries(diameters)
        .sort((a, b) => a[1] - b[1])
        .map(([name, d_mm]) => ({
            label: `${name} (${d_mm}mm)`,
            value: d_mm
        }));

    // Handlers
    const handleChange = (field: keyof PipeSection, value: any) => {
        onUpdate(segment.id, { [field]: value });
    };

    const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const roughness = parseFloat(e.target.value);
        // We could also store the material name if desired
        onUpdate(segment.id, { roughness_mm: roughness, material: e.target.options[e.target.selectedIndex].text });
    };

    const handleAddFitting = (fitting: PipeFitting) => {
        const currentFittings = segment.fittings || [];
        onUpdate(segment.id, { fittings: [...currentFittings, fitting] });
    };

    const handleRemoveFitting = (index: number) => {
        const currentFittings = segment.fittings || [];
        const newFittings = [...currentFittings];
        newFittings.splice(index, 1);
        onUpdate(segment.id, { fittings: newFittings });
    };

    return (
        <Card className="mb-4 border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 mr-4">
                    <Input
                        value={segment.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Segment Name"
                        className="font-semibold text-lg border-slate-200"
                    />
                </div>
                <div className="flex space-x-2 items-center">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                    >
                        <Settings2 size={14} className="mr-1" />
                        {isExpanded ? 'Hide Advanced' : 'Fittings / Equipment'}
                        {isExpanded ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                    </button>
                    <button onClick={() => onRemove(segment.id)} className="text-slate-400 hover:text-red-500">
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                    label="Length (m)"
                    type="number"
                    value={segment.length_m}
                    onChange={(e) => handleChange('length_m', parseFloat(e.target.value) || 0)}
                />
                <Select
                    label="Diameter"
                    options={diameterOptions.length > 0 ? diameterOptions : [{ label: "Loading...", value: 0 }]}
                    value={segment.diameter_mm}
                    onChange={(e) => handleChange('diameter_mm', parseFloat(e.target.value))}
                />
                <Select
                    label="Material"
                    options={materialOptions.length > 0 ? materialOptions : [{ label: "Loading...", value: 0 }]}
                    value={segment.roughness_mm}
                    onChange={handleMaterialChange}
                />
                <Input
                    label="Roughness (mm)"
                    type="number"
                    step="0.001"
                    value={segment.roughness_mm}
                    onChange={(e) => handleChange('roughness_mm', parseFloat(e.target.value) || 0)}
                />
            </div>

            {isExpanded && (
                <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">

                    {/* Equipment Loss */}
                    <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Fixed Losses
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Equipment Head Loss (m)"
                                type="number"
                                value={segment.equipment_loss_m}
                                onChange={(e) => handleChange('equipment_loss_m', parseFloat(e.target.value) || 0)}
                                helperText="Losses from heat exchangers, filters, etc."
                            />
                        </div>
                    </div>

                    {/* Fittings Manager */}
                    <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                            <Settings2 className="w-3 h-3 mr-1" />
                            Fittings & Accessories
                        </h4>
                        <FittingsManager
                            fittings={segment.fittings || []}
                            onAdd={handleAddFitting}
                            onRemove={handleRemoveFitting}
                        />
                    </div>
                </div>
            )}
        </Card>
    );
};
