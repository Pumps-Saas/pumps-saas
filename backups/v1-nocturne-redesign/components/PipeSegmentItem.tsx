import React, { useState } from 'react';
import { Trash2, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { PipeSection, PipeFitting } from '@/types/engineering';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FittingsManager } from './FittingsManager';
import { useReferenceStore } from '../stores/useReferenceStore';

interface PipeSegmentItemProps {
    segment: PipeSection;
    onUpdate: (id: string, updates: Partial<PipeSection>) => void;
    onRemove: (id: string) => void;
    compact?: boolean;
}

export const PipeSegmentItem: React.FC<PipeSegmentItemProps> = ({ segment, onUpdate, onRemove, compact = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { materials, diameters } = useReferenceStore();

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

    const handleChange = (field: keyof PipeSection, value: any) => {
        onUpdate(segment.id, { [field]: value });
    };

    const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const roughness = parseFloat(e.target.value);
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
        <div className="card border border-[var(--color-divider)] p-4 mb-3.5 bg-[var(--color-bg)]/40 hover:border-white/20 transition-all border-l-4 border-l-[#9184d9]">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center items-stretch gap-3 mb-3.5">
                <div className="flex-1">
                    <input
                        type="text"
                        value={segment.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Nome do Trecho (Ex: Sucção Principal)"
                        className="input font-bold text-sm bg-transparent border-[var(--color-divider)]"
                    />
                </div>
                <div className="flex space-x-2 items-center justify-end sm:justify-start">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs flex items-center text-[#9184d9] bg-[#9184d9]/15 border border-[#9184d9]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#9184d9]/25 transition-colors font-medium"
                    >
                        <Settings2 size={13} className="mr-1.5" />
                        {isExpanded ? 'Ocultar Valvulação' : `Acessórios (${(segment.fittings || []).length}) / Perdas Fixas`}
                        {isExpanded ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                    </button>
                    <button onClick={() => onRemove(segment.id)} className="text-muted hover:text-[#e06b6b] p-1.5 transition-colors" title="Remover Trecho">
                        <Trash2 size={17} />
                    </button>
                </div>
            </div>

            <div className={`grid gap-3.5 ${compact ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
                <Input
                    label="Comprimento (m)"
                    type="number"
                    min="0"
                    value={segment.length_m}
                    onChange={(e) => handleChange('length_m', Math.max(0, parseFloat(e.target.value) || 0))}
                />
                <Select
                    label="Diâmetro Nominal"
                    options={diameterOptions.length > 0 ? diameterOptions : [{ label: "Carregando...", value: 0 }]}
                    value={segment.diameter_mm}
                    onChange={(e) => handleChange('diameter_mm', parseFloat(e.target.value))}
                />
                <Select
                    label="Material da Tubulação"
                    options={materialOptions.length > 0 ? materialOptions : [{ label: "Carregando...", value: 0 }]}
                    value={segment.roughness_mm}
                    onChange={handleMaterialChange}
                />
                <Input
                    label="Rugosidade (mm)"
                    type="number"
                    min="0"
                    step="0.001"
                    value={segment.roughness_mm}
                    onChange={(e) => handleChange('roughness_mm', Math.max(0, parseFloat(e.target.value) || 0))}
                />
            </div>

            {isExpanded && (
                <div className="mt-5 pt-4 border-t border-[var(--color-divider)] flex flex-col gap-4 animate-in fade-in duration-200">

                    {/* Equipment Loss */}
                    <div className="bg-[var(--color-surface)] p-3.5 rounded-lg border border-[var(--color-divider)]">
                        <h4 className="text-[11px] font-bold text-[#e0a94b] uppercase tracking-wider mb-2.5">
                            Perdas de Carga Concentradas Fixas no Trecho
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Perda Fixa / Equipamento (mca)"
                                type="number"
                                min="0"
                                value={segment.equipment_loss_m}
                                onChange={(e) => handleChange('equipment_loss_m', Math.max(0, parseFloat(e.target.value) || 0))}
                                helperText="Perda de carga em trocadores de calor, filtros ou medidores instalados no trecho."
                            />
                        </div>
                    </div>

                    {/* Fittings Manager */}
                    <div className="bg-[var(--color-surface)] p-3.5 rounded-lg border border-[var(--color-divider)]">
                        <h4 className="text-[11px] font-bold text-[#9184d9] uppercase tracking-wider mb-2.5 flex items-center">
                            <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                            Catálogo de Acessórios & Valvulação (Fator K)
                        </h4>
                        <FittingsManager
                            fittings={segment.fittings || []}
                            onAdd={handleAddFitting}
                            onRemove={handleRemoveFitting}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
