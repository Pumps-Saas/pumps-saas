import React, { useState, useEffect } from 'react';
import { Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

import { useSystemStore } from '../stores/useSystemStore';
import { useReferenceStore } from '../stores/useReferenceStore';
import { Card } from '@/components/ui/Card';
import { api } from '@/api/client';
import { useToast } from '@/components/ui/Toast';

export const FluidManager: React.FC = () => {
    const currentFluid = useSystemStore(state => state.fluid);
    const setFluid = useSystemStore(state => state.setFluid);
    const { addToast } = useToast();

    // Reference Data
    const { fluids: standardFluids, fetchStandards } = useReferenceStore();

    const [isCustom, setIsCustom] = useState(false);
    const [, setSelectedStandard] = useState("");
    const [customFluids, setCustomFluids] = useState<any[]>([]);

    // Custom state
    const [customName, setCustomName] = useState(currentFluid.name);
    const [rho, setRho] = useState(currentFluid.rho);
    const [nu, setNu] = useState(currentFluid.nu);
    const [pv, setPv] = useState(currentFluid.pv_kpa);

    useEffect(() => {
        fetchStandards();
        loadCustomFluids();
    }, [fetchStandards]);

    const loadCustomFluids = async () => {
        try {
            const res = await api.fluids.list();
            setCustomFluids(res.data);
        } catch (error) {
            console.error("Failed to load custom fluids", error);
        }
    };

    // Handle Selection (Standard or Custom)
    const handleDoSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedStandard(val);

        if (!val) return;

        // Check if Standard
        if (standardFluids[val]) {
            const data = standardFluids[val];
            applyFluid(val, data.rho, data.nu, data.pv_kpa);
            return;
        }

        // Check if Custom
        const custom = customFluids.find(f => f.id.toString() === val);
        if (custom) {
            applyFluid(custom.name, custom.properties.rho, custom.properties.nu, custom.properties.pv_kpa);
        }
    };

    const applyFluid = (name: string, r: number, n: number, p: number) => {
        setFluid({ name, rho: r, nu: n, pv_kpa: p });
        setCustomName(name);
        setRho(r);
        setNu(n);
        setPv(p);
        setIsCustom(false);
    };

    const handleSaveCustom = async () => {
        if (!customName) {
            addToast("Please enter a name", 'warning');
            return;
        }
        if (rho <= 0) {
            addToast("Density must be positive", 'warning');
            return;
        }
        if (nu < 0) {
            addToast("Viscosity cannot be negative", 'warning');
            return;
        }
        if (pv < 0) {
            addToast("Vapor pressure cannot be negative", 'warning');
            return;
        }

        try {
            await api.fluids.create({
                name: customName,
                properties: { rho, nu, pv_kpa: pv }
            });
            addToast("Custom Fluid Saved!", 'success');
            loadCustomFluids();
            setIsCustom(false);
        } catch (error: any) {
            console.error("Failed to save fluid", error);
            addToast(`Failed to save: ${error.response?.data?.detail || error.message}`, 'error');
        }
    };

    const handleDeleteCustom = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this custom fluid?")) return;
        try {
            await api.fluids.delete(id);
            loadCustomFluids();
            if (activeCustomId === id.toString()) setSelectedStandard(""); // Clear selection if deleted
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    // Prepare Options
    // Note: Select component handles simple options. For groups we might need native select or improve UI component.
    // For now, let's prefix custom fluids to differentiate.
    const allOptions = [
        { label: "--- Standard Fluids ---", value: "", disabled: true },
        ...Object.keys(standardFluids).map(key => ({ label: key, value: key })),
        { label: "--- My Custom Fluids ---", value: "", disabled: true },
        ...customFluids.map(f => ({ label: f.name, value: f.id.toString() }))
    ];

    const activeCustomId = customFluids.find(f => f.name === currentFluid.name && f.properties.rho === currentFluid.rho)?.id.toString();
    const activeValue = standardFluids[currentFluid.name] ? currentFluid.name : (activeCustomId || "");

    return (
        <Card title="Fluid Properties" className="h-full">
            <div className="space-y-4">
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Select
                            label="Select Fluid"
                            options={[{ label: "Select...", value: "" }, ...allOptions]}
                            value={activeValue}
                            onChange={handleDoSelection}
                            disabled={isCustom}
                        />
                    </div>
                    <div className="flex items-end pb-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsCustom(!isCustom)}
                            className={isCustom ? "bg-blue-50 border-blue-200 text-blue-700" : ""}
                        >
                            {isCustom ? "Cancel" : "New"}
                        </Button>
                    </div>
                </div>

                {/* Display Current or Edit Custom */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-md border border-slate-100">
                    {isCustom ? (
                        <>
                            <div className="col-span-2">
                                <Input label="Name" value={customName} onChange={e => setCustomName(e.target.value)} />
                            </div>
                            <Input label="Density (kg/m³)" type="number" min="0.001" step="0.1" value={rho} onChange={e => setRho(parseFloat(e.target.value))} />
                            <Input label="Viscosity (m²/s)" type="number" min="0" step="1e-7" value={nu} onChange={e => setNu(parseFloat(e.target.value))} />
                            <Input label="Vapor Press. (kPa)" type="number" min="0" step="0.01" value={pv} onChange={e => setPv(parseFloat(e.target.value))} />
                            <div className="col-span-2 pt-2">
                                <Button size="sm" onClick={handleSaveCustom} className="w-full" icon={<Save size={16} />}>
                                    Save to Library
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="col-span-2 flex justify-between items-start border-b border-slate-200 pb-1 mb-1">
                                <div className="font-semibold text-slate-700">{currentFluid.name}</div>
                                {activeCustomId && (
                                    <button
                                        onClick={(e) => handleDeleteCustom(parseInt(activeCustomId), e)}
                                        className="text-gray-400 hover:text-red-500"
                                        title="Delete from Library"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Density</span>
                                <span className="font-mono text-sm">{currentFluid.rho} kg/m³</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">Viscosity</span>
                                <span className="font-mono text-sm">{currentFluid.nu.toExponential(2)} m²/s</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-xs text-slate-500 block">Vapor Pressure (Abs)</span>
                                <span className="font-mono text-sm">{currentFluid.pv_kpa} kPa</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
};
