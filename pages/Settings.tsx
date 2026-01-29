import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { UserProfile } from '../components/UserProfile';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { FinanceCategory } from '../types';

export const Settings: React.FC = () => {
    const { user, signOut, updatePassword } = useAuth();
    const { settings, updateSettings, addQuote, deleteQuote } = useSettings();
    const [name, setName] = useState(settings.name);
    const [location, setLocation] = useState(settings.location);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [newQuoteText, setNewQuoteText] = useState('');
    const [newQuoteAuthor, setNewQuoteAuthor] = useState('');

    const [financePasswordEnabled, setFinancePasswordEnabled] = useState(settings.finance_password_enabled || false);
    const [financePassword, setFinancePassword] = useState(settings.finance_password || '');
    const [categories, setCategories] = useState<FinanceCategory[]>([]);
    const [newCatName, setNewCatName] = useState('');
    const [newCatIcon, setNewCatIcon] = useState('category');
    const [newCatColor, setNewCatColor] = useState('#3b82f6');
    const [financeRatioLimit, setFinanceRatioLimit] = useState(settings.finance_ratio_limit || 30);
    const [showFinancePassword, setShowFinancePassword] = useState(false);

    // Account Password State
    const [accountPassword, setAccountPassword] = useState('');
    const [passwordMsg, setPasswordMsg] = useState('');

    const handleUpdatePassword = async () => {
        if (!accountPassword || accountPassword.length < 6) {
            setPasswordMsg('Error: La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        setIsSaving(true);
        setPasswordMsg('');
        try {
            await updatePassword(accountPassword);
            setPasswordMsg('Contraseña actualizada correctamente.');
            setAccountPassword('');
            setTimeout(() => setPasswordMsg(''), 3000);
        } catch (error: any) {
            console.error(error);
            setPasswordMsg('Error: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Update local state when settings change (e.g. on initial load from DB)
    useEffect(() => {
        setName(settings.name);
        setLocation(settings.location);
        setFinancePasswordEnabled(settings.finance_password_enabled || false);
        setFinancePassword(settings.finance_password || '');
        setFinanceRatioLimit(settings.finance_ratio_limit || 30);
    }, [settings.name, settings.location, settings.finance_password_enabled, settings.finance_password, settings.finance_ratio_limit]);

    useEffect(() => {
        if (user) {
            fetchCategories();
        }
    }, [user]);

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('finance_categories')
            .select('*')
            .eq('user_id', user?.id);
        if (!error && data) {
            setCategories(data);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateSettings({
                name,
                location,
                finance_password_enabled: financePasswordEnabled,
                finance_password: financePassword,
                finance_ratio_limit: financeRatioLimit
            });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim() || !user) return;
        const { data, error } = await supabase
            .from('finance_categories')
            .insert([{
                user_id: user.id,
                name: newCatName,
                icon: newCatIcon,
                color: newCatColor
            }])
            .select();
        if (!error && data) {
            setCategories([...categories, data[0]]);
            setNewCatName('');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        const { error } = await supabase
            .from('finance_categories')
            .delete()
            .eq('id', id);
        if (!error) {
            setCategories(categories.filter(c => c.id !== id));
        }
    };

    const handleAddQuote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuoteText.trim()) return;
        await addQuote(newQuoteText, newQuoteAuthor);
        setNewQuoteText('');
        setNewQuoteAuthor('');
    };

    if (!user) return null;

    return (
        <main className="flex-1 flex flex-col gap-6 h-full overflow-y-auto px-4 md:px-6 pt-20 md:pt-4 pb-10 relative scroll-smooth">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 pl-12 md:pl-0 animate-enter relative z-30">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Configuración</h2>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-1">
                        Personaliza tu experiencia en el sistema.
                    </p>
                </div>
                <UserProfile />
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-enter">
                {/* Columna Izquierda */}
                <div className="space-y-8">
                    {/* Tarjeta de Cuenta */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-soft">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center">
                                <span className="material-icons-round">account_circle</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Cuenta</h3>
                                <p className="text-xs text-slate-400">Información de tu sesión.</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                <img
                                    src={user.user_metadata?.avatar_url}
                                    alt="Avatar"
                                    className="w-12 h-12 rounded-xl"
                                />
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                                        {user.user_metadata?.full_name}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => signOut()}
                            className="w-full flex items-center justify-center gap-2 p-4 text-rose-500 font-bold bg-rose-50 dark:bg-rose-900/10 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded-2xl transition-colors"
                        >
                            <span className="material-icons-round">logout</span>
                            Cerrar Sesión
                        </button>
                    </div>

                    {/* Tarjeta de Perfil */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-soft">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-icons-round">person_outline</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Perfil de Usuario</h3>
                                <p className="text-xs text-slate-400">Cómo te ve el sistema.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Tu Nombre</label>
                                    <div className="relative">
                                        <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">badge</span>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ingresa tu nombre"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Ciudad / Región</label>
                                    <div className="relative">
                                        <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">map</span>
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="Ej: Buenos Aires, AR"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`w-full py-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {isSaving ? <span className="material-icons-round animate-spin text-sm">sync</span> : <span className="material-icons-round text-sm">save</span>}
                                {isSaving ? 'Guardando...' : 'Guardar Perfil'}
                            </button>
                        </form>
                    </div>

                    {/* Gestión de Categorías (Finanzas - Moved Left) */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-soft">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center">
                                <span className="material-icons-round">category</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Categorías Finanzas</h3>
                                <p className="text-xs text-slate-400">Clasificación de transacciones.</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-8 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {categories.map((cat) => (
                                <div key={cat.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700/50 group flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg" style={{ backgroundColor: cat.color + '20', color: cat.color }}>
                                            <span className="material-icons-round text-sm">{cat.icon}</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{cat.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <span className="material-icons-round text-sm">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleAddCategory} className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    placeholder="Nombre"
                                    className="px-4 py-3 bg-slate-100 dark:bg-slate-900 border-none rounded-2xl text-xs text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newCatIcon}
                                        onChange={(e) => setNewCatIcon(e.target.value)}
                                        placeholder="Icono (id)"
                                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-900 border-none rounded-2xl text-[10px] text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all"
                                    />
                                    <input
                                        type="color"
                                        value={newCatColor}
                                        onChange={(e) => setNewCatColor(e.target.value)}
                                        className="w-10 h-10 p-1 bg-white dark:bg-slate-900 rounded-xl border-none cursor-pointer"
                                    />
                                    <button type="submit" className="px-3 bg-primary text-white rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center">
                                        <span className="material-icons-round text-base">add</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Columna Derecha */}
                <div className="space-y-8">
                    {/* Tarjeta de Seguridad de Cuenta (NEW) */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-soft">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-500 flex items-center justify-center">
                                <span className="material-icons-round">password</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Contraseña de Acceso</h3>
                                <p className="text-xs text-slate-400">Establece una contraseña para entrar sin Google.</p>
                            </div>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            setIsSaving(true);
                            // @ts-ignore
                            const newPass = e.target.elements.newPass.value;
                            // @ts-ignore
                            const { updatePassword } = useAuth(); // We need to access context inside component, but doing it inline is messy.
                            // Better approach: use state for password input and handle externally.
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        id="account-pass"
                                        placeholder="Mínimo 6 caracteres"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                        onChange={(e) => setAccountPassword(e.target.value)}
                                        value={accountPassword}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleUpdatePassword}
                                    disabled={isSaving || !accountPassword}
                                    className={`w-full py-4 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 ${(isSaving || !accountPassword) ? 'opacity-70' : ''}`}
                                >
                                    {isSaving ? <span className="material-icons-round animate-spin">sync</span> : <span className="material-icons-round">save</span>}
                                    Actualizar Contraseña
                                </button>
                                {passwordMsg && <p className={`text-xs font-bold text-center ${passwordMsg.includes('Error') ? 'text-rose-500' : 'text-emerald-500'}`}>{passwordMsg}</p>}
                            </div>
                        </form>
                    </div>

                    {/* Tarjeta de Seguridad Finanzas (EXISTING) */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-soft">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center">
                                <span className="material-icons-round">lock</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Seguridad de Finanzas</h3>
                                <p className="text-xs text-slate-400">Protege tu acceso con contraseña.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-[28px] border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${financePasswordEnabled ? 'bg-emerald-100 text-emerald-500' : 'bg-slate-200 text-slate-400'}`}>
                                        <span className="material-icons-round text-xl">{financePasswordEnabled ? 'vpn_key' : 'key_off'}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">Acceso Protegido</p>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{financePasswordEnabled ? 'Activado' : 'Sin Contraseña'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFinancePasswordEnabled(!financePasswordEnabled)}
                                    className={`w-14 h-8 rounded-full p-1.5 transition-all duration-500 ease-out ${financePasswordEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-500 ease-out transform ${financePasswordEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {financePasswordEnabled && (
                                <div className="animate-in slide-in-from-top-4 duration-500 space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Contraseña Actual</label>
                                        <div className="relative">
                                            <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">lock_outline</span>
                                            <input
                                                type={showFinancePassword ? "text" : "password"}
                                                value={financePassword}
                                                onChange={(e) => setFinancePassword(e.target.value)}
                                                placeholder="Ej: 1234"
                                                className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-700 dark:text-white font-black text-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowFinancePassword(!showFinancePassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                                            >
                                                <span className="material-icons-round">{showFinancePassword ? 'visibility_off' : 'visibility'}</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-500/10">
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold leading-relaxed flex gap-2">
                                            <span className="material-icons-round text-sm">info</span>
                                            Usa esta contraseña para desbloquear la sección de Finanzas.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`w-full py-4 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 ${isSaving ? 'opacity-70' : ''}`}
                            >
                                {isSaving ? <span className="material-icons-round animate-spin">sync</span> : <span className="material-icons-round">security</span>}
                                Actualizar Seguridad
                            </button>
                        </div>
                    </div>

                    {/* Presupuesto y Metas (NEW) */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-soft">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center">
                                <span className="material-icons-round">analytics</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Presupuesto y Metas</h3>
                                <p className="text-xs text-slate-400">Configura tus límites financieros.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-end mb-2 ml-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Límite Ratio de Gastos (%)</label>
                                    <span className="text-sm font-black text-primary">{financeRatioLimit}%</span>
                                </div>
                                <div className="relative pt-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={financeRatioLimit}
                                        onChange={(e) => setFinanceRatioLimit(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between mt-2 px-1">
                                        <span className="text-[9px] font-bold text-slate-400">1%</span>
                                        <span className="text-[9px] font-bold text-slate-400">50%</span>
                                        <span className="text-[9px] font-bold text-slate-400">100%</span>
                                    </div>
                                </div>
                                <p className="mt-4 text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                                    Define qué porcentaje de tus ingresos consideras un límite saludable para tus gastos. Se mostrará una línea guía en tu Panel Financiero.
                                </p>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full py-4 bg-primary/10 hover:bg-primary/20 text-primary font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-round text-sm">check_circle</span>
                                Aplicar Límites
                            </button>
                        </div>
                    </div>

                    {/* Gestión de Frases Motivacionales (Smaller + Scroll) */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-soft">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center">
                                <span className="material-icons-round">format_quote</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Frases</h3>
                                <p className="text-xs text-slate-400">Mensajes inspiradores.</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-8 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {settings.quotes.map((quote) => (
                                <div key={quote.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700/50 group">
                                    <div className="flex justify-between items-start gap-4">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 italic">"{quote.text}"</p>
                                        <button
                                            onClick={() => deleteQuote(quote.id)}
                                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <span className="material-icons-round text-sm">delete</span>
                                        </button>
                                    </div>
                                    <p className="text-[10px] font-black text-primary uppercase mt-2 tracking-widest">— {quote.author || 'Anónimo'}</p>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleAddQuote} className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            <textarea
                                value={newQuoteText}
                                onChange={(e) => setNewQuoteText(e.target.value)}
                                placeholder="Escribe algo inspirador..."
                                rows={2}
                                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border-none rounded-2xl text-sm text-slate-700 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                            />
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newQuoteAuthor}
                                    onChange={(e) => setNewQuoteAuthor(e.target.value)}
                                    placeholder="Autor"
                                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-900 border-none rounded-2xl text-xs text-slate-700 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                                <button type="submit" className="px-4 bg-primary text-white rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center">
                                    <span className="material-icons-round text-base">add</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="mt-20 opacity-20 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">LifeOS v3.0</p>
                <div className="flex items-center justify-center gap-2 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Sincronizado con Supabase
                </div>
            </div>

            {showSuccess && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-white text-white dark:text-slate-800 px-8 py-4 rounded-full shadow-premium flex items-center gap-3 animate-in slide-in-from-bottom-10 z-[100] font-black text-sm">
                    <span className="material-icons-round text-emerald-400">check_circle</span>
                    Configuración Guardada Correctamente
                </div>
            )}
        </main >
    );
};
