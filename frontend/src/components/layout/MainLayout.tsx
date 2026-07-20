import React, { useState } from 'react';
import {
    LayoutGrid,
    PlusCircle,
    BarChart2,
    Settings,
    DollarSign,
    FileText,
    HelpCircle,
    Shield,
    LogOut,
    Globe,
    Moon,
    Sun,
    User,
    ChevronRight,
    Activity,
    X,
    Check
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSystemStore } from '../../features/calculator/stores/useSystemStore';
import { SupportModal } from '../../features/support/SupportModal';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Store state & UI navigation
    const activeView = useSystemStore(state => state.activeView);
    const setActiveView = useSystemStore(state => state.setActiveView);
    const uiLanguage = useSystemStore(state => state.uiLanguage);
    const setUiLanguage = useSystemStore(state => state.setUiLanguage);
    const uiTheme = useSystemStore(state => state.uiTheme);
    const setUiTheme = useSystemStore(state => state.setUiTheme);

    // Modals & Menu State
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isProfileDlg, setIsProfileDlg] = useState(false);
    const [isSettingsDlg, setIsSettingsDlg] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);

    // Profile form state
    const [profileName, setProfileName] = useState(user?.email?.split('@')[0] || 'Engenheiro Principal');
    const [profileCompany, setProfileCompany] = useState('Pumps & Systems Corp.');
    const [profileRole, setProfileRole] = useState('Engenheiro de Aplicação');

    const navItems = [
        { id: 'hub', label: uiLanguage === 'pt' ? 'Painel' : 'Dashboard', icon: LayoutGrid },
        { id: 'calc', label: uiLanguage === 'pt' ? 'Novo cálculo' : 'New Calc', icon: PlusCircle },
        { id: 'results', label: uiLanguage === 'pt' ? 'Resultados' : 'Results', icon: BarChart2 },
        { id: 'pumps', label: uiLanguage === 'pt' ? 'Bombas' : 'Pumps', icon: Settings },
        { id: 'finance', label: uiLanguage === 'pt' ? 'Finanças' : 'Finance', icon: DollarSign },
        { id: 'report', label: uiLanguage === 'pt' ? 'Relatório' : 'Report', icon: FileText },
    ] as const;

    const getBreadcrumbTitle = () => {
        const item = navItems.find(n => n.id === activeView);
        return item ? item.label : (uiLanguage === 'pt' ? 'Dimensionamento' : 'Sizing');
    };

    const handleNewCalcClick = () => {
        setActiveView('calc');
    };

    const toggleTheme = (newTheme: 'dark' | 'light') => {
        setUiTheme(newTheme);
        if (newTheme === 'light') {
            document.documentElement.style.setProperty('--color-bg', '#f3f5fe');
            document.documentElement.style.setProperty('--color-surface', '#ffffff');
            document.documentElement.style.setProperty('--color-text', '#292b31');
            document.documentElement.style.setProperty('--color-text-rgb', '41, 43, 49');
            document.documentElement.style.setProperty('--color-divider', 'rgba(41, 43, 49, 0.16)');
            document.body.classList.add('light-mode');
        } else {
            document.documentElement.style.setProperty('--color-bg', '#161826');
            document.documentElement.style.setProperty('--color-surface', '#232532');
            document.documentElement.style.setProperty('--color-text', '#e9e9ed');
            document.documentElement.style.setProperty('--color-text-rgb', '233, 233, 237');
            document.documentElement.style.setProperty('--color-divider', 'rgba(233, 233, 237, 0.16)');
            document.body.classList.remove('light-mode');
        }
    };

    return (
        <div className="min-h-screen flex flex-row bg-[var(--color-bg)] text-[var(--color-text)] font-sans">
            {/* Sidebar fixa (224px) Nocturne */}
            <aside className="w-[224px] shrink-0 bg-gradient-to-b from-[#141726] to-[#0c0e18] border-r border-[var(--color-divider)] flex flex-col justify-between p-4 sticky top-0 h-screen z-40 select-none">
                <div>
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-2 mb-8 cursor-pointer" onClick={() => setActiveView('hub')}>
                        <div className="w-8 h-8 rounded-lg bg-[#9184d9]/20 border border-[#9184d9] flex items-center justify-center text-[#9184d9] shadow-sm">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-heading font-bold text-base tracking-tight text-white leading-tight">Bombeo</div>
                            <div className="text-[11px] text-[#9397ab] font-medium uppercase tracking-wider">Pump Sizing</div>
                        </div>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex flex-col gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveView(item.id as any)}
                                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                                        isActive
                                            ? 'bg-[#9184d9]/15 text-[#9184d9] border border-[#9184d9]/40 shadow-sm'
                                            : 'text-[#b2b6ca] hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#9184d9]' : 'text-[#75798c]'}`} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer da Sidebar */}
                <div className="flex flex-col gap-2 pt-4 border-t border-[var(--color-divider)]">
                    <button
                        onClick={() => setIsSupportOpen(true)}
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-[#b2b6ca] hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <HelpCircle className="w-4 h-4 text-[#9184d9]" />
                        <span>{uiLanguage === 'pt' ? 'Suporte Técnico' : 'Support'}</span>
                    </button>

                    {user?.role === 'admin' && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold text-[#9184d9] bg-[#9184d9]/10 hover:bg-[#9184d9]/20 transition-colors border border-[#9184d9]/30"
                        >
                            <Shield className="w-4 h-4 shrink-0" />
                            <span>Admin Panel</span>
                        </button>
                    )}

                    <div className="flex items-center justify-between px-3 py-1 mt-1">
                        <button
                            onClick={() => setUiLanguage(uiLanguage === 'pt' ? 'en' : 'pt')}
                            className="flex items-center gap-1.5 text-xs text-[#b2b6ca] hover:text-white transition-colors"
                            title="Mudar Idioma / Change Language"
                        >
                            <Globe className="w-3.5 h-3.5 text-[#9184d9]" />
                            <span className="font-semibold uppercase">{uiLanguage}</span>
                        </button>

                        <button
                            onClick={logout}
                            className="p-1.5 text-[#e06b6b] hover:bg-[#e06b6b]/15 rounded-md transition-colors"
                            title={uiLanguage === 'pt' ? 'Sair (Logout)' : 'Logout'}
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Área Principal */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar Nocturne */}
                <header className="h-14 bg-[var(--color-surface)] border-b border-[var(--color-divider)] px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                    {/* Breadcrumb à esquerda */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted font-medium">Bombeo</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted" />
                        <span className="font-semibold text-white tracking-tight">{getBreadcrumbTitle()}</span>
                    </div>

                    {/* À direita: tag unidades + CTA Novo cálculo + Avatar dropdown */}
                    <div className="flex items-center gap-4">
                        <span className="tag tag-neutral hidden sm:inline-flex border border-[var(--color-divider)]">
                            m³/h · mca · CV
                        </span>

                        <button
                            onClick={handleNewCalcClick}
                            className="btn btn-primary text-xs py-1.5 px-3"
                        >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>{uiLanguage === 'pt' ? 'Novo Cálculo' : 'New Calc'}</span>
                        </button>

                        {/* Avatar User */}
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="w-9 h-9 rounded-full bg-[#9184d9]/20 border border-[#9184d9] flex items-center justify-center text-sm font-bold text-[#9184d9] hover:ring-2 hover:ring-[#9184d9]/50 transition-all"
                            >
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </button>

                            {/* Dropdown Menu de Conta */}
                            {userMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-64 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl shadow-2xl p-3 z-50 flex flex-col gap-1 text-sm animate-in fade-in zoom-in-95 duration-150">
                                        <div className="p-2 border-b border-[var(--color-divider)] mb-1">
                                            <div className="font-semibold text-white truncate">{user?.email}</div>
                                            <div className="flex items-center justify-between mt-1.5">
                                                <span className="text-xs text-muted">Plano</span>
                                                <span className={`tag ${user?.subscription_status === 'ACTIVE' ? 'tag-accent' : 'tag-neutral'} text-[10px] py-0.5 px-2`}>
                                                    {user?.subscription_status || 'ACTIVE'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => { setUserMenuOpen(false); setIsProfileDlg(true); }}
                                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[#e9e9ed] hover:bg-white/5 transition-colors text-left w-full"
                                        >
                                            <User className="w-4 h-4 text-[#9184d9]" />
                                            <span>{uiLanguage === 'pt' ? 'Perfil' : 'Profile'}</span>
                                        </button>

                                        <button
                                            onClick={() => { setUserMenuOpen(false); setIsSettingsDlg(true); }}
                                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[#e9e9ed] hover:bg-white/5 transition-colors text-left w-full"
                                        >
                                            <Settings className="w-4 h-4 text-[#9184d9]" />
                                            <span>{uiLanguage === 'pt' ? 'Configurações Gerais' : 'General Settings'}</span>
                                        </button>

                                        <div className="border-t border-[var(--color-divider)] my-1" />

                                        <button
                                            onClick={logout}
                                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[#e06b6b] hover:bg-[#e06b6b]/15 transition-colors text-left w-full font-medium"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>{uiLanguage === 'pt' ? 'Sair' : 'Logout'}</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Viewport */}
                <main className="flex-1 min-w-0 p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
                    {children}
                </main>
            </div>

            {/* Diálogo de Perfil */}
            {isProfileDlg && (
                <div className="dialog-backdrop animate-in fade-in duration-200">
                    <div className="dialog">
                        <div className="flex items-center justify-between border-b border-[var(--color-divider)] pb-3">
                            <span className="dialog-title">{uiLanguage === 'pt' ? 'Perfil de Engenharia' : 'Engineering Profile'}</span>
                            <button onClick={() => setIsProfileDlg(false)} className="text-muted hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="dialog-body flex flex-col gap-4 py-2">
                            <div className="field">
                                <label>{uiLanguage === 'pt' ? 'Nome do Engenheiro' : 'Engineer Name'}</label>
                                <input className="input" value={profileName} onChange={e => setProfileName(e.target.value)} />
                            </div>
                            <div className="field">
                                <label>{uiLanguage === 'pt' ? 'Empresa / Planta' : 'Company / Plant'}</label>
                                <input className="input" value={profileCompany} onChange={e => setProfileCompany(e.target.value)} />
                            </div>
                            <div className="field">
                                <label>{uiLanguage === 'pt' ? 'Cargo' : 'Role'}</label>
                                <input className="input" value={profileRole} onChange={e => setProfileRole(e.target.value)} />
                            </div>
                        </div>
                        <div className="dialog-actions pt-2 border-t border-[var(--color-divider)]">
                            <button className="btn btn-secondary" onClick={() => setIsProfileDlg(false)}>{uiLanguage === 'pt' ? 'Cancelar' : 'Cancel'}</button>
                            <button className="btn btn-primary" onClick={() => setIsProfileDlg(false)}><Check className="w-4 h-4" /> {uiLanguage === 'pt' ? 'Salvar Perfil' : 'Save Profile'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Diálogo de Configurações Gerais */}
            {isSettingsDlg && (
                <div className="dialog-backdrop animate-in fade-in duration-200">
                    <div className="dialog">
                        <div className="flex items-center justify-between border-b border-[var(--color-divider)] pb-3">
                            <span className="dialog-title">{uiLanguage === 'pt' ? 'Configurações Gerais' : 'General Settings'}</span>
                            <button onClick={() => setIsSettingsDlg(false)} className="text-muted hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="dialog-body flex flex-col gap-5 py-2">
                            <div>
                                <label className="text-xs text-muted font-medium block mb-2">{uiLanguage === 'pt' ? 'Tema Visual' : 'Visual Theme'}</label>
                                <div className="seg">
                                    <label className="seg-opt">
                                        <input
                                            type="radio"
                                            name="ui-theme"
                                            checked={uiTheme === 'dark'}
                                            onChange={() => toggleTheme('dark')}
                                        />
                                        <Moon className="w-4 h-4" />
                                        <span>Nocturne (Escuro)</span>
                                    </label>
                                    <label className="seg-opt">
                                        <input
                                            type="radio"
                                            name="ui-theme"
                                            checked={uiTheme === 'light'}
                                            onChange={() => toggleTheme('light')}
                                        />
                                        <Sun className="w-4 h-4" />
                                        <span>Claro (Light)</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-muted font-medium block mb-2">{uiLanguage === 'pt' ? 'Idioma da Interface' : 'Interface Language'}</label>
                                <div className="seg">
                                    <label className="seg-opt">
                                        <input
                                            type="radio"
                                            name="ui-lang"
                                            checked={uiLanguage === 'pt'}
                                            onChange={() => setUiLanguage('pt')}
                                        />
                                        <span>Português (PT-BR)</span>
                                    </label>
                                    <label className="seg-opt">
                                        <input
                                            type="radio"
                                            name="ui-lang"
                                            checked={uiLanguage === 'en'}
                                            onChange={() => setUiLanguage('en')}
                                        />
                                        <span>English (EN)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="card border border-[var(--color-divider)] p-3 mt-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#9184d9]">Pumps SaaS PRO</span>
                                    <span className="tag tag-accent text-[10px]">ACTIVE</span>
                                </div>
                                <p className="text-xs text-muted mt-1 mb-0">Cálculo hidráulico ao vivo, simulações NPSH e análise econômica habilitados.</p>
                            </div>
                        </div>
                        <div className="dialog-actions pt-2 border-t border-[var(--color-divider)]">
                            <button className="btn btn-primary" onClick={() => setIsSettingsDlg(false)}>Fechar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Suporte Modal */}
            {isSupportOpen && <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />}
        </div>
    );
};

export default MainLayout;
