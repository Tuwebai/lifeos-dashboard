import React, { useMemo } from 'react';
import { FinanceTransaction } from '../types';

interface Props {
    transactions: FinanceTransaction[];
    viewMonth: number;
    viewYear: number;
}

export const FinanceCalendar: React.FC<Props> = ({ transactions, viewMonth, viewYear }) => {
    const calendarDays = useMemo(() => {
        const year = viewYear;
        const month = viewMonth;
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const daysInMonth = lastDay.getDate();
        // Adjust to 0 (Mon) - 6 (Sun)
        let startDayOfWeek = firstDay.getDay() - 1;
        if (startDayOfWeek === -1) startDayOfWeek = 6;

        const days = [];

        // Padding for prev month
        const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDay - i, type: 'prev' });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayTxs = transactions.filter(t => t.date === dateStr);
            const stats = {
                income: dayTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0),
                expense: dayTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0),
                investment: dayTxs.filter(t => t.type === 'investment').reduce((acc, t) => acc + Number(t.amount), 0)
            };
            days.push({ day: i, type: 'current', dateStr, stats });
        }

        // Padding for next month
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, type: 'next' });
        }

        return days;
    }, [transactions, viewMonth, viewYear]);

    return (
        <div className="w-full h-full flex flex-col animate-enter">
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-white/5">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                    <div key={d} className="py-2 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 flex-1 gap-px bg-slate-50 dark:bg-white/5">
                {calendarDays.map((d, i) => (
                    <div key={i} className={`min-h-[80px] p-1.5 flex flex-col gap-1 transition-colors ${d.type === 'current' ? 'bg-white dark:bg-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-white/5' : 'bg-slate-50/30 dark:bg-slate-900/20 opacity-30 pointer-events-none'}`}>
                        <span className={`text-[10px] font-black ${d.type === 'current' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'}`}>{d.day}</span>

                        {d.stats && (d.stats.income > 0 || d.stats.expense > 0 || d.stats.investment > 0) && (
                            <div className="flex flex-col gap-0.5 mt-auto">
                                {d.stats.income > 0 && (
                                    <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                                        <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400">+$</span>
                                        <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400">{d.stats.income.toLocaleString()}</span>
                                    </div>
                                )}
                                {d.stats.expense > 0 && (
                                    <div className="flex justify-between items-center bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                                        <span className="text-[8px] font-black text-rose-600 dark:text-rose-400">-$</span>
                                        <span className="text-[8px] font-black text-rose-600 dark:text-rose-400">{d.stats.expense.toLocaleString()}</span>
                                    </div>
                                )}
                                {d.stats.investment > 0 && (
                                    <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded-md">
                                        <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400">IS</span>
                                        <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400">{d.stats.investment.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
