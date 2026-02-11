import React, { useState, useEffect } from 'react';
import { Droplets, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Fluid } from '@/types/engineering';
import { useSystemStore } from '../stores/useSystemStore';
import { useReferenceStore } from '../stores/useReferenceStore';
import { Card } from '@/components/ui/Card';

export const FluidManager: React.FC = () => {
    const currentFluid = useSystemStore(state => state.fluid);
    const setFluid = useSystemStore(state => state.setFluid);

    // Reference Data
    const { fluids: standardFluids, fetchStandards } = useReferenceStore();

    const [isCustom, setIsCustom] = useState(false);
    const [selectedStandard, setSelectedStandard] = useState("");

    // Custom state
    const [customName, setCustomName] = useState(currentFluid.name);
    const [rho, setRho] = useState(currentFluid.rho);
    const [nu, setNu] = useState(currentFluid.nu);
    const [pv, setPv] = useState(currentFluid.pv_kpa);

    useEffect(() => {
        fetchStandards();
    }, [fetchStandards]);

    // Handle Standard Selection
    const handleStandardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const name = e.target.value;
        setSelectedStandard(name);

        if (name && standardFluids[name]) {
            const data = standardFluids[name];
            const newFluid: Fluid = {
                name: name,
                rho: data.rho,
                nu: data.nu,
                pv_kpa: data.pv_kpa
            };
            setFluid(newFluid);
            // Sync custom fields for viewing
            setCustomName(name);
            setRho(data.rho);
            setNu(data.nu);
            setPv(data.pv_kpa);
            setIsCustom(false);
        }
    };

    // Handle Custom Update
    const applyCustom = () => {
        setFluid({
            name: customName || "Custom Fluid",
            rho,
            nu,
            pv_kpa: pv
        });
        setIsCustom(false);
    };

    const fluidOptions = Object.keys(standardFluids).map(key => ({ label: key, value: key }));

    return (
        <Card title="Fluid Properties" className="h-full">
            <div className="space-y-4">
                <div className="flex gap-2">
                    <Select
                        label="Standard Fluid"
                        options={[{ label: "Select...", value: "" }, ...fluidOptions]}
                        value={selectedStandard}
                        onChange={handleStandardChange}
                        disabled={isCustom}
                    />
                    <div className="flex items-end pb-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsCustom(!isCustom)}
                            className={isCustom ? "bg-blue-50 border-blue-200 text-blue-700" : ""}
                        >
                            {isCustom ? "Cancel" : "Custom"}
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
                            <Input label="Density (kg/m³)" type="number" value={rho} onChange={e => setRho(parseFloat(e.target.value))} />
                            <Input label="Viscosity (m²/s)" type="number" step="1e-7" value={nu} onChange={e => setNu(parseFloat(e.target.value))} />
                            <Input label="Vapor Press. (kPa)" type="number" step="0.01" value={pv} onChange={e => setPv(parseFloat(e.target.value))} />
                            <div className="col-span-2 pt-2">
                                <Button size="sm" onClick={applyCustom} className="w-full">Apply Custom Fluid</Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="col-span-2 font-semibold text-slate-700 border-b border-slate-200 pb-1 mb-1">
                                {currentFluid.name}
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
