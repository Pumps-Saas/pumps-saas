import React, { useState } from 'react';
import { Trash2, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { PipeSection, PipeFitting } from '@/types/engineering';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FittingsManager } from './FittingsManager';

interface PipeSegmentItemProps {
    segment: PipeSection;
    onUpdate: (id: string, updates: Partial<PipeSection>) => void;
    onRemove: (id: string) => void;
}

// Temporary static data - will move to a shared constant file later or fetching from store
const MATERIALS = [
    { label: 'Steel (New)', value: 0.045 },
    { label: 'Steel (Old)', value: 0.2 },
    { label: 'PVC', value: 0.0015 },
    { label: 'Concrete', value: 0.5 },
];

const STANDARD_DIAMETERS = [
    { label: '1" (26.6mm)', value: 26.6 },
    { label: '2" (52.5mm)', value: 52.5 },
    { label: '3" (77.9mm)', value: 77.9 },
    { label: '4" (102.3mm)', value: 102.3 },
    { label: '6" (154.1mm)', value: 154.1 },
    { label: '8" (202.7mm)', value: 202.7 },
    { label: '10" (254.5mm)', value: 254.5 },
];

export const PipeSegmentItem: React.FC<PipeSegmentItemProps> = ({ segment, onUpdate, onRemove }) => {
    const [isExpanded, setIsExpanded] = useState(false);

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
                <div className="flex space-x-2">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-400 hover:text-blue-600">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
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
                    options={STANDARD_DIAMETERS.map(d => ({ label: d.label, value: d.value }))}
                    value={segment.diameter_mm}
                    onChange={(e) => handleChange('diameter_mm', parseFloat(e.target.value))}
                />
                <Select
                    label="Material"
                    options={MATERIALS.map(m => ({ label: m.label, value: m.value }))}
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
