import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useSystemStore } from '../calculator/stores/useSystemStore';
import { useToast } from '../../components/ui/Toast';
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
    const { addToast } = useToast();

    // Store actions
    const loadState = useSystemStore((state) => state.loadState);
    const calculateOperatingPoint = useSystemStore((state) => state.calculateOperatingPoint);
    const setActiveView = useSystemStore((state) => state.setActiveView);

    // We don't need a manually tracked systemState hook anymore. 
    // We will use useSystemStore.getState() on save.

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
            addToast("Projeto criado com sucesso!", 'success');
        } catch (error: any) {
            console.error("Failed to create project", error);
            addToast(`Falha ao criar projeto: ${error.response?.data?.detail || error.message}`, 'error');
        }
    };

    const handleCreateScenario = async () => {
        if (!selectedProject || !newScenarioName) return;

        try {
            const fullState = useSystemStore.getState();
            // Clone the state to strip functions and unnecessary UI state
            const stateToSave = JSON.parse(JSON.stringify(fullState));
            delete stateToSave.activeView;
            delete stateToSave.uiLanguage;
            delete stateToSave.uiTheme;
            delete stateToSave.operatingPoint;
            delete stateToSave.isCalculating;
            delete stateToSave.calculationError;

            await api.projects.addScenario(selectedProject.id, {
                name: newScenarioName,
                data: stateToSave
            });
            setNewScenarioName('');
            loadScenarios(selectedProject.id);
            addToast("Cenário salvo com sucesso!", 'success');
        } catch (error: any) {
            console.error("Failed to save scenario", error);
            addToast(`Falha ao salvar cenário: ${error.response?.data?.detail || error.message}`, 'error');
        }
    };

    const handleLoadScenario = (scenario: Scenario) => {
        if (scenario.data && Object.keys(scenario.data).length > 0) {
            loadState(scenario.data);
            setTimeout(() => {
                calculateOperatingPoint();
                setActiveView('calc');
            }, 100);
            addToast(`Cenário carregado: ${scenario.name}`, 'info');
        }
    };

    const handleDeleteProject = async (id: number) => {
        if (!window.confirm("Tem certeza que deseja excluir este projeto?")) return;
        try {
            await api.projects.delete(id);
            if (selectedProject?.id === id) setSelectedProject(null);
            loadProjects();
            addToast("Projeto excluído.", 'info');
        } catch (error) {
            console.error("Failed to delete project", error);
            addToast("Falha ao excluir projeto", 'error');
        }
    };

    const handleDeleteScenario = async (id: number) => {
        if (!window.confirm("Tem certeza que deseja excluir este cenário?")) return;
        try {
            await api.projects.deleteScenario(id);
            if (selectedProject) loadScenarios(selectedProject.id);
            addToast("Cenário excluído.", 'info');
        } catch (error) {
            console.error("Failed to delete scenario", error);
            addToast("Falha ao excluir cenário", 'error');
        }
    };

    return (
        <div className="card border border-[var(--color-divider)] p-5 flex flex-col gap-5 text-[var(--color-text)]">
            <div className="flex items-center justify-between border-b border-[var(--color-divider)] pb-3">
                <h2 className="text-lg font-bold flex items-center text-white gap-2.5">
                    <Folder className="text-[#9184d9]" size={20} /> Gerenciador de Projetos e Variações
                </h2>
                <span className="tag tag-outline">Hub de Projetos</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lista de Projetos */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Projetos Ativos</h3>
                    <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto">
                        {projects.length === 0 ? (
                            <div className="text-xs text-muted italic py-3">Nenhum projeto cadastrado ainda.</div>
                        ) : (
                            projects.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedProject(p)}
                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                                        selectedProject?.id === p.id 
                                            ? 'bg-[#9184d9]/15 text-[#9184d9] border-[#9184d9]/40 font-semibold' 
                                            : 'bg-[var(--color-bg)]/50 border-[var(--color-divider)] hover:border-white/30 text-white'
                                    }`}
                                >
                                    <div className="flex items-center min-w-0 gap-2.5">
                                        <Folder size={16} className={`shrink-0 ${selectedProject?.id === p.id ? 'text-[#9184d9]' : 'text-muted'}`} />
                                        <span className="truncate text-sm">{p.name}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProject(p.id); }} 
                                        className="text-muted hover:text-[#e06b6b] p-1 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex gap-2 mt-1">
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Nome do Novo Projeto..."
                            className="input text-xs"
                        />
                        <button onClick={handleCreateProject} className="btn btn-primary px-3 text-xs shrink-0" title="Criar Projeto">
                            <Plus size={16} /> Criar
                        </button>
                    </div>
                </div>

                {/* Lista de Cenários / Variações */}
                <div className="flex flex-col gap-3 border-t lg:border-t-0 lg:border-l border-[var(--color-divider)] pt-4 lg:pt-0 lg:pl-6">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
                        {selectedProject ? `Cenários em ${selectedProject.name}` : 'Selecione um projeto para ver cenários'}
                    </h3>
                    {selectedProject ? (
                        <>
                            <div className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto">
                                {scenarios.length === 0 ? (
                                    <div className="text-xs text-muted italic py-3">Nenhum cenário salvo neste projeto.</div>
                                ) : (
                                    scenarios.map(s => (
                                        <div
                                            key={s.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg)]/50 border border-[var(--color-divider)] hover:border-white/30 group transition-all"
                                        >
                                            <div className="flex items-center min-w-0 gap-2.5">
                                                <FileText size={16} className="shrink-0 text-muted group-hover:text-white" />
                                                <span className="truncate text-sm font-medium text-white">{s.name}</span>
                                            </div>
                                            <div className="flex gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => handleLoadScenario(s)}
                                                    className="btn btn-primary py-1 px-2.5 text-xs gap-1"
                                                    title="Carregar Cenário no Dimensionador"
                                                >
                                                    <Play size={12} /> Carregar
                                                </button>
                                                <button
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteScenario(s.id); }}
                                                    className="text-muted hover:text-[#e06b6b] p-1 transition-colors"
                                                    title="Excluir Cenário"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="flex gap-2 mt-1">
                                <input
                                    type="text"
                                    value={newScenarioName}
                                    onChange={(e) => setNewScenarioName(e.target.value)}
                                    placeholder="Nome da Variação (Ex: Vazão Máxima + VFD)..."
                                    className="input text-xs"
                                />
                                <button onClick={handleCreateScenario} className="btn btn-secondary px-3 text-xs shrink-0 text-[#5fd08a] border-[#5fd08a]/40 hover:bg-[#5fd08a]/10" title="Salvar Estado Atual no Projeto">
                                    <Save size={16} /> Salvar
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center border border-dashed border-[var(--color-divider)] rounded-lg p-6 text-center text-muted text-xs">
                            Selecione um projeto na coluna à esquerda para visualizar e gerenciar variações e cenários salvos.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
