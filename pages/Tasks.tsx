import React, { useState, useEffect } from 'react';
import { UserProfile } from '../components/UserProfile';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

// --- Types ---
type Priority = 'low' | 'medium' | 'high';

interface Task {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    priority: Priority;
    date: string;
    tag: string;
}

// --- Initial Data Cleared ---
const initialTasks: Task[] = [];

export const Tasks: React.FC = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // New Task Form State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
    const [newTaskTag, setNewTaskTag] = useState('');

    useEffect(() => {
        if (user) {
            fetchTasks();
        }
    }, [user]);

    const fetchTasks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            const formattedTasks = data.map(t => ({
                id: t.id,
                title: t.title,
                completed: t.completed,
                priority: t.priority as Priority,
                date: t.date || 'Hoy',
                tag: t.tag || 'General'
            }));
            setTasks(formattedTasks);
        }
        setLoading(false);
    };

    const toggleTask = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('tasks')
            .update({ completed: !currentStatus })
            .eq('id', id);

        if (!error) {
            setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
        }
    };

    const deleteTask = async (id: string) => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (!error) {
            setTasks(prev => prev.filter(t => t.id !== id));
        }
    };

    const deleteCompletedTasks = async () => {
        if (!user) return;
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('user_id', user.id)
            .eq('completed', true);

        if (!error) {
            setTasks(prev => prev.filter(t => !t.completed));
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !user) return;

        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                user_id: user.id,
                title: newTaskTitle,
                completed: false,
                priority: newTaskPriority,
                tag: newTaskTag || 'General',
                date: 'Hoy'
            }])
            .select();

        if (!error && data) {
            const newTask: Task = {
                id: data[0].id,
                title: data[0].title,
                completed: data[0].completed,
                priority: data[0].priority as Priority,
                date: data[0].date || 'Hoy',
                tag: data[0].tag || 'General'
            };

            setTasks([newTask, ...tasks]);
            setNewTaskTitle('');
            setNewTaskPriority('medium');
            setNewTaskTag('');
            setIsModalOpen(false);
        }
    };

    const getPriorityColor = (p: Priority) => {
        const map = {
            high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
            medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
            low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        };
        return map[p];
    };

    const pendingTasks = tasks.filter(t => !t.completed).sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
    });

    const completedTasks = tasks.filter(t => t.completed).sort((a, b) => {
        return b.id.localeCompare(a.id);
    });

    return (
        <main className="flex-1 flex flex-col gap-6 h-full overflow-hidden px-4 md:px-2 pt-20 md:pt-2 pb-2 relative">
            <header
                className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 pl-14 md:pl-0 animate-enter relative z-30"
                style={{ animationDelay: '0s' }}
            >
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        Mis Tareas
                    </h2>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-1">
                        Tienes <span className="font-bold text-primary">{pendingTasks.length}</span> tareas pendientes y <span className="font-bold text-green-500">{completedTasks.length}</span> finalizadas.
                    </p>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto w-full md:w-auto">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-xl shadow-glow transition-all active:scale-95 flex-shrink-0"
                    >
                        <span className="material-icons-round text-sm">add</span>
                        <span className="hidden sm:inline font-medium">Nueva Tarea</span>
                    </button>
                    <UserProfile />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-0 relative z-0">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
                    <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col animate-enter h-fit" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Pendientes
                            </h3>
                            <span className="text-xs font-semibold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-md">{pendingTasks.length}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                        <th className="p-4 w-12">Hecho</th>
                                        <th className="p-4">Tarea</th>
                                        <th className="p-4 hidden sm:table-cell">Prioridad</th>
                                        <th className="p-4 w-12 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {pendingTasks.length > 0 ? pendingTasks.map((task) => (
                                        <tr key={task.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-none animate-enter">
                                            <td className="p-4 align-top">
                                                <button onClick={() => toggleTask(task.id, task.completed)} className="w-5 h-5 mt-1 rounded-md border-2 border-slate-300 dark:border-slate-600 hover:border-primary flex items-center justify-center transition-all group-hover:scale-110"></button>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-semibold text-slate-800 dark:text-white leading-tight">{task.title}</span>
                                                    <div className="flex items-center gap-3 mt-1 opacity-70">
                                                        <span className="text-[11px] flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                                            <span className="material-icons-round text-[12px]">calendar_today</span>
                                                            {task.date}
                                                        </span>
                                                        <span className="text-[11px] flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                                            <span className="material-icons-round text-[12px]">label</span>
                                                            {task.tag}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top hidden sm:table-cell">
                                                <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wide border inline-block ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center align-top">
                                                <button onClick={() => deleteTask(task.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                    <span className="material-icons-round text-lg">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} className="p-12 text-center opacity-40 text-sm">{loading ? 'Cargando...' : 'No hay tareas pendientes.'}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-soft border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col animate-enter h-fit opacity-60" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-green-50/30 dark:bg-green-900/10 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Finalizadas
                            </h3>
                            <div className="flex items-center gap-4">
                                {completedTasks.length > 0 && (
                                    <button
                                        onClick={deleteCompletedTasks}
                                        className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
                                    >
                                        <span className="material-icons-round text-xs">delete_sweep</span>
                                        Limpiar completed
                                    </button>
                                )}
                                <span className="text-xs font-semibold bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-md">{completedTasks.length}</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <tbody className="text-sm">
                                    {completedTasks.length > 0 ? completedTasks.map((task) => (
                                        <tr key={task.id} className="group border-b border-slate-50 dark:border-slate-800/50 last:border-none animate-enter">
                                            <td className="p-4 w-12">
                                                <div className="w-5 h-5 rounded-md bg-green-500 flex items-center justify-center"><span className="material-icons-round text-white text-[10px]">check</span></div>
                                            </td>
                                            <td className="p-4"><span className="text-slate-400 line-through">{task.title}</span></td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => deleteTask(task.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><span className="material-icons-round text-sm">delete</span></button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={3} className="p-12 text-center opacity-40 text-sm">No hay tareas completadas.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-400/10 dark:bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-premium overflow-hidden animate-in zoom-in-95 duration-200 border border-white dark:border-white/10 p-8">
                        <header className="flex justify-between items-center mb-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Nueva entrada</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white">Crear Tarea</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center transition-colors">
                                <span className="material-icons-round text-slate-400">close</span>
                            </button>
                        </header>

                        <form onSubmit={handleCreateTask} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Título de la Tarea</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="¿Qué necesitas hacer hoy?"
                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-800 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-primary transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Proyecto / Etiqueta</label>
                                <div className="relative">
                                    <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">label</span>
                                    <input
                                        type="text"
                                        value={newTaskTag}
                                        onChange={(e) => setNewTaskTag(e.target.value)}
                                        placeholder="General, Trabajo, Personal..."
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-800 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-primary transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Prioridad</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setNewTaskPriority(p)}
                                            className={`py-3 rounded-xl border-2 font-bold text-[10px] uppercase tracking-widest transition-all ${newTaskPriority === p
                                                ? (p === 'high' ? 'bg-rose-50 border-rose-500 text-rose-500' : p === 'medium' ? 'bg-orange-50 border-orange-500 text-orange-500' : 'bg-blue-50 border-blue-500 text-blue-500')
                                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200'
                                                }`}
                                        >
                                            {p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-glow active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                                >
                                    Crear Tarea
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
};
