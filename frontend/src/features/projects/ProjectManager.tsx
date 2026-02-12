import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useSystemStore } from '../calculator/stores/useSystemStore';
import { Folder, FileText, Plus, Trash2, Save, Play } from 'lucide-react';

interface Project {
    id: number;
    name: string;
    description: string;
}

interface Scenario {
    id: number;
    name: string;
    project_id: number;
    data: any;
}

export const ProjectManager = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [scenarios, setScenarios] = useState<Scenario[]>([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [newScenarioName, setNewScenarioName] = useState('');

    // Store actions
    const loadState = useSystemStore((state) => state.loadState);
    const calculateOperatingPoint = useSystemStore((state) => state.calculateOperatingPoint); // Import calc action

    // Select all state components needed for saving
    const systemState = useSystemStore((state) => ({
        fluid: state.fluid,
        suction_sections: state.suction_sections,
        discharge_sections_before: state.discharge_sections_before,
        discharge_parallel_sections: state.discharge_parallel_sections,
        discharge_sections_after: state.discharge_sections_after,
        static_head: state.static_head,
        pump_curve: state.pump_curve,
        pressure_suction_bar_g: state.pressure_suction_bar_g,
        pressure_discharge_bar_g: state.pressure_discharge_bar_g,
        atmospheric_pressure_bar: state.atmospheric_pressure_bar,
        altitude_m: state.altitude_m,
    }));

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadScenarios(selectedProject.id);
        } else {
            setScenarios([]);
        }
    }, [selectedProject]);

    const loadProjects = async () => {
        try {
            const res = await api.projects.list();
            setProjects(res.data);
        } catch (error) {
            console.error("Failed to load projects", error);
        }
    };

    const loadScenarios = async (projectId: number) => {
        try {
            const res = await api.projects.get(projectId);
            setScenarios(res.data.scenarios);
        } catch (error) {
            console.error("Failed to load scenarios", error);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName) return;
        try {
            await api.projects.create({ name: newProjectName, description: '' });
            setNewProjectName('');
            loadProjects();
        } catch (error: any) {
            console.error("Failed to create project", error);
            alert(`Failed to create project: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleCreateScenario = async () => {
        if (!selectedProject || !newScenarioName) return;

        try {
            await api.projects.addScenario(selectedProject.id, {
                name: newScenarioName,
                data: systemState
            });
            setNewScenarioName('');
            loadScenarios(selectedProject.id);
        } catch (error: any) {
            console.error("Failed to save scenario", error);
            alert(`Failed to save scenario: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleLoadScenario = (scenario: Scenario) => {
        if (scenario.data && Object.keys(scenario.data).length > 0) {
            loadState(scenario.data);
            setTimeout(() => {
                calculateOperatingPoint(); // Trigger calculation
            }, 100);
        }
    };

    const handleDeleteProject = async (id: number) => {
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
            await api.projects.delete(id);
            if (selectedProject?.id === id) setSelectedProject(null);
            loadProjects();
        } catch (error) {
            console.error("Failed to delete project", error);
        }
    };

    const handleDeleteScenario = async (id: number) => {
        if (!confirm("Are you sure you want to delete this scenario?")) return;
        try {
            await api.projects.deleteScenario(id);
            if (selectedProject) loadScenarios(selectedProject.id);
        } catch (error) {
            console.error("Failed to delete scenario", error);
        }
    };

    return (
        <div className="bg-white p-4 shadow rounded-lg h-full flex flex-col">
            <h2 className="text-lg font-bold mb-4 flex items-center">
                <Folder className="mr-2" size={20} /> Project Manager
            </h2>

            {/* Project List */}
            <div className="mb-6 flex-1 overflow-y-auto">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Projects</h3>
                <div className="space-y-1">
                    {projects.map(p => (
                        <div
                            key={p.id}
                            onClick={() => setSelectedProject(p)}
                            className={`flex items-center justify-between p-2 rounded cursor-pointer ${selectedProject?.id === p.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center min-w-0">
                                <Folder size={16} className="mr-2 flex-shrink-0" />
                                <span className="truncate">{p.name}</span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }} className="text-gray-400 hover:text-red-500">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="mt-2 flex gap-2">
                    <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="New Project..."
                        className="flex-1 text-sm border rounded px-2 py-1"
                    />
                    <button onClick={handleCreateProject} className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            {/* Scenario List (Active Project) */}
            {selectedProject && (
                <div className="flex-1 overflow-y-auto border-t pt-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Scenarios in {selectedProject.name}
                    </h3>
                    <div className="space-y-1">
                        {scenarios.map(s => (
                            <div
                                key={s.id}
                                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 group"
                            >
                                <div className="flex items-center min-w-0">
                                    <FileText size={16} className="mr-2 flex-shrink-0 text-gray-400" />
                                    <span className="truncate text-sm">{s.name}</span>
                                </div>
                                <div className="hidden group-hover:flex gap-1">
                                    <button
                                        onClick={() => handleLoadScenario(s)}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded flex items-center"
                                        title="Load Scenario"
                                    >
                                        <Play size={12} className="mr-1" /> Load
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteScenario(s.id); }}
                                        className="text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-0.5 rounded flex items-center"
                                        title="Delete Scenario"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                        <input
                            type="text"
                            value={newScenarioName}
                            onChange={(e) => setNewScenarioName(e.target.value)}
                            placeholder="Current State Name..."
                            className="flex-1 text-sm border rounded px-2 py-1"
                        />
                        <button onClick={handleCreateScenario} className="p-1 bg-green-600 text-white rounded hover:bg-green-700" title="Save Current State">
                            <Save size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
