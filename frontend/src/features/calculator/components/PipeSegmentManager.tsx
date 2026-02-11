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
        emptyMessage: string
    ) => (
        <div className="space-y-4">
            {sections.length === 0 && (
                <div className="text-center py-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 text-sm">
                    {emptyMessage}
                </div>
            )}
            {sections.map(section => (
                <PipeSegmentItem
                    key={section.id}
                    segment={section}
                    onUpdate={onUpdate}
                    onRemove={onRemove}
                />
            ))}
        </div>
    );

    if (type === 'suction') {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-slate-800">Suction Side</h3>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addSuction(createDefaultSection(`Suction ${suctionSections.length + 1}`))}
                        icon={<Plus size={16} />}
                    >
                        Add Section
                    </Button>
                </div>
                {renderSections(suctionSections, updateSuction, removeSuction, "No suction sections defined.")}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Discharge Before Junction */}
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-slate-800">Discharge (Main Line)</h3>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addDischargeBefore(createDefaultSection(`Main ${dischargeBefore.length + 1}`))}
                        icon={<Plus size={16} />}
                    >
                        Add Section
                    </Button>
                </div>
                {renderSections(dischargeBefore, updateDischargeBefore, removeDischargeBefore, "No main discharge sections defined.")}
            </div>

            {/* Parallel Branches */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <GitBranch className="text-blue-600" />
                        <h3 className="text-lg font-medium text-slate-800">Parallel Branches</h3>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => addParallelBranch(`Branch ${Object.keys(dischargeParallel).length + 1}`)}
                        icon={<Plus size={16} />}
                    >
                        Add Branch
                    </Button>
                </div>

                {Object.keys(dischargeParallel).length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-sm">
                        No parallel branches. Flow is single-path.
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(dischargeParallel).map(([branchName, sections]) => (
                        <div key={branchName} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                                <h4 className="font-semibold text-slate-700">{branchName}</h4>
                                <div className="flex gap-2">
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        onClick={() => addSectionToBranch(branchName, createDefaultSection(`${branchName} - Sec ${sections.length + 1}`))}
                                        title="Add Section to Branch"
                                    >
                                        <Plus size={14} />
                                    </Button>
                                    <button
                                        onClick={() => removeParallelBranch(branchName)}
                                        className="text-slate-400 hover:text-red-500 p-1"
                                        title="Remove Branch"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            {renderSections(
                                sections,
                                (id, s) => updateSectionInBranch(branchName, id, s),
                                (id) => removeSectionFromBranch(branchName, id),
                                "Empty branch."
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Discharge After Junction */}
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-slate-800">Discharge (Final Line)</h3>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addDischargeAfter(createDefaultSection(`Final ${dischargeAfter.length + 1}`))}
                        icon={<Plus size={16} />}
                    >
                        Add Section
                    </Button>
                </div>
                {renderSections(dischargeAfter, updateDischargeAfter, removeDischargeAfter, "No final discharge sections defined.")}
            </div>
        </div>
    );
};
