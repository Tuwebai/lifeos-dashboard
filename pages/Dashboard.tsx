import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from '../components/UserProfile';
import { useSettings } from '../context/SettingsContext';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { fetchWeather } from '../services/weather';

// --- Sub-Components (Weather Visuals) ---

const SunRays = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] animate-spin-slow opacity-20"
            style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(253,224,71,0.3) 10%, transparent 20%, rgba(253,224,71,0.3) 30%, transparent 40%, rgba(253,224,71,0.3) 50%, transparent 60%, rgba(253,224,71,0.3) 70%, transparent 80%, rgba(253,224,71,0.3) 90%, transparent)',
                animationDuration: '20s'
            }}
        />
    </div>
);

const Stars = () => {
    const stars = Array.from({ length: 20 }).map((_, i) => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 3}s`,
        size: Math.random() * 2 + 1
    }));
    return (
        <div className="absolute inset-0 pointer-events-none">
            {stars.map((s, i) => (
                <div key={i} className="absolute bg-white rounded-full animate-twinkle"
                    style={{
                        top: s.top,
                        left: s.left,
                        width: s.size,
                        height: s.size,
                        animationDelay: s.delay
                    }}
                />
            ))}
        </div>
    );
};

const CloudsEffect = ({ night = false }) => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className={`absolute top-5 left-[-5%] w-48 h-24 rounded-full blur-3xl animate-float-cloud ${night ? 'bg-slate-400' : 'bg-white'}`} style={{ animationDuration: '12s' }} />
        <div className={`absolute bottom-5 right-[-5%] w-64 h-32 rounded-full blur-3xl animate-float-cloud-reverse ${night ? 'bg-slate-500' : 'bg-white'}`} style={{ animationDuration: '18s' }} />
    </div>
);

const RainEffect = ({ intensity = 'medium', color = '#93c5fd' }) => {
    const count = intensity === 'heavy' ? 30 : 15;
    const drops = Array.from({ length: count }).map((_, i) => ({
        left: `${Math.random() * 100}%`,
        delay: `${Math.random()}s`,
        duration: `${0.6 + Math.random() * 0.4}s`
    }));
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {drops.map((s, i) => (
                <div key={i} className="animate-rain"
                    style={{
                        left: s.left,
                        animationDelay: s.delay,
                        animationDuration: s.duration,
                        background: `linear-gradient(to bottom, transparent, ${color})`
                    }}
                />
            ))}
        </div>
    );
};

// --- Weather Icons ---

const SunIcon = () => (
    <div className="relative w-16 h-16 flex items-center justify-center animate-float">
        <div className="w-10 h-10 bg-yellow-400 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.6)]"></div>
    </div>
);

const MoonIcon = () => (
    <div className="relative w-16 h-16 flex items-center justify-center animate-float-delayed">
        <div className="w-10 h-10 bg-slate-100 rounded-full shadow-[0_0_20px_rgba(241,245,249,0.4)]"></div>
    </div>
);

const CloudIcon = ({ color = 'white' }) => (
    <div className="relative w-16 h-12 flex items-center justify-center animate-float">
        <div className={`w-10 h-5 rounded-full ${color === 'white' ? 'bg-white shadow-lg' : 'bg-slate-400 shadow-md'} z-10`}></div>
        <div className={`absolute bottom-3 left-2 w-6 h-6 rounded-full ${color === 'white' ? 'bg-white' : 'bg-slate-400'} z-20`}></div>
    </div>
);

const StormIcon = () => (
    <div className="relative w-16 h-16 flex items-center justify-center animate-float">
        <CloudIcon color="slate" />
        <span className="material-icons-round text-yellow-300 absolute bottom-[-2px] left-4 z-30 animate-lightning-flash">bolt</span>
    </div>
);

// --- Stats and Quote Components ---

const MetricCard = ({ title, value, subtext, icon, color, delay }: any) => (
    <div
        className="bg-card-light dark:bg-card-dark rounded-2xl p-5 shadow-soft hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-800 animate-enter opacity-0"
        style={{ animationDelay: delay, animationFillMode: 'forwards' }}
    >
        <div className="flex justify-between items-start">
            <div className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-500 mb-4`}>
                <span className="material-icons-round text-2xl">{icon}</span>
            </div>
        </div>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{value}</h3>
        <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{title}</p>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
);

const QuotesSlider = () => {
    const { settings } = useSettings();
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (settings.quotes.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % settings.quotes.length);
        }, 3500);
        return () => clearInterval(interval);
    }, [settings.quotes]);

    if (!settings.quotes || settings.quotes.length === 0) {
        return (
            <div className="flex items-center justify-center h-full opacity-30 text-center px-6">
                <p className="text-sm font-medium italic">Configura tus frases en ajustes para verlas aquí.</p>
            </div>
        );
    }

    const currentQuote = settings.quotes[currentIndex];

    return (
        <div className="relative h-full w-full flex flex-col justify-center overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-icons-round text-6xl text-primary">format_quote</span>
            </div>
            <div key={currentIndex} className="animate-enter flex flex-col items-center text-center px-4" style={{ animationName: 'slideLeft', animationDuration: '0.8s' }}>
                <p className="text-xl font-medium text-slate-700 dark:text-slate-200 italic leading-relaxed mb-4">"{currentQuote.text}"</p>
                <p className="text-sm font-black text-primary uppercase tracking-widest">— {currentQuote.author}</p>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1.5 pb-2">
                {settings.quotes.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${currentIndex === i ? 'bg-primary w-4' : 'bg-slate-200 dark:bg-slate-700'}`} />
                ))}
            </div>
        </div>
    );
};

// --- Main Page ---

export const Dashboard: React.FC = () => {
    const { settings } = useSettings();
    const { user } = useAuth();
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [todayCount, setTodayCount] = useState(0);
    const [stats, setStats] = useState({ pendingTasks: 0, pendingWork: 0, completedTasks: 0 });
    const [weather, setWeather] = useState<any>(null);

    const formatSupabaseDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        return { month: months[date.getMonth()], day: date.getDate() };
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            const today = new Date().toISOString().split('T')[0];

            // Events
            const { data: upcomingData } = await supabase.from('calendar_events').select('*').eq('user_id', user.id).gte('event_date', today).order('event_date').limit(5);
            if (upcomingData) {
                setUpcomingEvents(upcomingData.map(e => ({ ...e, ...formatSupabaseDate(e.event_date), location: 'Remoto' })));
            }

            const { count: tCount } = await supabase.from('calendar_events').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('event_date', today);
            setTodayCount(tCount || 0);

            // Stats
            const { count: pendingT } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', false);
            const { count: pendingW } = await supabase.from('work_projects').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pending');
            const { count: completedT } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true);
            setStats({ pendingTasks: pendingT || 0, pendingWork: pendingW || 0, completedTasks: completedT || 0 });

            // Weather Fetch (Using centralized service with global key)
            if (settings.location) {
                const weatherData = await fetchWeather(settings.location);
                if (weatherData) setWeather(weatherData);
            }
        };
        fetchData();
    }, [user, settings.location]);

    const renderWeatherIcon = () => {
        if (!weather) return <StormIcon />;
        if (weather.type === 'storm') return <StormIcon />;
        if (weather.type === 'rain' || weather.type === 'drizzle' || weather.type === 'cloudy') return <CloudIcon color={weather.isNight ? 'slate' : 'white'} />;
        return weather.isNight ? <MoonIcon /> : <SunIcon />;
    };

    const weatherBg = useMemo(() => {
        if (!weather) return 'from-slate-600 to-slate-800';
        if (weather.isNight) {
            if (weather.type === 'storm') return 'from-slate-800 to-indigo-950';
            if (weather.type === 'rain') return 'from-slate-900 to-blue-950';
            return 'from-indigo-950 to-black';
        }
        if (weather.type === 'storm') return 'from-slate-600 to-slate-900';
        if (weather.type === 'rain') return 'from-blue-500 to-blue-800';
        if (weather.type === 'cloudy') return 'from-slate-400 to-slate-600';
        return 'from-blue-400 to-cyan-500';
    }, [weather]);

    return (
        <main className="flex-1 flex flex-col gap-6 h-full overflow-y-auto px-4 md:px-2 pt-20 md:pt-2 pb-2 scroll-smooth">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 animate-enter relative z-30">
                <div className="text-left pl-14 md:pl-0">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        Buenos días, {settings.name} <span className="animate-bounce">👋</span>
                    </h2>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-1">Aquí está tu resumen diario.</p>
                </div>
                <UserProfile />
            </header>

            <div className="flex flex-col gap-8 pb-24 md:pb-8 relative z-0">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard title="Tareas pendientes" value={stats.pendingTasks} subtext={stats.pendingTasks > 0 ? "Por hacer" : "Todo al día"} icon="assignment_late" color="orange" delay="0.1s" />
                    <MetricCard title="Proyectos activos" value={stats.pendingWork} subtext={stats.pendingWork > 0 ? "En proceso" : "Sin actividad"} icon="pending_actions" color="blue" delay="0.2s" />
                    <MetricCard title="Eventos hoy" value={todayCount} subtext={todayCount > 0 ? `${todayCount} compromisos` : "Día despejado"} icon="event" color="purple" delay="0.3s" />
                    <MetricCard title="Total completado" value={stats.completedTasks} subtext="Gran progreso" icon="task_alt" color="emerald" delay="0.4s" />
                </div>

                {/* Inspiration & Weather */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-card-light dark:bg-card-dark rounded-2xl p-6 shadow-soft hover:shadow-glow transition-all duration-300 border border-slate-100 dark:border-slate-800 animate-enter opacity-0 min-h-[240px]" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                        <QuotesSlider />
                    </div>

                    <div className={`relative rounded-2xl p-0 shadow-soft hover:shadow-glow transition-all duration-500 overflow-hidden group min-h-[240px] animate-enter opacity-0`} style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${weatherBg} z-0 transition-colors duration-1000`}></div>
                        {weather ? (
                            <>
                                {!weather.isNight && weather.type === 'clear' && <SunRays />}
                                {weather.isNight && <Stars />}
                                {(weather.type === 'cloudy' || weather.type === 'storm' || weather.type === 'rain') && <CloudsEffect night={weather.isNight} />}
                                {(weather.type === 'rain' || weather.type === 'storm') && <RainEffect intensity="heavy" />}
                                {weather.type === 'drizzle' && <RainEffect intensity="light" />}
                                {weather.type === 'storm' && <div className="absolute inset-0 bg-white animate-lightning z-0 mix-blend-overlay"></div>}

                                <div className="relative z-10 p-8 flex flex-col justify-between h-full text-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="material-icons-round text-sm opacity-80">location_on</span>
                                                <span className="text-sm font-medium tracking-wide opacity-90">{settings.location}</span>
                                            </div>
                                            <h3 className="text-5xl font-black mt-2 tracking-tighter">{weather.temp}°C</h3>
                                        </div>
                                        <div className="mr-2 scale-125">{renderWeatherIcon()}</div>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="font-bold text-xl flex items-center gap-2">{weather.text}{weather.type === 'storm' && <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_#facc15]"></span>}</p>
                                            <div className="flex gap-4 mt-3 text-xs opacity-80 font-bold tracking-wide">
                                                <span className="flex items-center gap-1.5"><span className="material-icons-round text-sm">water_drop</span> {weather.humidity}%</span>
                                                <span className="flex items-center gap-1.5"><span className="material-icons-round text-sm">air</span> {weather.wind} km/h</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">{weather.isNight ? 'Noche' : 'Día'}</span>
                                            <p className="text-xs font-bold tracking-widest opacity-60">H: {weather.temp + 2}° L: {weather.temp - 3}°</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="relative z-10 p-8 flex flex-col items-center justify-center h-full text-white opacity-40">
                                <span className="material-icons-round animate-spin mb-2">sync</span>
                                <p className="text-xs font-bold tracking-widest uppercase">Cargando Clima...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Agenda */}
                <div className="bg-card-light dark:bg-card-dark rounded-2xl p-6 shadow-soft border border-slate-100 dark:border-slate-800 animate-enter opacity-0 w-full" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2"><span className="material-icons-round text-primary">event</span>Agenda Próxima</div>
                        <Link to="/calendar" className="text-xs font-bold text-primary hover:underline">Ver todo</Link>
                    </h3>
                    <div className="flex flex-col gap-4 max-h-[400px] overflow-auto pr-2 custom-scrollbar">
                        {upcomingEvents.length > 0 ? upcomingEvents.map((e) => (
                            <div key={e.id} className="flex items-center gap-4 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                                <div className={`w-12 h-12 rounded-xl bg-${e.color}-50 dark:bg-${e.color}-900/20 text-${e.color}-600 dark:text-${e.color}-400 flex flex-col items-center justify-center flex-shrink-0`}>
                                    <span className="text-[9px] font-bold uppercase">{e.month}</span>
                                    <span className="text-lg font-bold leading-none">{e.day}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary transition-colors">{e.title}</h4>
                                    <p className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1"><span className="material-icons-round text-[10px]">schedule</span>{e.time}</span>
                                        <span className="flex items-center gap-1"><span className="material-icons-round text-[10px]">place</span>{e.location}</span>
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <div className="py-10 flex flex-col items-center justify-center opacity-30"><p className="text-sm">No hay eventos próximos.</p></div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideLeft { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
                .animate-twinkle { animation: twinkle 3s infinite; }
                @keyframes float-cloud { from { transform: translateX(-10px); } to { transform: translateX(10px); } }
                .animate-float-cloud { animation: float-cloud 10s infinite alternate linear; }
                .animate-float-cloud-reverse { animation: float-cloud 15s infinite alternate-reverse linear; }
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 20s linear infinite; }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
                .animate-float { animation: float 4s infinite ease-in-out; }
                @keyframes float-delayed { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
                .animate-float-delayed { animation: float-delayed 6s infinite ease-in-out; }
                @keyframes rain { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(150px); opacity: 1; } }
                .animate-rain { animation: rain 0.8s linear infinite; width: 1.5px; height: 15px; position: absolute; }
                @keyframes lightning { 0%, 95%, 98% { opacity: 0; } 96%, 99% { opacity: 0.1; } }
                .animate-lightning { animation: lightning 5s infinite; }
                @keyframes lightning-flash { 0%, 90% { opacity: 0; } 92% { opacity: 1; } 94% { opacity: 0; } 100% { opacity: 0; } }
                .animate-lightning-flash { animation: lightning-flash 5s infinite; }
            `}</style>
        </main>
    );
};
