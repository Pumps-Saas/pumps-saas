import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSystemStore } from './stores/useSystemStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Activity, Wrench, Zap, Calculator } from 'lucide-react';

export const EconomicDashboard: React.FC = () => {
    const result = useSystemStore(state => state.operatingPoint);
    const powerKw = result?.power_kw || 0;
    const efficiencyOp = result?.efficiency_op || 0;
    
    // Configurações do Store de Energia
    const energyCostPerKwh = useSystemStore(state => state.energy_cost_per_kwh);
    const hoursPerDay = useSystemStore(state => state.hours_per_day);

    // Estados locais de CAPEX e Manutenção
    const [pumpCost, setPumpCost] = useState(15000);
    const [installationCost, setInstallationCost] = useState(5000);
    const [maintenanceRate, setMaintenanceRate] = useState(2); // % ao ano sobre o CAPEX

    // Cálculos Derivados
    const capex = pumpCost + installationCost;
    const annualEnergyCost = powerKw * hoursPerDay * 365 * energyCostPerKwh;
    const annualMaintenanceCost = capex * (maintenanceRate / 100);
    const opex = annualEnergyCost + annualMaintenanceCost;

    // Gerar dados para 10 anos
    const chartData = useMemo(() => {
        const data = [];
        let cumulative = capex;
        for (let year = 0; year <= 10; year++) {
            data.push({
                year: `Ano ${year}`,
                'Custo Acumulado (R$)': cumulative,
            });
            cumulative += opex;
        }
        return data;
    }, [capex, opex]);

    if (!result) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm">
                <Calculator className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-700">Análise Financeira Indisponível</h3>
                <p className="text-slate-500 mt-2 text-center max-w-md">
                    Calcule um Ponto de Operação na aba de Sistema Hidráulico antes de analisar os custos.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Premium Banner */}
            <div className="bg-gradient-to-r from-amber-600 to-yellow-500 rounded-xl p-6 shadow-md text-white flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <DollarSign className="w-6 h-6" />
                        Análise Econômica (LCC)
                    </h2>
                    <p className="text-amber-100 mt-1">Life Cycle Cost Analysis - Projeção de CAPEX e OPEX para 10 anos.</p>
                </div>
                <div className="hidden sm:flex bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/30 items-center gap-3">
                    <div className="flex flex-col text-right">
                        <span className="text-xs text-amber-100 uppercase tracking-wide">Custo Total (10 Anos)</span>
                        <span className="text-2xl font-black">R$ {(capex + opex * 10).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Inputs e Resumo */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    {/* CAPEX Panel */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Wrench className="w-4 h-4 text-sky-600" /> Capital Expenditure (CAPEX)
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500">Custo da Bomba (R$)</label>
                                <Input type="number" value={pumpCost} onChange={e => setPumpCost(Number(e.target.value))} className="mt-1" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500">Tubulação / Instalação (R$)</label>
                                <Input type="number" value={installationCost} onChange={e => setInstallationCost(Number(e.target.value))} className="mt-1" />
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-end">
                            <span className="text-sm font-medium text-slate-500">Total CAPEX</span>
                            <span className="text-xl font-bold text-slate-800">R$ {capex.toLocaleString('pt-BR')}</span>
                        </div>
                    </div>

                    {/* OPEX Panel */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Zap className="w-4 h-4 text-emerald-500" /> Operational Expenditure (OPEX)
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div>
                                    <span className="text-xs text-slate-500 block">Potência Absorvida</span>
                                    <span className="font-semibold text-slate-700">{powerKw.toFixed(2)} kW</span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 block">Eficiência Op.</span>
                                    <span className="font-semibold text-slate-700">{efficiencyOp.toFixed(1)} %</span>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-semibold text-slate-500">Taxa de Manutenção Anual (% CAPEX)</label>
                                <Input type="number" step="0.1" value={maintenanceRate} onChange={e => setMaintenanceRate(Number(e.target.value))} className="mt-1" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                    <span className="text-xs text-slate-500 block">Custo Energia (Ano)</span>
                                    <span className="font-semibold text-emerald-600">R$ {annualEnergyCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 block">Custo Manut. (Ano)</span>
                                    <span className="font-semibold text-amber-600">R$ {annualMaintenanceCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-end">
                            <span className="text-sm font-medium text-slate-500">Total OPEX / Ano</span>
                            <span className="text-xl font-bold text-emerald-700">R$ {opex.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>

                {/* Gráfico */}
                <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-sky-600" />
                        Projeção de Custos Acumulados (10 Anos)
                    </h3>
                    <p className="text-sm text-slate-500 mb-8">Visualização do custo total de propriedade ao longo do tempo (Life Cycle Cost).</p>
                    
                    <div className="flex-1 min-h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                <YAxis 
                                    tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#64748b', fontSize: 12}} 
                                    dx={-10}
                                />
                                <Tooltip 
                                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'Custo Acumulado']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="Custo Acumulado (R$)" 
                                    stroke="#d97706" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorCost)" 
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#b45309' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
