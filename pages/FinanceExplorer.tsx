import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FinanceTransaction, FinanceCategory, FinanceWeeklyClosing } from '../types';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const MoneyDisplay: React.FC<{ value: number | string; prefix?: string; showData: boolean; className?: string }> = ({ value, prefix = "$", showData, className = "" }) => {
    return (
        <span className={`${className} transition-all duration-300 ${!showData ? 'blur-md select-none opacity-50' : 'blur-0'}`}>
            {prefix}{typeof Number(value) === 'number' && !isNaN(Number(value)) ? Number(value).toLocaleString() : value}
        </span>
    );
};

export const FinanceExplorer: React.FC = () => {
    const { user } = useAuth();
    const { settings, updateSettings } = useSettings();
    const navigate = useNavigate();

    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [categories, setCategories] = useState<FinanceCategory[]>([]);
    const [closings, setClosings] = useState<FinanceWeeklyClosing[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [filterType, setFilterType] = useState<'all' | 'today' | '7d' | '30d' | 'custom'>('all');
    const [customStart, setCustomStart] = useState(new Date().toLocaleDateString('sv-SE'));
    const [customEnd, setCustomEnd] = useState(new Date().toLocaleDateString('sv-SE'));
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        const [txRes, catRes, closeRes] = await Promise.all([
            supabase.from('finance_transactions').select('*').eq('user_id', user?.id).order('date', { ascending: false }),
            supabase.from('finance_categories').select('*').eq('user_id', user?.id),
            supabase.from('finance_weekly_closings').select('*').eq('user_id', user?.id)
        ]);

        if (!txRes.error) setTransactions(txRes.data as FinanceTransaction[]);
        if (!catRes.error) setCategories(catRes.data as FinanceCategory[]);
        if (!closeRes.error) setClosings(closeRes.data as FinanceWeeklyClosing[]);
        setLoading(false);
    };

    const deleteTransaction = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este movimiento?')) return;
        const { error } = await supabase.from('finance_transactions').delete().eq('id', id);
        if (!error) {
            setTransactions(prev => prev.filter(t => t.id !== id));
        }
    };

    const filteredTransactions = useMemo(() => {
        let result = transactions.filter(t => {
            const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesCategory = true;
            if (selectedCategory === 'income') matchesCategory = t.type === 'income';
            else if (selectedCategory === 'expense') matchesCategory = t.type === 'expense';
            else if (selectedCategory === 'investment') matchesCategory = t.type === 'investment';
            else if (selectedCategory !== 'all') matchesCategory = t.category_name === selectedCategory;

            const [y, m, d] = t.date.split('-').map(Number);
            const txDate = new Date(y, m - 1, d);
            const today = new Date();

            let matchesPeriod = true;
            if (filterType === 'today') matchesPeriod = t.date === today.toLocaleDateString('sv-SE');
            else if (filterType === '7d') {
                const d7 = new Date(); d7.setDate(today.getDate() - 7);
                matchesPeriod = txDate >= d7 && txDate <= today;
            }
            else if (filterType === '30d') {
                const d30 = new Date(); d30.setDate(today.getDate() - 30);
                matchesPeriod = txDate >= d30 && txDate <= today;
            }
            else if (filterType === 'custom') matchesPeriod = t.date >= customStart && t.date <= customEnd;

            return matchesSearch && matchesCategory && matchesPeriod;
        });

        // Sorting
        return [...result].sort((a, b) => {
            if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
            if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
            if (sortBy === 'amount_desc') return Number(b.amount) - Number(a.amount);
            if (sortBy === 'amount_asc') return Number(a.amount) - Number(b.amount);
            return 0;
        });
    }, [transactions, searchQuery, selectedCategory, filterType, customStart, customEnd, sortBy]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <span className="material-icons-round text-4xl text-primary animate-spin">sync</span>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 md:rounded-[48px] overflow-hidden shadow-2xl border border-white dark:border-white/5 animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <header className="p-8 pb-4 shrink-0 flex justify-between items-start border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/finance')}
                        className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-all group active:scale-90"
                    >
                        <span className="material-icons-round text-slate-500 dark:text-slate-300 group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    </button>
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white">Todos los movimientos</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestión integral de tus finanzas</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => updateSettings({ finance_show_data: !settings.finance_show_data })}
                        className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 hover:text-primary transition-all border border-slate-100 dark:border-white/5"
                    >
                        <span className="material-icons-round">{settings.finance_show_data ? 'visibility' : 'visibility_off'}</span>
                    </button>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="px-8 py-6 bg-white/30 dark:bg-slate-800/30 border-b border-slate-100 dark:border-white/5 flex flex-wrap gap-4 items-center shrink-0">
                {/* Search */}
                <div className="flex-1 min-w-[300px] relative group">
                    <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por descripción..."
                        className="w-full bg-white dark:bg-slate-900 pl-12 pr-6 py-3 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none ring-primary focus:ring-2 transition-all shadow-sm border-none"
                    />
                </div>

                {/* Period Select */}
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
                    {[
                        { id: 'all', label: 'Todo' },
                        { id: 'today', label: 'Hoy' },
                        { id: '7d', label: '7d' },
                        { id: '30d', label: '30d' },
                        { id: 'custom', label: 'Rango' }
                    ].map(p => (
                        <button
                            key={p.id}
                            onClick={() => setFilterType(p.id as any)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === p.id
                                ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {filterType === 'custom' && (
                    <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                        <input
                            type="date"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 outline-none ring-primary focus:ring-2 border-none shadow-sm"
                        />
                        <span className="text-slate-400 font-bold">al</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 outline-none ring-primary focus:ring-2 border-none shadow-sm"
                        />
                    </div>
                )}

                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 outline-none ring-primary focus:ring-2 transition-all shadow-sm border-none min-w-[150px] appearance-none cursor-pointer"
                >
                    <option value="all">Categorías</option>
                    <option value="income">Ingresos</option>
                    <option value="expense">Egresos</option>
                    <option value="investment">Inversiones</option>
                    <option value="Gastos">Gastos (Sistema)</option>
                    <option value="Inversión">Inversión (Sistema)</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 outline-none ring-primary focus:ring-2 transition-all shadow-sm border-none min-w-[150px] appearance-none cursor-pointer"
                >
                    <option value="date_desc">Más recientes</option>
                    <option value="date_asc">Más antiguos</option>
                    <option value="amount_desc">Monto (Mayor)</option>
                    <option value="amount_asc">Monto (Menor)</option>
                </select>
            </div>

            {/* Content Table */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="bg-white dark:bg-slate-800/40 rounded-[32px] overflow-hidden border border-slate-100 dark:border-white/5 shadow-premium">
                    <table className="w-full">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-white/5">
                                <th className="px-8 py-5 text-left">Fecha</th>
                                <th className="px-8 py-5 text-left">Concepto</th>
                                <th className="px-8 py-5 text-left">Categoría</th>
                                <th className="px-8 py-5 text-right">Monto</th>
                                <th className="px-8 py-5 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {filteredTransactions.map(tx => (
                                <tr key={tx.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-all">
                                    <td className="px-8 py-5 text-[11px] font-black text-slate-400 tabular-nums">{tx.date}</td>
                                    <td className="px-8 py-5">
                                        <span className={`text-sm font-bold text-slate-700 dark:text-slate-200 transition-all ${!settings.finance_show_data ? 'blur-sm select-none' : 'blur-0'}`}>
                                            {tx.description}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full ${tx.type === 'income'
                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                            : tx.type === 'investment'
                                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                                                : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                                            }`}>
                                            {tx.category_name}
                                        </span>
                                    </td>
                                    <td className={`px-8 py-5 text-right font-black tabular-nums text-lg ${tx.type === 'income' ? 'text-emerald-500' : tx.type === 'investment' ? 'text-indigo-500' : 'text-rose-500'}`}>
                                        <MoneyDisplay value={tx.amount} showData={settings.finance_show_data} prefix={tx.type === 'income' ? '+' : '-'} />
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <button
                                            onClick={() => deleteTransaction(tx.id)}
                                            className="w-10 h-10 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center mx-auto"
                                        >
                                            <span className="material-icons-round text-lg">delete_outline</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredTransactions.length === 0 && (
                        <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
                            <span className="material-icons-round text-6xl">cloud_off</span>
                            <p className="font-bold italic">No se encontraron movimientos con estos filtros.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
