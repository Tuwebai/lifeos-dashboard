import React, { useState, useMemo, useEffect } from 'react';
import { WorkProject } from '../types';
import { UserProfile } from '../components/UserProfile';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const getPriorityColor = (p: string) => {
    if (p === 'high') return 'text-red-500 bg-red-50 dark:bg-red-900/20';
    if (p === 'medium') return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
    return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
};

const ProjectCard: React.FC<{
    project: WorkProject;
    onDelete: (id: string) => void;
    onMoveStatus: (id: string, newStatus: WorkProject['status']) => void;
}> = ({ project, onDelete, onMoveStatus }) => {
    const renderActionButtons = () => {
        switch (project.status) {
            case 'quote':
                return (
                    <div className="flex justify-end w-full">
                        <button onClick={() => onMoveStatus(project.id, 'pending')} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-full transition-all active:scale-95">Aceptar<span className="material-icons-round text-sm">arrow_forward</span></button>
                    </div>
                );
            case 'pending':
                return (
                    <div className="flex justify-between w-full items-center">
                        <button onClick={() => onMoveStatus(project.id, 'quote')} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all"><span className="material-icons-round text-sm">undo</span></button>
                        <button onClick={() => onMoveStatus(project.id, 'completed')} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-full transition-all active:scale-95">Completar<span className="material-icons-round text-sm">done_all</span></button>
                    </div>
                );
            case 'completed':
                return (
                    <div className="flex justify-between w-full items-center">
                        <button onClick={() => onMoveStatus(project.id, 'pending')} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><span className="material-icons-round text-sm">settings_backup_restore</span></button>
                        <div className="text-emerald-500 font-bold text-xs uppercase tracking-widest flex items-center gap-1"><span className="material-icons-round text-sm">verified</span>Terminado</div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-glow transition-all group animate-enter">
            <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${getPriorityColor(project.priority)}`}>{project.priority}</span>
                <button onClick={() => onDelete(project.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><span className="material-icons-round text-sm">delete</span></button>
            </div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-1">{project.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{project.client}</p>
            <div className="pt-4 border-t border-slate-50 dark:border-slate-700/50 flex flex-col gap-4">
                <div className="flex flex-col"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Valor</span><span className="text-lg font-black text-slate-700 dark:text-slate-200">${project.amount.toLocaleString()}</span></div>
                {renderActionButtons()}
            </div>
        </div>
    );
};

// Initial Work Cleared
const initialWork: WorkProject[] = [];

export const Work: React.FC = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<WorkProject[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [newTitle, setNewTitle] = useState('');
    const [newClient, setNewClient] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newPriority, setNewPriority] = useState<WorkProject['priority']>('medium');

    useEffect(() => {
        if (user) {
            fetchProjects();
        }
    }, [user]);

    const fetchProjects = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('work_projects')
            .select('*')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setProjects(data as WorkProject[]);
        }
        setLoading(false);
    };

    const stats = useMemo(() => {
        const quoteTotal = projects.filter(p => p.status === 'quote').reduce((sum, p) => sum + Number(p.amount), 0);
        const activeTotal = projects.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0);
        const completedTotal = projects.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0);
        return { quoteTotal, activeTotal, completedTotal };
    }, [projects]);

    const moveStatus = async (id: string, newStatus: WorkProject['status']) => {
        const { error } = await supabase
            .from('work_projects')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            setProjects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
        }
    };

    const deleteProject = async (id: string) => {
        const { error } = await supabase
            .from('work_projects')
            .delete()
            .eq('id', id);

        if (!error) {
            setProjects(prev => prev.filter(p => p.id !== id));
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newClient.trim() || !user) return;

        const { data, error } = await supabase
            .from('work_projects')
            .insert([{
                user_id: user.id,
                title: newTitle,
                client: newClient,
                amount: Number(newAmount) || 0,
                priority: newPriority,
                status: 'quote'
            }])
            .select();

        if (!error && data) {
            setProjects([data[0] as WorkProject, ...projects]);
            setNewTitle('');
            setNewClient('');
            setNewAmount('');
            setNewPriority('medium');
            setIsModalOpen(false);
        }
    };

    return (
        <main className="flex-1 flex flex-col gap-6 h-full overflow-y-auto lg:overflow-hidden px-4 md:px-6 pt-20 md:pt-4 pb-20 md:pb-4 relative scroll-smooth">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 pl-12 md:pl-0 animate-enter relative z-30">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Flujo de Trabajo</h2>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-1">Controla tus proyectos desde la cotización hasta el cobro.</p>
                </div>
                <div className="flex items-center gap-3 self-end md:self-auto">
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-xl shadow-glow transition-all active:scale-95"><span className="material-icons-round text-sm">add_business</span><span className="hidden sm:inline font-bold">Nuevo Proyecto</span></button>
                    <UserProfile />
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-enter shrink-0" style={{ animationDelay: '0.1s' }}>
                <div className="bg-card-light dark:bg-card-dark p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center gap-4 group">
                    <div className="p-3 bg-blue-100 text-blue-500 rounded-2xl"><span className="material-icons-round">request_quote</span></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Cotizaciones</p><h4 className="text-2xl font-black text-slate-800 dark:text-white">${stats.quoteTotal.toLocaleString()}</h4></div>
                </div>
                <div className="bg-card-light dark:bg-card-dark p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center gap-4 group">
                    <div className="p-3 bg-orange-100 text-orange-500 rounded-2xl"><span className="material-icons-round">engineering</span></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">En Proceso</p><h4 className="text-2xl font-black text-slate-800 dark:text-white">${stats.activeTotal.toLocaleString()}</h4></div>
                </div>
                <div className="bg-card-light dark:bg-card-dark p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center gap-4 group">
                    <div className="p-3 bg-emerald-100 text-emerald-500 rounded-2xl"><span className="material-icons-round">payments</span></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Facturado</p><h4 className="text-2xl font-black text-slate-800 dark:text-white">${stats.completedTotal.toLocaleString()}</h4></div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-y-visible lg:overflow-hidden pb-10">
                {['quote', 'pending', 'completed'].map(status => (
                    <div key={status} className="flex-1 flex flex-col min-w-full lg:min-w-[300px] h-auto lg:h-full">
                        <div className="flex items-center justify-between mb-4 px-2 py-2 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-20">
                            <h3 className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase text-xs tracking-widest">
                                <span className={`w-2.5 h-2.5 rounded-full ${status === 'quote' ? 'bg-blue-400' : status === 'pending' ? 'bg-orange-400' : 'bg-emerald-400'}`}></span>
                                {status === 'quote' ? 'Cotizaciones' : status === 'pending' ? 'En Proceso' : 'Terminados'}
                            </h3>
                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-xs font-bold">{projects.filter(p => p.status === status).length}</span>
                        </div>
                        <div className="flex flex-col lg:flex-1 lg:overflow-y-auto space-y-4 custom-scrollbar">
                            {projects.filter(p => p.status === status).map(p => (
                                <ProjectCard key={p.id} project={p} onDelete={deleteProject} onMoveStatus={moveStatus} />
                            ))}
                            {projects.filter(p => p.status === status).length === 0 && (
                                <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl opacity-20 text-xs font-medium">Vacío</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-400/10 dark:bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-premium overflow-hidden animate-in zoom-in-95 duration-200 border border-white dark:border-white/10 p-8">
                        <header className="flex justify-between items-center mb-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Nuevo Flujo</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white">Crear Proyecto</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center transition-colors">
                                <span className="material-icons-round text-slate-400">close</span>
                            </button>
                        </header>

                        <form onSubmit={handleCreateProject} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Título del Proyecto</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="Nombre del trabajo..."
                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-800 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-primary transition-all shadow-inner"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Nombre del Cliente</label>
                                <div className="relative">
                                    <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">person</span>
                                    <input
                                        type="text"
                                        value={newClient}
                                        onChange={(e) => setNewClient(e.target.value)}
                                        placeholder="Empresa o Persona..."
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-800 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-primary transition-all text-sm shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Valor ($)</label>
                                    <input
                                        type="number"
                                        value={newAmount}
                                        onChange={(e) => setNewAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-800 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-primary transition-all shadow-inner"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Prioridad</label>
                                    <select
                                        value={newPriority}
                                        onChange={(e) => setNewPriority(e.target.value as any)}
                                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-800 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-primary transition-all shadow-inner appearance-none cursor-pointer"
                                    >
                                        <option value="low">Baja</option>
                                        <option value="medium">Media</option>
                                        <option value="high">Alta</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-glow active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                                >
                                    Guardar Cotización
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
};
