import React from 'react';
import { Plus, Trash2, GitBranch } from 'lucide-react';
import { useSystemStore } from '../stores/useSystemStore';
import { PipeSegmentItem } from './PipeSegmentItem';
import { Button } from '@/components/ui/Button';
import { PipeSection } from '@/types/engineering';

interface PipeSegmentManagerProps {
    type: 'suction' | 'discharge';
}

export const PipeSegmentManager: React.FC<PipeSegmentManagerProps> = ({ type }) => {
    // Selectors
    const suctionSections = useSystemStore(state => state.suction_sections);
    const dischargeBefore = useSystemStore(state => state.discharge_sections_before);
    const dischargeParallel = useSystemStore(state => state.discharge_parallel_sections);
    const dischargeAfter = useSystemStore(state => state.discharge_sections_after);

    // Actions
    const addSuction = useSystemStore(state => state.addSuctionSection);
    const updateSuction = useSystemStore(state => state.updateSuctionSection);
    const removeSuction = useSystemStore(state => state.removeSuctionSection);

    const addDischargeBefore = useSystemStore(state => state.addDischargeSectionBefore);
    const updateDischargeBefore = useSystemStore(state => state.updateDischargeSectionBefore);
    const removeDischargeBefore = useSystemStore(state => state.removeDischargeSectionBefore);

    const addParallelBranch = useSystemStore(state => state.addParallelBranch);
    const removeParallelBranch = useSystemStore(state => state.removeParallelBranch);
    const addSectionToBranch = useSystemStore(state => state.addSectionToBranch);
    const updateSectionInBranch = useSystemStore(state => state.updateSectionInBranch);
    const removeSectionFromBranch = useSystemStore(state => state.removeSectionFromBranch);

    const addDischargeAfter = useSystemStore(state => state.addDischargeSectionAfter);
    const updateDischargeAfter = useSystemStore(state => state.updateDischargeSectionAfter);
    const removeDischargeAfter = useSystemStore(state => state.removeDischargeSectionAfter);

    const createDefaultSection = (namePrefix: string): Omit<PipeSection, 'id'> => ({
        name: `${namePrefix}`,
        length_m: 10,
        diameter_mm: 102.3, // 4"
        material: "Steel (New)",
        roughness_mm: 0.045, // Steel
        fittings: [],
        equipment_loss_m: 0
    });

    const renderSections = (
        sections: PipeSection[],
        onUpdate: (id: string, s: Partial<PipeSection>) => void,
        onRemove: (id: string) => void,
        emptyMessage: string,
        compact: boolean = false
    ) => (
        <div className="flex flex-col gap-3">
            {sections.length === 0 && (
                <div className="text-center py-5 bg-[var(--color-bg)]/40 rounded-lg border border-dashed border-[var(--color-divider)] text-muted text-xs italic">
                    {emptyMessage}
                </div>
            )}
            {sections.map(section => (
                <PipeSegmentItem
                    key={section.id}
                    segment={section}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                    compact={compact}
                />
            ))}
        </div>
    );

    if (type === 'suction') {
        return (
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#e0a94b]"></span>
                        Tubulação de Sucção (Aspiração da Bomba)
                    </h3>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => addSuction(createDefaultSection(`Sucção ${suctionSections.length + 1}`))}
                        icon={<Plus size={14} />}
                        className="text-[#5fd08a] border-[#5fd08a]/30 hover:bg-[#5fd08a]/10"
                    >
                        Adicionar Trecho
                    </Button>
                </div>
                {renderSections(suctionSections, updateSuction, removeSuction, "Nenhum trecho de sucção cadastrado. Clique no botão acima para inserir a tubulação.")}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Discharge Before Junction */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#9184d9]"></span>
                        Recalque Principal (Antes da Bifurcação/Paralelo)
                    </h3>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => addDischargeBefore(createDefaultSection(`Recalque Inicial ${dischargeBefore.length + 1}`))}
                        icon={<Plus size={14} />}
                        className="text-[#5fd08a] border-[#5fd08a]/30 hover:bg-[#5fd08a]/10"
                    >
                        Adicionar Trecho
                    </Button>
                </div>
                {renderSections(dischargeBefore, updateDischargeBefore, removeDischargeBefore, "Nenhum trecho inicial de recalque cadastrado.")}
            </div>

            {/* Parallel Branches */}
            <div className="bg-[var(--color-bg)]/40 p-4 rounded-xl border border-[var(--color-divider)]">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <GitBranch className="text-[#9184d9] w-4 h-4" />
                        <span>Bifurcações e Ramais em Paralelo</span>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => addParallelBranch(`Ramal ${Object.keys(dischargeParallel).length + 1}`)}
                        icon={<Plus size={14} />}
                        className="bg-[#9184d9] text-white hover:bg-[#796cbf]"
                    >
                        Criar Ramal Paralelo
                    </Button>
                </div>

                {Object.keys(dischargeParallel).length === 0 && (
                    <div className="text-center py-4 text-muted text-xs italic">
                        Nenhum ramal em paralelo configurado. O escoamento segue em linha única principal.
                    </div>
                )}

                <div className="grid grid-cols-1 gap-5 mt-3">
                    {Object.entries(dischargeParallel).map(([branchName, sections]) => (
                        <div key={branchName} className="card border border-[var(--color-divider)] p-4 bg-[var(--color-surface)] shadow-md">
                            <div className="flex justify-between items-center mb-3.5 pb-2.5 border-b border-[var(--color-divider)]">
                                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                    <GitBranch className="w-3.5 h-3.5 text-[#5fd08a]" />
                                    {branchName}
                                </h4>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 px-2.5 text-xs text-[#5fd08a] border-[#5fd08a]/30 hover:bg-[#5fd08a]/10"
                                        onClick={() => addSectionToBranch(branchName, createDefaultSection(`${branchName} - Trecho ${sections.length + 1}`))}
                                        title="Adicionar Trecho a Este Ramal"
                                    >
                                        <Plus size={13} className="mr-1" /> Trecho
                                    </Button>
                                    <button
                                        onClick={() => removeParallelBranch(branchName)}
                                        className="text-muted hover:text-[#e06b6b] p-1 transition-colors"
                                        title="Excluir Ramal Paralelo"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            {renderSections(
                                sections,
                                (id, s) => updateSectionInBranch(branchName, id, s),
                                (id) => removeSectionFromBranch(branchName, id),
                                "Ramal paralelo vazio. Adicione um trecho no botão acima.",
                                false
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Discharge After Junction */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#5fd08a]"></span>
                        Recalque Final (Após Junção / Linha de Entrega)
                    </h3>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => addDischargeAfter(createDefaultSection(`Recalque Final ${dischargeAfter.length + 1}`))}
                        icon={<Plus size={14} />}
                        className="text-[#5fd08a] border-[#5fd08a]/30 hover:bg-[#5fd08a]/10"
                    >
                        Adicionar Trecho
                    </Button>
                </div>
                {renderSections(dischargeAfter, updateDischargeAfter, removeDischargeAfter, "Nenhum trecho de entrega final cadastrado.")}
            </div>
        </div>
    );
};
