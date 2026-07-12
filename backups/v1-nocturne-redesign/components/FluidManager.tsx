import React, { useState, useEffect } from 'react';
import { Trash2, Save, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

import { useSystemStore } from '../stores/useSystemStore';
import { useReferenceStore } from '../stores/useReferenceStore';
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
            applyFluid(custom.name, custom.density, custom.viscosity, custom.vapor_pressure);
        }
    };

    const applyFluid = (name: string, r: number, n: number, p: number) => {
        setFluid({ name, rho: r, nu: n, pv_kpa: p });
        setCustomName(name);
        setRho(r);
        setNu(n);
        setPv(p);
    };

    const handleSaveCustom = async () => {
        if (!customName || rho <= 0 || nu < 0) {
            addToast("Please provide valid fluid properties.", "error");
            return;
        }

        try {
            const payload = {
                name: customName,
                density: rho,
                viscosity: nu,
                vapor_pressure: pv
            };
            const res = await api.fluids.create(payload);
            setCustomFluids([...customFluids, res.data]);
            applyFluid(res.data.name, res.data.density, res.data.viscosity, res.data.vapor_pressure);
            setIsCustom(false);
            addToast("Fluido customizado salvo com sucesso!", "success");
        } catch (error) {
            console.error("Failed to save custom fluid", error);
            addToast("Erro ao salvar fluido customizado.", "error");
        }
    };

    const handleDeleteCustom = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this custom fluid?")) return;
        try {
            await api.fluids.delete(id);
            setCustomFluids(customFluids.filter(f => f.id !== id));
            addToast("Custom fluid deleted.", "info");
            // Reset to Water if deleted was active
            if (standardFluids["Water (20°C)"]) {
                const w = standardFluids["Water (20°C)"];
                applyFluid("Water (20°C)", w.rho, w.nu, w.pv_kpa);
            }
        } catch (error) {
            console.error("Failed to delete custom fluid", error);
            addToast("Failed to delete custom fluid.", "error");
        }
    };

    // Prepare options list
    const standardOptions = Object.keys(standardFluids).map(key => ({
        label: `${key} (ρ: ${standardFluids[key].rho})`,
        value: key
    }));

    const customOptions = customFluids.map(f => ({
        label: `* ${f.name} (ρ: ${f.density})`,
        value: f.id.toString()
    }));

    const allOptions = [
        ...standardOptions,
        ...(customOptions.length > 0 ? [{ label: "--- Custom Fluids ---", value: "", disabled: true }] : []),
        ...customOptions
    ];

    const activeCustomId = customFluids.find(f => f.name === currentFluid.name)?.id?.toString();
    const activeValue = standardFluids[currentFluid.name] ? currentFluid.name : (activeCustomId || "");

    return (
        <div className="flex flex-col gap-3.5 text-[var(--color-text)]">
            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <Select
                        label="Selecionar Fluido da Biblioteca"
                        options={[{ label: "Selecione o fluido...", value: "" }, ...allOptions]}
                        value={activeValue}
                        onChange={handleDoSelection}
                        disabled={isCustom}
                    />
                </div>
                <div>
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={() => setIsCustom(!isCustom)}
                        className={isCustom ? "border-[#e06b6b]/40 text-[#e06b6b]" : "border-[#9184d9]/40 text-[#9184d9]"}
                        icon={isCustom ? <X size={15} /> : <Plus size={15} />}
                    >
                        {isCustom ? "Cancelar" : "Customizado"}
                    </Button>
                </div>
            </div>

            {/* Display Current or Edit Custom */}
            <div className="grid grid-cols-2 gap-3 bg-[var(--color-bg)]/60 p-3.5 rounded-lg border border-[var(--color-divider)]">
                {isCustom ? (
                    <>
                        <div className="col-span-2">
                            <Input label="Nome do Fluido" value={customName} onChange={e => setCustomName(e.target.value)} />
                        </div>
                        <Input label="Massa Específica ρ (kg/m³)" type="number" min="0.001" step="0.1" value={rho} onChange={e => setRho(parseFloat(e.target.value))} />
                        <Input label="Viscosidade Cinemática ν (m²/s)" type="number" min="0" step="1e-7" value={nu} onChange={e => setNu(parseFloat(e.target.value))} />
                        <Input label="Pressão de Vapor Pv (kPa abs)" type="number" min="0" step="0.01" value={pv} onChange={e => setPv(parseFloat(e.target.value))} />
                        <div className="col-span-2 pt-2">
                            <Button size="md" onClick={handleSaveCustom} className="w-full bg-[#5fd08a] text-[#161826] hover:bg-[#4ebe78] font-bold" icon={<Save size={16} />}>
                                Salvar na Biblioteca Customizada
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="col-span-2 flex justify-between items-center border-b border-[var(--color-divider)] pb-2 mb-1">
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#5fd08a]"></span>
                                {currentFluid.name}
                            </div>
                            {activeCustomId && (
                                <button
                                    onClick={(e) => handleDeleteCustom(parseInt(activeCustomId), e)}
                                    className="text-muted hover:text-[#e06b6b] p-1 transition-colors"
                                    title="Excluir da Biblioteca Customizada"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">Massa Específica (ρ)</span>
                            <span className="font-mono text-sm text-white font-semibold">{currentFluid.rho} kg/m³</span>
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">Viscosidade (ν)</span>
                            <span className="font-mono text-sm text-white font-semibold">{currentFluid.nu.toExponential(2)} m²/s</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">Pressão de Vapor Absoluta (Pv)</span>
                            <span className="font-mono text-sm text-white font-semibold">{currentFluid.pv_kpa} kPa</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
