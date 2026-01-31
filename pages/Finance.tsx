import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FinanceCalendar } from '../components/FinanceCalendar';
import { FinanceTransaction, FinanceCategory, FinanceWeeklyClosing } from '../types';
import { UserProfile } from '../components/UserProfile';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const MoneyDisplay: React.FC<{ value: number | string; prefix?: string; showData: boolean; className?: string }> = ({ value, prefix = "$", showData, className = "" }) => {
    return (
        <span className={`${className} transition-all duration-300 ${!showData ? 'blur-md select-none opacity-50' : 'blur-0'}`}>
            {prefix}{typeof Number(value) === 'number' && !isNaN(Number(value)) ? Number(value).toLocaleString() : value}
        </span>
    );
};

export const Finance: React.FC = () => {
    const { user } = useAuth();
    const { settings, updateSettings } = useSettings();
    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [categories, setCategories] = useState<FinanceCategory[]>([]);
    const [closings, setClosings] = useState<FinanceWeeklyClosing[]>([]);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'income' | 'expense' | 'investment'>('expense');
    const [loading, setLoading] = useState(true);
    const [viewAllType, setViewAllType] = useState<'income' | 'expense' | 'investment' | null>(null);
    const navigate = useNavigate();

    // Weekly Management State
    const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [selectedWeek, setSelectedWeek] = useState<number>(() => {
        const day = new Date().getDate();
        if (day <= 7) return 1;
        if (day <= 14) return 2;
        if (day <= 21) return 3;
        return 4;
    });

    // List Filter States
    const [filterType, setFilterType] = useState<'week' | 'today' | '7d' | '30d' | 'custom'>('week');
    const [customStart, setCustomStart] = useState(new Date().toLocaleDateString('sv-SE'));
    const [customEnd, setCustomEnd] = useState(new Date().toLocaleDateString('sv-SE'));

    // Chart Filter States
    const [chartCustomStart, setChartCustomStart] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('sv-SE'));
    const [chartCustomEnd, setChartCustomEnd] = useState(new Date().toLocaleDateString('sv-SE'));
    const [chartGranularity, setChartGranularity] = useState<'day' | 'week' | 'month'>('day');
    const [metricsViewMode, setMetricsViewMode] = useState<'chart' | 'calendar'>('chart');
    const [calendarViewDate, setCalendarViewDate] = useState(new Date(viewYear, viewMonth - 1, 1));
    const [txDate, setTxDate] = useState(new Date().toLocaleDateString('sv-SE'));
    const [showCustomDate, setShowCustomDate] = useState(false);
    const [chartLineVisibility, setChartLineVisibility] = useState({
        income: true,
        expense: true,
        investment: true,
        balance: true,
        movingAverage: true
    });
    const [chartMainView, setChartMainView] = useState<'flows' | 'balance'>('flows');


    // Security State
    const [isLocked, setIsLocked] = useState(settings.finance_password_enabled || false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, viewMonth, viewYear]);

    const fetchData = async () => {
        setLoading(true);
        const [txRes, catRes, closeRes] = await Promise.all([
            supabase.from('finance_transactions').select('*').eq('user_id', user?.id).order('date', { ascending: false }),
            supabase.from('finance_categories').select('*').eq('user_id', user?.id),
            supabase.from('finance_weekly_closings').select('*').eq('user_id', user?.id).eq('month', viewMonth).eq('year', viewYear)
        ]);

        if (!txRes.error) setTransactions(txRes.data as FinanceTransaction[]);
        if (!catRes.error) setCategories(catRes.data as FinanceCategory[]);
        if (!closeRes.error) setClosings(closeRes.data as FinanceWeeklyClosing[]);
        setLoading(false);
    };

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === settings.finance_password) {
            setIsLocked(false);
        } else {
            setPasswordError(true);
            setTimeout(() => setPasswordError(false), 500);
        }
    };

    // Dynamic Week ranges based on actual calendar (Mon-Sun or Sun-Sat)
    // We'll use "Natural Weeks": Blocks ending on Sundays or the last day.
    const weekRanges = useMemo(() => {
        const lastDay = new Date(viewYear, viewMonth, 0).getDate();
        const ranges = [];
        let currentDay = 1;
        let weekId = 1;

        while (currentDay <= lastDay) {
            let start = currentDay;
            let d = new Date(viewYear, viewMonth - 1, currentDay);
            let dayOfWeek = d.getDay(); // 0 is Sunday
            // Days until next Sunday
            let daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
            let end = Math.min(currentDay + daysToSunday, lastDay);

            ranges.push({ id: weekId++, start, end });
            currentDay = end + 1;
        }
        return ranges;
    }, [viewMonth, viewYear]);

    // Ensure selectedWeek is valid for the current view
    useEffect(() => {
        if (!weekRanges.find(r => r.id === selectedWeek)) {
            setSelectedWeek(1);
        }
    }, [weekRanges]);

    const displayTransactions = useMemo(() => {
        const today = new Date();
        const parseDate = (dateStr: string) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d);
        };

        return transactions.filter(t => {
            const [y, m, d] = t.date.split('-').map(Number);
            const txDate = new Date(y, m - 1, d);

            if (filterType === 'today') {
                return t.date === today.toLocaleDateString('sv-SE');
            }
            if (filterType === '7d') {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(today.getDate() - 7);
                return txDate >= sevenDaysAgo && txDate <= today;
            }
            if (filterType === '30d') {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);
                return txDate >= thirtyDaysAgo && txDate <= today;
            }
            if (filterType === 'custom') {
                return t.date >= customStart && t.date <= customEnd;
            }

            // Default: 'week' - Filter by the selected week in the Management grid
            const range = weekRanges.find(r => r.id === selectedWeek);
            if (!range) return false;
            return m === viewMonth && y === viewYear && d >= range.start && d <= range.end;
        });
    }, [transactions, filterType, selectedWeek, weekRanges, viewMonth, viewYear, customStart, customEnd]);

    // Keep week-specific stats for the summary cards
    const weekTransactions = useMemo(() => {
        const range = weekRanges.find(r => r.id === selectedWeek);
        if (!range) return [];
        return transactions.filter(t => {
            const [y, m, d] = t.date.split('-').map(Number);
            return m === viewMonth && y === viewYear && d >= range.start && d <= range.end;
        });
    }, [transactions, selectedWeek, weekRanges, viewMonth, viewYear]);

    const weekStats = useMemo(() => {
        const income = weekTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
        const expense = weekTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
        const investment = weekTransactions.filter(t => t.type === 'investment').reduce((acc, t) => acc + Number(t.amount), 0);
        const net = income - expense - investment;
        return { income, expense, investment, net };
    }, [weekTransactions]);

    const globalStats = useMemo(() => {
        const totalNet = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0) -
            transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0) -
            transactions.filter(t => t.type === 'investment').reduce((acc, t) => acc + Number(t.amount), 0);
        return { totalNet };
    }, [transactions]);

    const chartData = useMemo(() => {
        let granularity: 'day' | 'week' | 'month' = chartGranularity;
        const parseLocal = (dateStr: string) => {
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d);
        };
        const startDate = parseLocal(chartCustomStart);
        const endDate = parseLocal(chartCustomEnd);

        // Calculate Initial Balance (Historical net before start date)
        const initialBalance = transactions.filter(t => {
            const [y, m, d] = t.date.split('-').map(Number);
            const txDate = new Date(y, m - 1, d);
            return txDate < startDate;
        }).reduce((acc, t) => {
            if (t.type === 'income') return acc + Number(t.amount);
            return acc - Number(t.amount);
        }, 0);

        const data = [];
        const curr = new Date(startDate);
        let runningBalance = initialBalance;

        if (granularity === 'day') {
            while (curr <= endDate) {
                const dateStr = [
                    curr.getFullYear(),
                    String(curr.getMonth() + 1).padStart(2, '0'),
                    String(curr.getDate()).padStart(2, '0')
                ].join('-');
                const dayTxs = transactions.filter(t => t.date === dateStr);
                const income = dayTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
                const expense = dayTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
                const investment = dayTxs.filter(t => t.type === 'investment').reduce((acc, t) => acc + Number(t.amount), 0);

                const periodNet = income - expense - investment;
                runningBalance += periodNet;

                data.push({
                    name: curr.getDate().toString(),
                    fullDate: dateStr,
                    income,
                    expense,
                    investment,
                    periodNet,
                    cumulativeBalance: runningBalance
                });
                curr.setDate(curr.getDate() + 1);
            }
        } else if (granularity === 'month') {
            curr.setDate(1);
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            while (curr <= endDate) {
                const m = curr.getMonth();
                const y = curr.getFullYear();
                const monthTxs = transactions.filter(t => {
                    const [ty, tm] = t.date.split('-').map(Number);
                    return ty === y && tm === m + 1;
                });

                const income = monthTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
                const expense = monthTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
                const investment = monthTxs.filter(t => t.type === 'investment').reduce((acc, t) => acc + Number(t.amount), 0);

                const periodNet = income - expense - investment;
                runningBalance += periodNet;

                data.push({
                    name: `${months[m]} ${y.toString().slice(-2)}`,
                    income,
                    expense,
                    investment,
                    periodNet,
                    cumulativeBalance: runningBalance
                });
                curr.setMonth(curr.getMonth() + 1);
            }
        } else {
            // Week granularity
            while (curr <= endDate) {
                const weekEnd = new Date(curr);
                weekEnd.setDate(curr.getDate() + 6);
                const actualEnd = weekEnd > endDate ? endDate : weekEnd;

                const weekTxs = transactions.filter(t => {
                    const [ty, tm, td] = t.date.split('-').map(Number);
                    const txDate = new Date(ty, tm - 1, td);
                    return txDate >= curr && txDate <= actualEnd;
                });

                const income = weekTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
                const expense = weekTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
                const investment = weekTxs.filter(t => t.type === 'investment').reduce((acc, t) => acc + Number(t.amount), 0);

                const periodNet = income - expense - investment;
                runningBalance += periodNet;

                data.push({
                    name: `W${Math.ceil(curr.getDate() / 7)}`,
                    range: `${curr.getDate()}/${curr.getMonth() + 1} - ${actualEnd.getDate()}/${actualEnd.getMonth() + 1}`,
                    income,
                    expense,
                    investment,
                    periodNet,
                    cumulativeBalance: runningBalance
                });
                curr.setDate(curr.getDate() + 7);
            }
        }

        // Calculate Moving Average (5-period window)
        const windowSize = 5;
        for (let i = 0; i < data.length; i++) {
            const startIdx = Math.max(0, i - windowSize + 1);
            const slice = data.slice(startIdx, i + 1);
            const sum = slice.reduce((acc, curr) => acc + curr.cumulativeBalance, 0);
            (data[i] as any).movingAverage = sum / slice.length;
        }

        return data;
    }, [transactions, chartCustomStart, chartCustomEnd, chartGranularity, viewMonth, viewYear, weekRanges]);

    const handleCloseWeek = async () => {
        if (!user) return;
        const alreadyClosed = closings.find(c => c.week_number === selectedWeek);
        if (alreadyClosed) return;

        const ratio = settings.finance_ratio_limit || 30;
        const invRatio = 100 - ratio;

        const totalIncome = weekTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
        const totalGastos = weekTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
        const totalInversiones = weekTransactions.filter(t => t.type === 'investment').reduce((acc, t) => acc + Number(t.amount), 0);

        // Math: (Income * Ratio%) - TOTAL Gastos (Prevents discrepancy)
        const potentialExp = totalIncome * (ratio / 100);
        let assignedExp = potentialExp - totalGastos;

        // Investment Base: (Income * InvRatio%)
        // Note: Real investment movements are now deducted immediately from the wallet, 
        // so we don't subtract totalInversiones here to avoid double-deducting them from the wallet balance.
        let assignedInv = (totalIncome * (invRatio / 100));

        // If expenses overflow, subtract from investment to keep Expense wallet at 0
        if (assignedExp < 0) {
            assignedInv += assignedExp; // Subtract excess from investment
            assignedExp = 0;
        }

        const { data, error } = await supabase.from('finance_weekly_closings').insert([{
            user_id: user.id,
            week_number: selectedWeek,
            month: viewMonth,
            year: viewYear,
            net_amount: weekStats.net,
            assigned_expenses: assignedExp,
            assigned_investments: assignedInv
        }]).select();

        if (!error && data) {
            setClosings([...closings, data[0] as FinanceWeeklyClosing]);
            await updateSettings({
                wallet_expenses: (settings.wallet_expenses || 0) + assignedExp,
                wallet_investments: (settings.wallet_investments || 0) + assignedInv
            });
        }
    };

    const handleReopenWeek = async (weekNum: number) => {
        if (!user) return;
        const closure = closings.find(c => c.week_number === weekNum);
        if (!closure) return;

        const { error } = await supabase.from('finance_weekly_closings').delete().eq('id', closure.id);

        if (!error) {
            setClosings(closings.filter(c => c.week_number !== weekNum));
            // Revert wallet update (Allows wallets to go negative if necessary)
            await updateSettings({
                wallet_expenses: (settings.wallet_expenses || 0) - closure.assigned_expenses,
                wallet_investments: (settings.wallet_investments || 0) - closure.assigned_investments
            });
        }
    };

    const deleteTransaction = async (id: string) => {
        const txToDelete = transactions.find(t => t.id === id);
        const { error } = await supabase.from('finance_transactions').delete().eq('id', id);
        if (!error) {
            setTransactions(prev => prev.filter(t => t.id !== id));

            // If it was an investment, refund the wallet
            if (txToDelete?.type === 'investment') {
                await updateSettings({
                    wallet_investments: (settings.wallet_investments || 0) + Number(txToDelete.amount)
                });
            }
        }
    };

    const addTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newTx = {
            user_id: user?.id,
            type: modalType,
            amount: Number(formData.get('amount')),
            category_name: formData.get('category') as string,
            description: formData.get('description') as string,
            date: txDate,
        };

        const { data, error } = await supabase.from('finance_transactions').insert([newTx]).select();
        if (!error && data) {
            setTransactions([data[0] as FinanceTransaction, ...transactions]);
            setIsTxModalOpen(false);
            setShowCustomDate(false);

            // If it's an investment, deduct from the wallet immediately
            if (modalType === 'investment') {
                await updateSettings({
                    wallet_investments: (settings.wallet_investments || 0) - Number(newTx.amount)
                });
            }
        }
    };

    if (isLocked) {
        return (
            <main className="flex-1 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 overflow-hidden">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-premium border border-white dark:border-white/10 w-full max-w-sm text-center animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <span className="material-icons-round text-primary text-4xl">lock</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Sección Protegida</h2>
                    <p className="text-sm text-slate-400 mb-8 font-medium">Ingresa tu clave de finanzas para continuar</p>
                    <form onSubmit={handleUnlock} className="space-y-4">
                        <input
                            type="password"
                            autoFocus
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Clave"
                            className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-center text-xl font-bold tracking-[1em] outline-none ring-primary focus:ring-2 transition-all ${passwordError ? 'animate-shake' : ''}`}
                        />
                        <button type="submit" className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-glow active:scale-95 transition-all">Desbloquear</button>
                    </form>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 flex flex-col gap-6 h-full overflow-y-auto px-4 md:px-6 pt-20 md:pt-4 pb-10 relative scroll-smooth">
            <header className="p-8 pb-4 shrink-0 flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white">Panel Financiero</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Gestión de carteras y cierres semanales.</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-white/5">
                        <button onClick={() => { setModalType('income'); setTxDate(new Date().toLocaleDateString('sv-SE')); setShowCustomDate(false); setIsTxModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                            <span className="material-icons-round text-sm">add</span>
                            <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">Ingreso</span>
                        </button>
                        <button onClick={() => { setModalType('expense'); setTxDate(new Date().toLocaleDateString('sv-SE')); setShowCustomDate(false); setIsTxModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all">
                            <span className="material-icons-round text-sm">remove</span>
                            <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">Gasto</span>
                        </button>
                        <button onClick={() => { setModalType('investment'); setTxDate(new Date().toLocaleDateString('sv-SE')); setShowCustomDate(false); setIsTxModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all">
                            <span className="material-icons-round text-sm">account_balance_wallet</span>
                            <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">Inversión</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => updateSettings({ finance_show_data: !settings.finance_show_data })}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all ${!settings.finance_show_data ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-primary text-white border-primary shadow-glow shadow-primary/20'}`}
                        >
                            <span className="material-icons-round text-sm">{settings.finance_show_data ? 'visibility' : 'visibility_off'}</span>
                            <span className="font-bold text-xs uppercase tracking-widest">{settings.finance_show_data ? 'Ocultar' : 'Mostrar'}</span>
                        </button>
                        <UserProfile />
                    </div>
                </div>
            </header>



            {/* 4 Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-enter">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-soft">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Dinero actual</p>
                    <h4 className={`text-2xl font-black ${globalStats.totalNet >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>
                        <MoneyDisplay value={globalStats.totalNet} showData={settings.finance_show_data} />
                    </h4>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-soft border-l-4 border-l-primary">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Esta Semana (Neto)</p>
                    <h4 className={`text-2xl font-black ${weekStats.net < 0 ? 'text-rose-500' : weekStats.net > 0 ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-200'}`}>
                        <MoneyDisplay value={weekStats.net} showData={settings.finance_show_data} />
                    </h4>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-soft">
                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Cartera Inversiones</p>
                    <h4 className="text-2xl font-black text-indigo-500"><MoneyDisplay value={settings.wallet_investments || 0} showData={settings.finance_show_data} /></h4>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-soft">
                    <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Cartera Gastos</p>
                    <h4 className={`text-2xl font-black ${(settings.wallet_expenses || 0) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        <MoneyDisplay value={settings.wallet_expenses || 0} showData={settings.finance_show_data} />
                    </h4>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-stretch">
                {/* List Movements (Wider) */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-white/5 shadow-soft flex flex-col overflow-hidden">
                    <div className="p-6 border-b bg-slate-50/50 dark:bg-slate-900/20 sticky top-0 z-10 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="material-icons-round text-blue-500">receipt_long</span>
                                {filterType === 'week' ? `Movimientos Semana ${selectedWeek}` :
                                    filterType === 'today' ? 'Movimientos de Hoy' :
                                        filterType === '7d' ? 'Últimos 7 días' :
                                            filterType === '30d' ? 'Últimos 30 días' : 'Rango Personalizado'}
                            </h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate('/finance-explorer')}
                                    className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all group active:scale-90"
                                >
                                    <span className="material-icons-round text-slate-400 group-hover:text-primary transition-colors">expand</span>
                                </button>
                                <span className="text-xs font-bold text-slate-400">{displayTransactions.length} registros</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 overflow-x-auto no-scrollbar">
                                {[
                                    { id: 'week', label: 'Semana', icon: 'view_week' },
                                    { id: 'today', label: 'Hoy', icon: 'today' },
                                    { id: '7d', label: '7 Días', icon: 'event' },
                                    { id: '30d', label: '30 Días', icon: 'calendar_month' },
                                    { id: 'custom', label: 'Rango', icon: 'date_range' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setFilterType(tab.id as any)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${filterType === tab.id
                                            ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        <span className="material-icons-round text-sm">{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {filterType === 'custom' && (
                                <div className="flex items-center gap-1.5 animate-in slide-in-from-left-2 duration-200">
                                    <input
                                        type="date"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="text-[10px] font-bold bg-slate-100 dark:bg-slate-900 border-none rounded-lg px-2 py-1 outline-none text-slate-600 dark:text-slate-300"
                                    />
                                    <span className="text-[10px] text-slate-400 font-bold">al</span>
                                    <input
                                        type="date"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="text-[10px] font-bold bg-slate-100 dark:bg-slate-900 border-none rounded-lg px-2 py-1 outline-none text-slate-600 dark:text-slate-300"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[400px]">
                        <table className="w-full">
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                {displayTransactions.map((tx) => (
                                    <tr key={tx.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-200">
                                            <div className="flex flex-col">
                                                <span className={`transition-all duration-500 ${!settings.finance_show_data ? 'blur-sm select-none' : 'blur-0'}`}>{tx.description}</span>
                                                <span className="text-[9px] text-slate-400 font-normal">{tx.date}</span>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-black text-xs ${tx.type === 'income' ? 'text-emerald-500' : tx.type === 'investment' ? 'text-indigo-500' : 'text-rose-500'}`}>
                                            <MoneyDisplay value={tx.amount} showData={settings.finance_show_data} prefix={tx.type === 'income' ? '+' : '-'} />
                                        </td>
                                        <td className="px-6 py-4 text-right w-10"><button onClick={() => deleteTransaction(tx.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><span className="material-icons-round text-sm">delete</span></button></td>
                                    </tr>
                                ))}
                                {displayTransactions.length === 0 && (
                                    <tr><td colSpan={3} className="py-20 text-center opacity-30 italic text-xs">No hay movimientos en este periodo.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Weekly Closure Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-soft flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="material-icons-round text-primary text-sm">date_range</span>
                            Gestión Semanal
                        </h3>
                        <div className="flex gap-1">
                            <select
                                value={viewMonth}
                                onChange={(e) => setViewMonth(Number(e.target.value))}
                                className="text-[10px] font-bold bg-slate-50 dark:bg-slate-900 border-none rounded-lg px-2 py-1 outline-none text-slate-500"
                            >
                                {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={viewYear}
                                onChange={(e) => setViewYear(Number(e.target.value))}
                                className="text-[10px] font-bold bg-slate-50 dark:bg-slate-900 border-none rounded-lg px-2 py-1 outline-none text-slate-500"
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-3 flex-1">
                        {weekRanges.map((range) => {
                            const closure = closings.find(c => c.week_number === range.id);
                            const isCurrent = selectedWeek === range.id;
                            const now = new Date();
                            const isActuallyCurrent = now.getDate() >= range.start && now.getDate() <= range.end && (now.getMonth() + 1) === viewMonth && now.getFullYear() === viewYear;

                            return (
                                <div
                                    key={range.id}
                                    onClick={() => { setSelectedWeek(range.id); setFilterType('week'); }}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${isCurrent
                                        ? 'bg-primary/5 border-primary shadow-sm'
                                        : 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent hover:border-slate-200 dark:hover:border-white/10'
                                        } ${isActuallyCurrent ? 'ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-slate-800' : ''}`}
                                >
                                    {closure && (now.getMonth() + 1) === viewMonth && now.getFullYear() === viewYear && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleReopenWeek(range.id); }}
                                            className="absolute -right-2 -top-2 w-6 h-6 bg-white dark:bg-slate-800 rounded-full shadow-md border border-slate-100 dark:border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:text-rose-500"
                                            title="Re-abrir semana"
                                        >
                                            <span className="material-icons-round text-[14px]">undo</span>
                                        </button>
                                    )}
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase ${isCurrent ? 'text-primary' : 'text-slate-400'}`}>Semana {range.id}</span>
                                            <span className="text-[9px] text-slate-300 font-bold">{range.start}-{range.end}</span>
                                        </div>
                                        {closure ? (
                                            <span className="material-icons-round text-emerald-500 text-sm">check_circle</span>
                                        ) : isActuallyCurrent && (
                                            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                                        )}
                                    </div>
                                    {closure ? (
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                            <div>
                                                <p className="text-[8px] uppercase text-slate-400 font-black">Neto</p>
                                                <p className="text-[10px] font-black text-slate-600 dark:text-slate-300">
                                                    <MoneyDisplay value={closure.net_amount} showData={settings.finance_show_data} />
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] uppercase text-indigo-400 font-black">Inversión</p>
                                                <p className={`text-[10px] font-black ${closure.assigned_investments < 0 ? 'text-rose-500' : 'text-indigo-500'}`}>
                                                    <MoneyDisplay value={closure.assigned_investments} showData={settings.finance_show_data} />
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] uppercase text-emerald-400 font-black">Gastos</p>
                                                <p className={`text-[10px] font-black ${closure.assigned_expenses < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    <MoneyDisplay value={closure.assigned_expenses} showData={settings.finance_show_data} />
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-slate-400 italic mt-1 font-medium">Semana abierta...</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleCloseWeek}
                        disabled={!!closings.find(c => c.week_number === selectedWeek)}
                        className={`w-full mt-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg ${closings.find(c => c.week_number === selectedWeek)
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-primary text-white shadow-primary/20 hover:bg-blue-600'
                            }`}
                    >
                        {closings.find(c => c.week_number === selectedWeek) ? 'Semana Cerrada' : 'Cerrar Semana Seleccionada'}
                    </button>

                    <p className="text-[9px] text-center text-slate-400 mt-4 px-4 leading-relaxed italic">
                        El remanente de gastos se calcula restando lo ya gastado en la semana de tu límite permitido (30% de ingresos).
                    </p>
                </div>
            </div>

            {/* Metrics Chart Section (Moved to bottom) */}
            <div className="p-8 mt-4 bg-white dark:bg-slate-800/40 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-soft animate-enter">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white">Métricas Evolutivas</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Análisis de flujo de caja</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-100 dark:border-white/5">
                            <button
                                onClick={() => setMetricsViewMode('chart')}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${metricsViewMode === 'chart'
                                    ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                    }`}
                            >
                                Gráfico
                            </button>
                            <button
                                onClick={() => setMetricsViewMode('calendar')}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${metricsViewMode === 'calendar'
                                    ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                    }`}
                            >
                                Calendario
                            </button>
                        </div>

                        {metricsViewMode === 'chart' && (
                            <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-100 dark:border-white/5">
                                <button
                                    onClick={() => setChartMainView('flows')}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chartMainView === 'flows'
                                        ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                        }`}
                                >
                                    Flujos
                                </button>
                                <button
                                    onClick={() => setChartMainView('balance')}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chartMainView === 'balance'
                                        ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                        }`}
                                >
                                    Balance
                                </button>
                            </div>
                        )}

                        {metricsViewMode === 'chart' ? (
                            <>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-100 dark:border-white/5">
                                    <input
                                        type="date"
                                        value={chartCustomStart}
                                        onChange={(e) => setChartCustomStart(e.target.value)}
                                        className="bg-transparent text-[10px] font-bold text-slate-600 dark:text-slate-300 outline-none px-2"
                                    />
                                    <span className="text-slate-300 text-[10px] font-black">/</span>
                                    <input
                                        type="date"
                                        value={chartCustomEnd}
                                        onChange={(e) => setChartCustomEnd(e.target.value)}
                                        className="bg-transparent text-[10px] font-bold text-slate-600 dark:text-slate-300 outline-none px-2"
                                    />
                                </div>

                                <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-100 dark:border-white/5">
                                    {[
                                        { id: 'day', label: 'Días' },
                                        { id: 'week', label: 'Semanas' },
                                        { id: 'month', label: 'Meses' }
                                    ].map(g => (
                                        <button
                                            key={g.id}
                                            onClick={() => setChartGranularity(g.id as any)}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${chartGranularity === g.id
                                                ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            {g.label}
                                        </button>
                                    ))}
                                </div>


                            </>
                        ) : (
                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4">
                                <button onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1))} className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                                    <span className="material-icons-round text-sm">chevron_left</span>
                                </button>
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest min-w-[100px] text-center">
                                    {calendarViewDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                                </span>
                                <button onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1))} className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                                    <span className="material-icons-round text-sm">chevron_right</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`h-[400px] w-full relative transition-all duration-700 ${!settings.finance_show_data ? 'blur-2xl opacity-20 pointer-events-none scale-95' : 'blur-0 opacity-100'}`}>
                    {settings.finance_show_data ? (
                        metricsViewMode === 'chart' ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorInvestment" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                                    />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const p = payload[0].payload;
                                                return (
                                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-4 rounded-2xl shadow-premium backdrop-blur-md min-w-[180px]">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-3 border-b border-slate-50 dark:border-white/5 pb-2">
                                                            {label} {p.range ? `(${p.range})` : p.fullDate ? `(${p.fullDate.split('-').reverse().slice(0, 2).join('/')})` : ''}
                                                        </p>
                                                        <div className="space-y-2">
                                                            {chartLineVisibility.income && (
                                                                <div className="flex justify-between items-center gap-4">
                                                                    <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Ingresos</span>
                                                                    <span className="text-[11px] font-black text-emerald-500">${Number(p.income).toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                            {chartLineVisibility.expense && (
                                                                <div className="flex justify-between items-center gap-4">
                                                                    <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Gastos</span>
                                                                    <span className="text-[11px] font-black text-rose-500">${Number(p.expense).toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                            {chartLineVisibility.investment && (
                                                                <div className="flex justify-between items-center gap-4">
                                                                    <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Inversión</span>
                                                                    <span className="text-[11px] font-black text-indigo-500">${Number(p.investment).toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-white/5">
                                                                <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-500/10 p-2.5 rounded-xl border border-blue-100/50 dark:border-blue-500/20">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.1em]">Balance Total</span>
                                                                        {chartLineVisibility.movingAverage && (
                                                                            <span className="text-[8px] font-bold text-blue-400 dark:text-blue-500 uppercase">Media: ${Math.round(p.movingAverage).toLocaleString()}</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                                                                        ${p.cumulativeBalance.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    {chartMainView === 'flows' ? (
                                        <>
                                            {chartLineVisibility.income && <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />}
                                            {chartLineVisibility.expense && <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />}
                                            {chartLineVisibility.investment && <Area type="monotone" dataKey="investment" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorInvestment)" />}
                                        </>
                                    ) : (
                                        <>
                                            {chartLineVisibility.balance && (
                                                <Area
                                                    type="monotone"
                                                    dataKey="cumulativeBalance"
                                                    stroke="#0070f3"
                                                    strokeWidth={4}
                                                    fillOpacity={1}
                                                    fill="url(#colorBalance)"
                                                />
                                            )}
                                            {chartLineVisibility.movingAverage && (
                                                <Line
                                                    type="monotone"
                                                    dataKey="movingAverage"
                                                    stroke="#3b82f6"
                                                    strokeWidth={2}
                                                    strokeOpacity={0.5}
                                                    dot={false}
                                                />
                                            )}
                                        </>
                                    )}

                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <FinanceCalendar
                                transactions={transactions}
                                viewMonth={calendarViewDate.getMonth() + 1}
                                viewYear={calendarViewDate.getFullYear()}
                            />
                        )
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 italic font-bold gap-4">
                            <span className="material-icons-round text-6xl">visibility_off</span>
                            <p>Modo privado activo - Gráfico ocultado</p>
                        </div>
                    )}
                </div>
            </div>

            {
                isTxModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-400/10 dark:bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                        <form onSubmit={addTransaction} className="relative bg-white dark:bg-slate-900 rounded-[40px] shadow-premium w-full max-w-md p-10 animate-in zoom-in-95 duration-200 border border-white dark:border-white/10">
                            <header className="mb-8 flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Registro Contable</p>
                                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                                        {modalType === 'income' ? 'Nuevo Ingreso' : modalType === 'investment' ? 'Nueva Inversión' : 'Nuevo Egreso'}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomDate(!showCustomDate)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${showCustomDate ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                >
                                    <span className="material-icons-round text-sm">{showCustomDate ? 'event' : 'event_available'}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">{showCustomDate ? txDate.split('-').reverse().slice(0, 2).join('/') : 'Hoy'}</span>
                                </button>
                            </header>

                            {showCustomDate && (
                                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5 animate-in slide-in-from-top-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Seleccionar Fecha</label>
                                    <input
                                        type="date"
                                        value={txDate}
                                        onChange={(e) => setTxDate(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 rounded-xl p-3 text-xs font-bold text-slate-800 dark:text-white outline-none ring-primary focus:ring-2 transition-all shadow-sm border-none"
                                    />
                                </div>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Monto ($)</label>
                                    <input
                                        name="amount"
                                        type="number"
                                        required
                                        autoFocus
                                        placeholder="0"
                                        className="w-full bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 text-2xl font-black text-slate-800 dark:text-white outline-none ring-primary focus:ring-2 transition-all shadow-inner border-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Concepto / Descripción</label>
                                    <input
                                        name="description"
                                        type="text"
                                        required
                                        placeholder="Ej: Pago de servicios..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none ring-primary focus:ring-2 transition-all shadow-inner border-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Categoría</label>
                                    <select
                                        name="category"
                                        className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-white outline-none ring-primary focus:ring-2 transition-all shadow-inner border-none appearance-none"
                                    >
                                        {modalType === 'expense' && (
                                            <>
                                                <option value="Gastos">Gastos (Sistema)</option>
                                                <option value="Inversión">Inversión (Sistema)</option>
                                            </>
                                        )}
                                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button type="button" onClick={() => setIsTxModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold hover:bg-slate-100 transition-colors">Cancelar</button>
                                <button type="submit" className={`flex-1 py-4 rounded-2xl text-white font-black shadow-lg shadow-primary/20 transition-all active:scale-95 uppercase text-[10px] tracking-widest ${modalType === 'income' ? 'bg-emerald-500' : modalType === 'investment' ? 'bg-indigo-500' : 'bg-rose-500'}`}>
                                    Confirmar {modalType === 'income' ? 'Ingreso' : modalType === 'investment' ? 'Inversión' : 'Gasto'}
                                </button>
                            </div>
                        </form>
                    </div>
                )
            }
        </main >
    );
};
