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
        <div className="space-y-4">
            <div className="bg-white p-3 rounded-md border border-slate-200">
                <h5 className="text-xs font-semibold text-slate-500 mb-2 uppercase">Add New Fitting</h5>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">

                    <div className="md:col-span-12 flex gap-2 mb-2">
                        <button
                            className={`text-xs px-2 py-1 rounded ${!isCustom ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}
                            onClick={() => setIsCustom(false)}
                        >
                            Standard
                        </button>
                        <button
                            className={`text-xs px-2 py-1 rounded ${isCustom ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}
                            onClick={() => setIsCustom(true)}
                        >
                            Custom
                        </button>
                    </div>

                    {!isCustom ? (
                        <div className="md:col-span-6">
                            <Select
                                label="Type"
                                options={[{ label: "Select...", value: "" }, ...standardsOptions]}
                                value={selectedStandard}
                                onChange={(e) => setSelectedStandard(e.target.value)}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="md:col-span-4">
                                <Input
                                    label="Name"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder="Valve X"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Input
                                    label="K Factor"
                                    type="number"
                                    value={customK}
                                    onChange={(e) => setCustomK(parseFloat(e.target.value))}
                                />
                            </div>
                        </>
                    )}

                    <div className="md:col-span-3">
                        <Input
                            label="Qty"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                    </div>

                    <div className="md:col-span-3">
                        <Button
                            size="sm"
                            onClick={handleAdd}
                            className="w-full"
                            disabled={!isCustom && !selectedStandard}
                            icon={<Plus size={14} />}
                        >
                            Add
                        </Button>
                    </div>
                </div>
            </div>

            {/* List */}
            {fittings.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full text-xs text-left">
                        <thead className="bg-slate-50 font-medium text-slate-500">
                            <tr>
                                <th className="px-3 py-2">Item</th>
                                <th className="px-3 py-2">K</th>
                                <th className="px-3 py-2">Qty</th>
                                <th className="px-3 py-2">Total K</th>
                                <th className="px-3 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {fittings.map((f, idx) => (
                                <tr key={idx}>
                                    <td className="px-3 py-2 font-medium">{f.name}</td>
                                    <td className="px-3 py-2 text-slate-500">{f.k}</td>
                                    <td className="px-3 py-2">{f.quantity}</td>
                                    <td className="px-3 py-2 font-bold text-slate-700">{(f.k * f.quantity).toFixed(2)}</td>
                                    <td className="px-3 py-2 text-right">
                                        <button onClick={() => onRemove(idx)} className="text-slate-400 hover:text-red-500">
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-semibold text-slate-700">
                            <tr>
                                <td colSpan={3} className="px-3 py-2 text-right">Total K:</td>
                                <td className="px-3 py-2 text-blue-600">
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
