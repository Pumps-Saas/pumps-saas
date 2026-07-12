import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PipeFitting } from '@/types/engineering';
import { useReferenceStore } from '../stores/useReferenceStore';
import { useToast } from '@/components/ui/Toast';

interface FittingsManagerProps {
    fittings: PipeFitting[];
    onAdd: (fitting: PipeFitting) => void;
    onRemove: (index: number) => void;
}

export const FittingsManager: React.FC<FittingsManagerProps> = ({ fittings, onAdd, onRemove }) => {
    const { fittings: standardFittings } = useReferenceStore();
    const [selectedStandard, setSelectedStandard] = useState<string>("");
    const [customName, setCustomName] = useState("");
    const [customK, setCustomK] = useState<number>(0);
    const [quantity, setQuantity] = useState(1);
    const [isCustom, setIsCustom] = useState(false);

    const { addToast } = useToast();

    const handleAdd = () => {
        if (isCustom) {
            if (!customName) {
                addToast("Please enter a custom fitting name", 'warning');
                return;
            }
            if (customK <= 0) {
                addToast("K factor must be positive", 'warning');
                return;
            }
            onAdd({ name: customName, k: customK, quantity });
            setCustomName("");
            setCustomK(0);
        } else {
            if (!selectedStandard) {
                addToast("Please select a standard fitting", 'warning');
                return;
            }
            onAdd({
                name: selectedStandard,
                k: standardFittings[selectedStandard],
                quantity
            });
            setSelectedStandard("");
        }
        setQuantity(1);
    };

    const standardsOptions = Object.entries(standardFittings).map(([name, k]) => ({
        label: `${name} (K=${k})`,
        value: name
    }));

    return (
        <div className="flex flex-col gap-3.5 text-[var(--color-text)]">
            <div className="bg-[var(--color-bg)]/60 p-3.5 rounded-lg border border-[var(--color-divider)]">
                <h5 className="text-[11px] font-bold text-muted mb-2.5 uppercase tracking-wider">Adicionar Acessório / Valvulação</h5>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">

                    <div className="md:col-span-12 flex gap-2 mb-1">
                        <button
                            className={`text-xs px-2.5 py-1 rounded transition-colors ${!isCustom ? 'bg-[#9184d9]/20 text-[#9184d9] font-bold border border-[#9184d9]/40' : 'text-muted hover:text-white'}`}
                            onClick={() => setIsCustom(false)}
                        >
                            Normatizado (Biblioteca)
                        </button>
                        <button
                            className={`text-xs px-2.5 py-1 rounded transition-colors ${isCustom ? 'bg-[#9184d9]/20 text-[#9184d9] font-bold border border-[#9184d9]/40' : 'text-muted hover:text-white'}`}
                            onClick={() => setIsCustom(true)}
                        >
                            Customizado (Manual)
                        </button>
                    </div>

                    {!isCustom ? (
                        <div className="md:col-span-6">
                            <Select
                                label="Tipo de Acessório"
                                options={[{ label: "Selecione...", value: "" }, ...standardsOptions]}
                                value={selectedStandard}
                                onChange={(e) => setSelectedStandard(e.target.value)}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="md:col-span-4">
                                <Input
                                    label="Nome"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder="Válvula Esfera..."
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Input
                                    label="Fator K"
                                    type="number"
                                    value={customK}
                                    onChange={(e) => setCustomK(parseFloat(e.target.value))}
                                />
                            </div>
                        </>
                    )}

                    <div className="md:col-span-3">
                        <Input
                            label="Qtd"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                    </div>

                    <div className="md:col-span-3">
                        <Button
                            size="md"
                            onClick={handleAdd}
                            className="w-full bg-[#9184d9] text-white hover:bg-[#796cbf]"
                            disabled={!isCustom && !selectedStandard}
                            icon={<Plus size={14} />}
                        >
                            Adicionar
                        </Button>
                    </div>
                </div>
            </div>

            {/* List */}
            {fittings.length > 0 && (
                <div className="border border-[var(--color-divider)] rounded-lg overflow-hidden">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>K Unit.</th>
                                <th>Qtd</th>
                                <th className="text-white">Total K</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {fittings.map((f, idx) => (
                                <tr key={idx}>
                                    <td className="font-medium text-white">{f.name}</td>
                                    <td className="text-muted">{f.k}</td>
                                    <td>{f.quantity}</td>
                                    <td className="font-bold text-[#9184d9]">{(f.k * f.quantity).toFixed(2)}</td>
                                    <td className="text-right">
                                        <button onClick={() => onRemove(idx)} className="text-muted hover:text-[#e06b6b] p-1 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-[var(--color-bg)] font-bold">
                                <td colSpan={3} className="text-right text-muted py-2.5 px-3">Soma Total do Fator K:</td>
                                <td className="text-[#5fd08a] text-sm py-2.5 px-3">
                                    {fittings.reduce((acc, f) => acc + (f.k * f.quantity), 0).toFixed(2)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
};
