import React, { useState } from 'react';
import { UserProfile } from '../components/UserProfile';
import { useSettings } from '../context/SettingsContext';

// --- Weather Components ---

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
    const stars = Array.from({ length: 30 }).map((_, i) => ({
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

const CloudsEffect = ({ night = false }) => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
            <div className={`absolute top-10 left-[-10%] w-64 h-32 rounded-full blur-3xl animate-float-cloud ${night ? 'bg-slate-400' : 'bg-white'}`} style={{ animationDuration: '15s' }} />
            <div className={`absolute bottom-10 right-[-10%] w-80 h-40 rounded-full blur-3xl animate-float-cloud-reverse ${night ? 'bg-slate-500' : 'bg-white'}`} style={{ animationDuration: '20s' }} />
        </div>
    );
};

const RainEffect = ({ intensity = 'medium', color = '#93c5fd' }) => {
    const count = intensity === 'heavy' ? 40 : 20;
    const drops = Array.from({ length: count }).map((_, i) => ({
        left: `${Math.random() * 100}%`,
        delay: `${Math.random()}s`,
        duration: `${0.5 + Math.random() * 0.5}s`
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
    <div className="relative w-24 h-24 flex items-center justify-center animate-float">
        <div className="w-16 h-16 bg-yellow-400 rounded-full shadow-[0_0_40px_rgba(250,204,21,0.6)] border-4 border-yellow-200"></div>
        <div className="absolute inset-0 animate-spin-slow">
            {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                <div key={deg} className="absolute top-1/2 left-1/2 w-2 h-6 bg-yellow-300 rounded-full -translate-x-1/2 -translate-y-[50px]"
                    style={{ transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-40px)` }}
                />
            ))}
        </div>
    </div>
);

const MoonIcon = () => (
    <div className="relative w-24 h-24 flex items-center justify-center animate-float-delayed">
        <div className="w-16 h-16 bg-slate-100 rounded-full shadow-[0_0_30px_rgba(241,245,249,0.4)] relative overflow-hidden">
            <div className="absolute top-2 right-2 w-4 h-4 bg-slate-300 rounded-full opacity-40"></div>
            <div className="absolute bottom-4 left-4 w-3 h-3 bg-slate-300 rounded-full opacity-30"></div>
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-slate-300 rounded-full opacity-20"></div>
        </div>
        <div className="absolute inset-[-10px] rounded-full border border-slate-400/20 animate-pulse"></div>
    </div>
);

const CloudIcon = ({ color = 'white' }) => (
    <div className="relative w-24 h-20 flex items-center justify-center animate-float">
        <div className={`w-16 h-8 rounded-full ${color === 'white' ? 'bg-white shadow-lg' : 'bg-slate-400 shadow-md'} z-10 bottom-0`}></div>
        <div className={`absolute bottom-4 left-4 w-10 h-10 rounded-full ${color === 'white' ? 'bg-white' : 'bg-slate-400'} z-20`}></div>
        <div className={`absolute bottom-4 right-6 w-8 h-8 rounded-full ${color === 'white' ? 'bg-white' : 'bg-slate-400'} z-10`}></div>
    </div>
);

const StormIcon = () => (
    <div className="relative w-24 h-24 flex items-center justify-center animate-float">
        <CloudIcon color="slate" />
        <svg className="absolute w-10 h-10 text-yellow-300 z-30 bottom-[-5px] left-6 animate-lightning-flash drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 2v11h3v9l7-12h-4l4-8z" />
        </svg>
    </div>
);

// --- Weather Card Template ---

interface WeatherCardProps {
    type: string;
    isNight: boolean;
    temp: number;
    description: string;
    humidity: number;
    wind: number;
    location: string;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ type, isNight, temp, description, humidity, wind, location }) => {
    const getTheme = () => {
        if (isNight) {
            if (type === 'storm') return 'from-slate-800 via-indigo-950 to-slate-900';
            if (type === 'rain') return 'from-slate-900 via-blue-950 to-slate-900';
            if (type === 'cloudy') return 'from-slate-800 via-slate-900 to-black';
            return 'from-indigo-900 via-slate-900 to-black'; // Clear Night
        } else {
            if (type === 'storm') return 'from-slate-600 via-slate-800 to-slate-900';
            if (type === 'rain') return 'from-blue-400 via-blue-600 to-blue-800';
            if (type === 'cloudy') return 'from-slate-300 via-slate-500 to-slate-700';
            return 'from-blue-400 via-blue-500 to-cyan-500'; // Clear Day
        }
    };

    const renderIcon = () => {
        if (type === 'storm') return <StormIcon />;
        if (type === 'rain' || type === 'drizzle') return <CloudIcon color={isNight ? 'slate' : 'white'} />;
        if (type === 'cloudy') return <CloudIcon color={isNight ? 'slate' : 'white'} />;
        return isNight ? <MoonIcon /> : <SunIcon />;
    };

    const renderEffects = () => {
        return (
            <>
                {!isNight && type === 'clear' && <SunRays />}
                {isNight && <Stars />}
                {(type === 'cloudy' || type === 'storm' || type === 'rain') && <CloudsEffect night={isNight} />}
                {type === 'rain' && <RainEffect intensity="heavy" color={isNight ? '#3b82f6' : '#93c5fd'} />}
                {type === 'drizzle' && <RainEffect intensity="light" color={isNight ? '#60a5fa' : '#bfdbfe'} />}
                {type === 'storm' && (
                    <>
                        <div className="absolute inset-0 bg-white animate-lightning z-0 mix-blend-overlay"></div>
                        <RainEffect intensity="heavy" color="#93c5fd" />
                    </>
                )}
            </>
        );
    };

    return (
        <div className="relative rounded-[32px] p-0 shadow-premium hover:shadow-glow transition-all duration-500 overflow-hidden group min-h-[350px]">
            <div className={`absolute inset-0 bg-gradient-to-br ${getTheme()} z-0 transition-all duration-700`}></div>
            {renderEffects()}

            <div className="relative z-10 p-10 flex flex-col justify-between h-full text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-icons-round text-sm opacity-80">location_on</span>
                            <span className="text-sm font-medium tracking-wide opacity-90">{location}</span>
                        </div>
                        <h3 className="text-6xl font-black mt-2 tracking-tighter">{temp}°C</h3>
                    </div>
                    <div className="mr-2">
                        {renderIcon()}
                    </div>
                </div>

                <div className="flex items-end justify-between mt-8">
                    <div>
                        <p className="font-bold text-2xl flex items-center gap-2">
                            {description}
                            {type === 'storm' && <span className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_10px_#facc15]"></span>}
                            {type === 'clear' && !isNight && <span className="w-3 h-3 bg-white rounded-full animate-ping shadow-[0_0_10px_white]"></span>}
                        </p>
                        <div className="flex gap-6 mt-4 text-sm opacity-80 font-medium tracking-wide">
                            <span className="flex items-center gap-2"><span className="material-icons-round text-base">water_drop</span> {humidity}%</span>
                            <span className="flex items-center gap-2"><span className="material-icons-round text-base">air</span> {wind} km/h</span>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">{isNight ? 'Noche' : 'Día'}</span>
                        <p className="text-sm opacity-60 font-bold tracking-widest uppercase">H: {temp + 3}° L: {temp - 4}°</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Debug Page ---

export const Debug: React.FC = () => {
    const { settings } = useSettings();
    const [filter, setFilter] = useState<'all' | 'day' | 'night'>('all');

    const weatherVariations = [
        { type: 'clear', isNight: false, temp: 32, description: 'Cielo Despejado', humidity: 24, wind: 12 },
        { type: 'clear', isNight: true, temp: 22, description: 'Noche Clara', humidity: 45, wind: 8 },
        { type: 'cloudy', isNight: false, temp: 24, description: 'Parcialmente Nublado', humidity: 55, wind: 15 },
        { type: 'cloudy', isNight: true, temp: 18, description: 'Noche Nublada', humidity: 62, wind: 10 },
        { type: 'rain', isNight: false, temp: 20, description: 'Lluvia Moderada', humidity: 88, wind: 18 },
        { type: 'rain', isNight: true, temp: 16, description: 'Lluvia Nocturna', humidity: 92, wind: 14 },
        { type: 'drizzle', isNight: false, temp: 22, description: 'Llovizna Ligera', humidity: 75, wind: 5 },
        { type: 'storm', isNight: false, temp: 18, description: 'Tormenta Eléctrica', humidity: 98, wind: 24 },
        { type: 'storm', isNight: true, temp: 14, description: 'Tempestad Nocturna', humidity: 99, wind: 30 },
    ];

    const filteredWeather = weatherVariations.filter(w =>
        filter === 'all' ? true : (filter === 'day' ? !w.isNight : w.isNight)
    );

    return (
        <main className="flex-1 flex flex-col gap-6 h-full overflow-y-auto px-4 md:px-6 pt-20 md:pt-4 pb-20 relative">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 pl-12 md:pl-0 animate-enter relative z-30">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-2xl">
                            <span className="material-icons-round text-primary text-3xl">smart_toy</span>
                        </div>
                        Laboratorio Visual
                    </h2>
                    <p className="text-slate-500 font-medium text-sm mt-1 ml-14 md:ml-0">Explorando variaciones de clima dinámicas.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl self-end md:self-auto">
                    {(['all', 'day', 'night'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white dark:bg-slate-700 shadow-sm text-primary scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {f === 'all' ? 'Todo' : f === 'day' ? 'Día' : 'Noche'}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8 animate-enter">
                {filteredWeather.map((w, i) => (
                    <WeatherCard key={i} {...w} location={settings.location} />
                ))}
            </div>

            <style>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                .animate-twinkle {
                    animation: twinkle 3s infinite ease-in-out;
                }
                @keyframes float-cloud {
                    0% { transform: translateX(-20px) translateY(0); }
                    50% { transform: translateX(20px) translateY(-10px); }
                    100% { transform: translateX(-20px) translateY(0); }
                }
                .animate-float-cloud {
                    animation: float-cloud linear infinite;
                }
                @keyframes float-cloud-reverse {
                    0% { transform: translateX(20px) translateY(0); }
                    50% { transform: translateX(-20px) translateY(10px); }
                    100% { transform: translateX(20px) translateY(0); }
                }
                .animate-float-cloud-reverse {
                    animation: float-cloud-reverse linear infinite;
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 15s linear infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float {
                    animation: float 4s infinite ease-in-out;
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                .animate-float-delayed {
                    animation: float-delayed 6s infinite ease-in-out;
                }
                @keyframes rain {
                    from { transform: translateY(-100px); opacity: 0; }
                    50% { opacity: 1; }
                    to { transform: translateY(250px); opacity: 0; }
                }
                .animate-rain {
                    animation: rain linear infinite;
                    width: 2px;
                    height: 25px;
                    position: absolute;
                }
                @keyframes lightning {
                    0%, 95%, 98% { opacity: 0; }
                    96%, 99% { opacity: 0.15; }
                }
                .animate-lightning {
                    animation: lightning 5s infinite;
                }
                @keyframes lightning-flash {
                    0%, 90% { opacity: 0; transform: scale(0.8); }
                    92% { opacity: 1; transform: scale(1.1); }
                    94% { opacity: 0; }
                    100% { opacity: 0; }
                }
                .animate-lightning-flash {
                    animation: lightning-flash 6s infinite;
                }
            `}</style>
        </main>
    );
};
