
import React, { useState, useEffect, useRef } from 'react';
import { CalendarDay, CalendarEventLabel } from '../types';
import { UserProfile } from '../components/UserProfile';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

export const Calendar: React.FC = () => {
    const { user } = useAuth();
    const todayRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Dynamic Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEventLabel[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
    const [isDayViewOpen, setIsDayViewOpen] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEventLabel | null>(null);

    // Form State
    const [eventForm, setEventForm] = useState<Partial<CalendarEventLabel>>({
        text: '',
        description: '',
        time: '',
        color: 'blue'
    });

    const colors: ('purple' | 'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'indigo' | 'gray' | 'emerald' | 'pink')[] =
        ['blue', 'purple', 'green', 'orange', 'red', 'yellow', 'indigo', 'gray', 'emerald', 'pink'];

    useEffect(() => {
        if (user) {
            fetchEvents();
        }
    }, [user, currentDate]);

    const fetchEvents = async () => {
        if (!user) return;
        setLoading(true);
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('user_id', user.id)
            .gte('event_date', startOfMonth)
            .lte('event_date', endOfMonth);

        if (error) {
            console.error('Error fetching events:', error);
        } else {
            const mappedEvents: CalendarEventLabel[] = data.map(item => ({
                id: item.id,
                text: item.title,
                description: item.description,
                time: item.event_time,
                color: item.color as any,
                date: item.event_date
            }));
            setEvents(mappedEvents);
        }
        setLoading(false);
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
        setTimeout(() => {
            todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    const generateDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const daysInMonth = lastDayOfMonth.getDate();
        const startingDayOfWeek = firstDayOfMonth.getDay() || 7; // Adjust to 1 (Mon) - 7 (Sun)

        const calendarDays: CalendarDay[] = [];

        // Previous month days
        const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i > 0; i--) {
            calendarDays.push({ num: lastDayOfPrevMonth - i + 1, type: 'prev' });
        }

        // Current month days
        const now = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = now.getDate() === i && now.getMonth() === month && now.getFullYear() === year;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            calendarDays.push({ num: i, type: 'current', isToday, labels: dayEvents, date: dateStr });
        }

        // Next month days
        const remainingCells = 42 - calendarDays.length;
        for (let i = 1; i <= remainingCells; i++) {
            calendarDays.push({ num: i, type: 'next' });
        }

        return calendarDays;
    };

    const getColorClass = (color: CalendarEventLabel['color'], type: 'bg' | 'text' | 'border' | 'dot' | 'light' = 'bg') => {
        const colorMap: Record<string, any> = {
            purple: { bg: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-500', dot: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-900/30' },
            blue: { bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500', dot: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/30' },
            green: { bg: 'bg-green-500', text: 'text-green-700 dark:text-green-300', border: 'border-green-500', dot: 'bg-green-500', light: 'bg-green-100 dark:bg-green-900/30' },
            orange: { bg: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-500', dot: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-900/30' },
            red: { bg: 'bg-red-500', text: 'text-red-700 dark:text-red-300', border: 'border-red-500', dot: 'bg-red-500', light: 'bg-red-100 dark:bg-red-900/30' },
            yellow: { bg: 'bg-yellow-400', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-500', dot: 'bg-yellow-400', light: 'bg-yellow-100 dark:bg-yellow-900/30' },
            indigo: { bg: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-500', dot: 'bg-indigo-500', light: 'bg-indigo-100 dark:bg-indigo-900/30' },
            gray: { bg: 'bg-gray-500', text: 'text-gray-600 dark:text-gray-300', border: 'border-gray-500', dot: 'bg-gray-500', light: 'bg-gray-100 dark:bg-gray-800' },
            emerald: { bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500', dot: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-900/30' },
            pink: { bg: 'bg-pink-500', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-500', dot: 'bg-pink-500', light: 'bg-pink-100 dark:bg-pink-900/30' },
        };
        const c = colorMap[color] || colorMap.blue;
        if (type === 'bg') return `${c.light} ${c.text}`;
        return c[type];
    };

    const handleDayClick = (day: CalendarDay) => {
        if (day.type !== 'current' || !day.date) return;
        const [y, m, d] = day.date.split('-').map(Number);
        setSelectedDayDate(new Date(y, m - 1, d));
        setIsDayViewOpen(true);
    };

    const handleAddNewEvent = () => {
        setEventForm({
            text: '',
            description: '',
            time: '',
            color: 'blue'
        });
        setSelectedEvent(null);
        setIsEditing(true);
        setIsEventModalOpen(true);
    };

    const handleEventClick = (e: React.MouseEvent, event: CalendarEventLabel) => {
        e.stopPropagation();
        setSelectedEvent(event);
        setEventForm(event);
        setIsEditing(false);
        setIsEventModalOpen(true);
    };

    const handleSaveEvent = async () => {
        if (!user || !eventForm.text || (!selectedDayDate && !eventForm.date)) return;

        const eventDate = eventForm.date || (selectedDayDate?.toISOString().split('T')[0]);

        const payload = {
            user_id: user.id,
            title: eventForm.text,
            description: eventForm.description,
            event_time: eventForm.time,
            color: eventForm.color,
            event_date: eventDate
        };

        if (selectedEvent?.id) {
            const { error } = await supabase
                .from('calendar_events')
                .update(payload)
                .eq('id', selectedEvent.id);
            if (error) console.error(error);
        } else {
            const { error } = await supabase
                .from('calendar_events')
                .insert([payload]);
            if (error) console.error(error);
        }

        setIsEventModalOpen(false);
        fetchEvents();
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent?.id) return;
        const { error } = await supabase
            .from('calendar_events')
            .delete()
            .eq('id', selectedEvent.id);

        if (error) console.error(error);
        setIsEventModalOpen(false);
        fetchEvents();
    };

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <main className="flex-1 flex flex-col gap-4 h-full overflow-hidden px-4 md:px-0 pt-20 md:pt-4 pb-20 md:pb-4 relative">
            <header className="flex flex-col md:flex-row justify-between items-center md:items-center gap-4 mb-4 animate-enter relative z-30" style={{ animationDelay: '0s' }}>
                <div className="w-full md:w-auto text-center md:text-left">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Calendario</h2>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-1">Organiza tu agenda y eventos</p>
                </div>
                <div className="flex items-center gap-3 self-center md:self-auto">
                    <button
                        onClick={handleAddNewEvent}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-xl shadow-glow transition-all active:scale-95"
                    >
                        <span className="material-icons-round text-sm">add</span>
                        <span className="hidden sm:inline font-medium">Nuevo Evento</span>
                    </button>
                    <UserProfile />
                </div>
            </header>

            <div className="flex-1 bg-card-light dark:bg-card-dark rounded-2xl shadow-soft overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800/50 animate-enter relative z-0" style={{ animationDelay: '0.1s' }}>
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white min-w-[160px]">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h3>
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button onClick={handlePrevMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors text-slate-500 dark:text-slate-400">
                                <span className="material-icons-round">chevron_left</span>
                            </button>
                            <button onClick={handleNextMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-colors text-slate-500 dark:text-slate-400">
                                <span className="material-icons-round">chevron_right</span>
                            </button>
                        </div>
                        <button onClick={handleToday} className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Hoy</button>
                    </div>
                </div>

                <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                        <div key={d} className="py-3 text-center text-[10px] md:text-xs font-semibold uppercase text-text-secondary-light dark:text-text-secondary-dark tracking-wider">{d}</div>
                    ))}
                </div>

                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                    <div className="grid grid-cols-7 min-h-full auto-rows-fr bg-slate-100 dark:bg-slate-800 gap-px border-b border-slate-100 dark:border-slate-800">
                        {generateDays().map((d, i) => {
                            const isPrevNext = d.type !== 'current';
                            const dateClass = isPrevNext ? "text-slate-300 dark:text-slate-600" : "text-slate-700 dark:text-slate-300";
                            const cellBgClass = d.isToday ? "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/30 ring-1 ring-blue-500/20 dark:ring-blue-400/20 shadow-inner" : "bg-card-light dark:bg-card-dark";
                            const hoverClass = isPrevNext ? "" : "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer";
                            const labels = d.labels || [];

                            return (
                                <div key={i} ref={d.isToday ? todayRef : null} onClick={() => handleDayClick(d)} className={`${cellBgClass} p-1 md:p-2 min-h-[80px] md:min-h-[120px] relative group ${hoverClass} flex flex-col gap-1`}>
                                    <div className="flex justify-center md:justify-start">
                                        {d.isToday ? (
                                            <div className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center bg-primary rounded-full text-white text-xs md:text-sm font-bold shadow-lg shadow-blue-500/40 mb-1 z-10">{d.num}</div>
                                        ) : (
                                            <span className={`text-xs md:text-sm font-medium ${dateClass}`}>{d.num}</span>
                                        )}
                                    </div>
                                    <div className="hidden md:flex flex-col gap-1 relative z-10">
                                        {labels.slice(0, 3).map((l, idx) => (
                                            <div key={idx} onClick={(e) => handleEventClick(e, l)} className={`px-2 py-0.5 text-[10px] rounded-md font-bold truncate cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shadow-sm ${getColorClass(l.color, 'bg')}`}>
                                                {l.time && <span className="mr-1 opacity-70 font-medium">{l.time}</span>}
                                                {l.text}
                                            </div>
                                        ))}
                                        {labels.length > 3 && <div className="text-[9px] font-black text-slate-400 pl-1">+{labels.length - 3} más</div>}
                                    </div>
                                    <div className="flex md:hidden flex-wrap gap-1 justify-center content-start relative z-10">
                                        {labels.map((l, idx) => (
                                            <div key={idx} className={`w-1.5 h-1.5 rounded-full ${getColorClass(l.color, 'dot')}`}></div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Day View Modal */}
            {isDayViewOpen && selectedDayDate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-400/10 dark:bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-premium overflow-hidden animate-in zoom-in-95 duration-200 border border-white dark:border-white/10">
                        <header className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center text-slate-800 dark:text-white">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary opacity-80 mb-1">Agenda del día</p>
                                <h3 className="text-xl font-black capitalize">
                                    {selectedDayDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </h3>
                            </div>
                            <button onClick={() => setIsDayViewOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center transition-colors">
                                <span className="material-icons-round text-slate-400">close</span>
                            </button>
                        </header>

                        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                {events.filter(e => e.date === selectedDayDate.toISOString().split('T')[0])
                                    .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'))
                                    .length > 0 ? (
                                    events.filter(e => e.date === selectedDayDate.toISOString().split('T')[0])
                                        .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'))
                                        .map((event) => (
                                            <div
                                                key={event.id}
                                                onClick={(e) => handleEventClick(e, event)}
                                                className={`p-4 rounded-2xl border-l-4 ${getColorClass(event.color, 'bg')} ${getColorClass(event.color, 'border')} cursor-pointer hover:translate-x-1 transition-transform sm:p-5`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                                                        {event.time || 'Sin horario'}
                                                    </span>
                                                    <span className="material-icons-round text-sm opacity-50">visibility</span>
                                                </div>
                                                <h4 className="font-bold text-slate-800 dark:text-white capitalize text-sm sm:text-base">{event.text}</h4>
                                                {event.description && <p className="text-xs mt-1 opacity-70 line-clamp-2 leading-relaxed">{event.description}</p>}
                                            </div>
                                        ))
                                ) : (
                                    <div className="text-center py-10">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <span className="material-icons-round text-3xl">event_busy</span>
                                        </div>
                                        <p className="text-slate-500 font-bold text-sm">No hay eventos para hoy</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                            <button
                                onClick={() => { setIsDayViewOpen(false); handleAddNewEvent(); }}
                                className="px-6 py-4 bg-primary text-white font-black rounded-2xl shadow-glow active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center gap-2"
                            >
                                <span className="material-icons-round text-base">add</span>
                                Nuevo Evento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Detail/Edit Modal */}
            {isEventModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-400/10 dark:bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-premium overflow-hidden animate-in zoom-in-95 duration-200 border border-white dark:border-white/10">
                        <header className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                {selectedEvent && !isEditing && (
                                    <div className={`w-3 h-3 rounded-full ${getColorClass(selectedEvent.color, 'dot')}`}></div>
                                )}
                                <h3 className="text-xl font-black text-slate-800 dark:text-white capitalize">
                                    {isEditing ? (selectedEvent ? 'Editar Evento' : 'Nuevo Evento') : 'Detalles del Evento'}
                                </h3>
                            </div>
                            <button onClick={() => setIsEventModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                <span className="material-icons-round text-slate-400">close</span>
                            </button>
                        </header>

                        <div className="p-8">
                            {isEditing ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Título del Evento</label>
                                        <input
                                            type="text"
                                            value={eventForm.text}
                                            onChange={(e) => setEventForm({ ...eventForm, text: e.target.value })}
                                            placeholder="Nombre del evento..."
                                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-800 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-primary transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Hora</label>
                                            <input
                                                type="time"
                                                value={eventForm.time}
                                                onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                                                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-800 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-primary transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Fecha</label>
                                            <input
                                                type="date"
                                                value={eventForm.date || (selectedDayDate?.toISOString().split('T')[0])}
                                                onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                                                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-800 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-primary transition-all text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Descripción</label>
                                        <textarea
                                            value={eventForm.description}
                                            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                            placeholder="Detalles sobre el evento..."
                                            rows={3}
                                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-800 dark:text-white font-medium outline-none ring-2 ring-transparent focus:ring-primary transition-all resize-none leading-relaxed"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Color de Etiqueta</label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {colors.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setEventForm({ ...eventForm, color })}
                                                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all ${getColorClass(color, 'dot')} border-4 ${eventForm.color === color ? 'border-primary ring-4 ring-primary/20 scale-110' : 'border-transparent hover:scale-105'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl ${selectedEvent ? getColorClass(selectedEvent.color, 'light') : ''} flex items-center justify-center`}>
                                            <span className={`material-icons-round ${selectedEvent ? getColorClass(selectedEvent.color, 'text') : ''}`}>event</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Título</p>
                                            <h4 className="text-xl font-bold text-slate-800 dark:text-white capitalize">{selectedEvent?.text}</h4>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center">
                                                <span className="material-icons-round text-sm text-slate-400">schedule</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Horario</p>
                                                <p className="font-bold text-sm text-slate-700 dark:text-slate-300">{selectedEvent?.time || 'No especificado'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center">
                                                <span className="material-icons-round text-sm text-slate-400">calendar_today</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Fecha</p>
                                                <p className="font-bold text-sm text-slate-700 dark:text-slate-300 capitalize">
                                                    {selectedEvent?.date ? new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedEvent?.description && (
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center flex-shrink-0">
                                                <span className="material-icons-round text-sm text-slate-400">description</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripción</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{selectedEvent.description}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <footer className="p-8 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 h-24">
                            {!isEditing ? (
                                <>
                                    <button
                                        onClick={handleDeleteEvent}
                                        className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/20 px-4 py-3 rounded-xl transition-colors active:scale-95"
                                    >
                                        <span className="material-icons-round text-sm">delete</span>
                                        Eliminar
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-glow active:scale-95 transition-all text-[10px] uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <span className="material-icons-round text-base">edit</span>
                                        Editar Evento
                                    </button>
                                </>
                            ) : (
                                <div className="flex gap-4 ml-auto">
                                    <button
                                        onClick={() => selectedEvent ? setIsEditing(false) : setIsEventModalOpen(false)}
                                        className="px-6 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveEvent}
                                        className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-glow active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                                    >
                                        {selectedEvent ? 'Guardar Cambios' : 'Crear Evento'}
                                    </button>
                                </div>
                            )}
                        </footer>
                    </div>
                </div>
            )}
        </main>
    );
};
