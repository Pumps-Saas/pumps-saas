import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Database, Droplet, Loader2 } from 'lucide-react';

export const AdminResources: React.FC = () => {
    const [resources, setResources] = useState<{ pumps: any[], fluids: any[] }>({ pumps: [], fluids: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const response = await apiClient.get('/admin/resources');
            setResources(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>;
    }

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-800">Global Engineering Resources</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pumps Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-indigo-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-indigo-900 flex items-center">
                            <Database className="h-5 w-5 mr-2 text-indigo-600" />
                            Global Pump Library
                        </h3>
                        <span className="bg-indigo-200 text-indigo-800 py-1 px-3 rounded-full text-xs font-bold">
                            {resources.pumps.length} Curves
                        </span>
                    </div>
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-white sticky top-0 border-b border-slate-200 shadow-sm z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Manufacturer / Model</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Created By (Owner)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {resources.pumps.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-8 text-center text-slate-500">No pumps registered yet.</td>
                                    </tr>
                                ) : resources.pumps.map((pump, idx) => (
                                    <tr key={idx} className="hover:bg-indigo-50/30">
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-semibold text-slate-800">{pump.manufacturer}</div>
                                            <div className="text-xs text-slate-500">{pump.model}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 truncate max-w-[200px]">
                                            {pump.owner_email}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Fluids Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-cyan-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-cyan-900 flex items-center">
                            <Droplet className="h-5 w-5 mr-2 text-cyan-600" />
                            Custom Fluids Library
                        </h3>
                        <span className="bg-cyan-200 text-cyan-800 py-1 px-3 rounded-full text-xs font-bold">
                            {resources.fluids.length} Fluids
                        </span>
                    </div>
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-white sticky top-0 border-b border-slate-200 shadow-sm z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fluid Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Created By (Owner)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {resources.fluids.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-8 text-center text-slate-500">No custom fluids registered yet.</td>
                                    </tr>
                                ) : resources.fluids.map((fluid, idx) => (
                                    <tr key={idx} className="hover:bg-cyan-50/30">
                                        <td className="px-4 py-3 text-sm font-bold text-slate-800">
                                            {fluid.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 truncate max-w-[200px]">
                                            {fluid.owner_email}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};
