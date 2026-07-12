import React, { useMemo } from 'react';
import { useSystemStore } from './stores/useSystemStore';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Wrench, Zap, Calculator } from 'lucide-react';

export const EconomicDashboard: React.FC = () => {
    const result = useSystemStore(state => state.operatingPoint);
    const powerKw = result?.power_kw || 0;
    const efficiencyOp = result?.efficiency_op || 0;
    
    // Configurações do Store de Energia
    const energyCostPerKwh = useSystemStore(state => state.energy_cost_per_kwh);
    const hoursPerDay = useSystemStore(state => state.hours_per_day);
    const daysPerYear = useSystemStore(state => state.days_per_year);

    // Estados locais de CAPEX e Manutenção
    const pumpCost = useSystemStore(state => state.pump_cost);
    const installationCost = useSystemStore(state => state.installation_cost);
    const maintenanceRate = useSystemStore(state => state.maintenance_rate);
    const setEconomicConfig = useSystemStore(state => state.setEconomicConfig);

    // Cálculos Derivados
    const capex = pumpCost + installationCost;
    const annualEnergyCost = powerKw * hoursPerDay * daysPerYear * energyCostPerKwh;
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
            <div className="card border border-[var(--color-divider)] p-12 flex flex-col items-center justify-center text-center">
                <Calculator className="w-16 h-16 text-muted opacity-30 mb-4" />
                <h3 className="text-xl font-bold text-white">Análise Financeira Indisponível</h3>
                <p className="text-muted mt-2 max-w-md text-sm">
                    Calcule um Ponto de Operação no painel de Novo Cálculo antes de analisar projeções financeiras.
                </p>
            </div>
        );
    }

    return (
        <div id="pdf-economic-dashboard" className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Nocturne Banner */}
            <div className="bg-gradient-to-r from-[#262a60] to-[#353b80] rounded-xl p-6 border border-[#9184d9]/40 shadow-lg text-white flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2.5">
                        <DollarSign className="w-6 h-6 text-[#5fd08a]" />
                        Análise Econômica (LCC - Life Cycle Cost)
                    </h2>
                    <p className="text-[#a7a1db] text-xs mt-1">Projeção integrada de CAPEX (Aquisição e Instalação) + OPEX (Energia e Manutenção) ao longo de 10 anos.</p>
                </div>
                <div className="hidden sm:flex bg-[var(--color-bg)]/60 px-5 py-2.5 rounded-xl border border-[var(--color-divider)] items-center gap-3">
                    <div className="flex flex-col text-right">
                        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Custo Total Acumulado (10 Anos)</span>
                        <span className="text-2xl font-black text-[#5fd08a]">R$ {(capex + opex * 10).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Inputs e Resumo */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    {/* CAPEX Panel */}
                    <div className="card border border-[var(--color-divider)] p-5">
                        <h3 className="text-xs font-bold text-[#9184d9] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[var(--color-divider)] pb-2.5">
                            <Wrench className="w-4 h-4 text-[#9184d9]" /> Capital Expenditure (CAPEX)
                        </h3>
                        <div className="flex flex-col gap-3.5">
                            <div className="field">
                                <label>Custo da Bomba (R$)</label>
                                <input type="number" value={pumpCost} onChange={e => setEconomicConfig('pump_cost', Number(e.target.value))} className="input" />
                            </div>
                            <div className="field">
                                <label>Tubulação / Instalação (R$)</label>
                                <input type="number" value={installationCost} onChange={e => setEconomicConfig('installation_cost', Number(e.target.value))} className="input" />
                            </div>
                        </div>
                        <div className="mt-6 pt-3.5 border-t border-[var(--color-divider)] flex justify-between items-end">
                            <span className="text-xs font-medium text-muted">Total CAPEX</span>
                            <span className="text-lg font-bold text-white">R$ {capex.toLocaleString('pt-BR')}</span>
                        </div>
                    </div>

                    {/* OPEX Panel */}
                    <div className="card border border-[var(--color-divider)] p-5">
                        <h3 className="text-xs font-bold text-[#5fd08a] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[var(--color-divider)] pb-2.5">
                            <Zap className="w-4 h-4 text-[#5fd08a]" /> Operational Expenditure (OPEX)
                        </h3>
                        <div className="flex flex-col gap-3.5">
                            <div className="grid grid-cols-2 gap-3 bg-[var(--color-bg)]/60 p-3 rounded-lg border border-[var(--color-divider)]">
                                <div>
                                    <span className="text-[11px] text-muted block">Potência Absorvida</span>
                                    <span className="font-bold text-white text-sm">{powerKw.toFixed(2)} kW</span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-muted block">Eficiência Operacional</span>
                                    <span className="font-bold text-white text-sm">{efficiencyOp.toFixed(1)} %</span>
                                </div>
                            </div>
                            
                            <div className="field">
                                <label>Taxa de Manutenção Anual (% do CAPEX)</label>
                                <input type="number" step="0.1" value={maintenanceRate} onChange={e => setEconomicConfig('maintenance_rate', Number(e.target.value))} className="input" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-1">
                                <div>
                                    <span className="text-[11px] text-muted block">Custo Energia (Ano)</span>
                                    <span className="font-semibold text-[#5fd08a] text-sm">R$ {annualEnergyCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-muted block">Custo Manut. (Ano)</span>
                                    <span className="font-semibold text-[#e0a94b] text-sm">R$ {annualMaintenanceCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-3.5 border-t border-[var(--color-divider)] flex justify-between items-end">
                            <span className="text-xs font-medium text-muted">Total OPEX / Ano</span>
                            <span className="text-lg font-bold text-[#5fd08a]">R$ {opex.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>

                {/* Gráfico */}
                <div className="lg:col-span-8 card border border-[var(--color-divider)] p-6 flex flex-col">
                    <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#9184d9]" />
                        Projeção de Custos Acumulados (10 Anos)
                    </h3>
                    <p className="text-xs text-muted mb-6">Visualização do custo total acumulado de propriedade ao longo do tempo (LCC).</p>
                    
                    <div className="flex-1 min-h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCostNocturne" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#9184d9" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#9184d9" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(233, 233, 237, 0.1)" />
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#9397ab', fontSize: 12}} dy={10} />
                                <YAxis 
                                    tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#9397ab', fontSize: 12}} 
                                    dx={-10}
                                />
                                <Tooltip 
                                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'Custo Acumulado']}
                                    contentStyle={{ backgroundColor: '#232532', borderRadius: '8px', border: '1px solid rgba(233, 233, 237, 0.16)', color: '#e9e9ed' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="Custo Acumulado (R$)" 
                                    stroke="#9184d9" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorCostNocturne)" 
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#b5abfc' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
