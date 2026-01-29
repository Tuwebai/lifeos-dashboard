import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
    const { signInWithGoogle, signInWithEmail, loading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        try {
            await signInWithEmail(email, password);
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.message || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background-light dark:bg-background-dark">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-400/20 dark:bg-blue-900/20 rounded-full blur-[120px] animate-float"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-400/20 dark:bg-purple-900/20 rounded-full blur-[120px] animate-float-delayed"></div>

            <div className={`relative z-10 w-full max-w-sm p-8 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl shadow-2xl animate-enter`}>
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-500 rounded-2xl mx-auto flex items-center justify-center shadow-glow mb-4">
                        <span className="material-icons-round text-3xl text-white">fingerprint</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Bienvenido</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ingresa con tu cuenta de Google para continuar</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading || loading}
                        className={`w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-3 group ${(isLoading || loading) ? 'cursor-wait opacity-70' : ''}`}
                    >
                        {(isLoading || loading) ? (
                            <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <>
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                <span>Continuar con Google</span>
                            </>
                        )}
                    </button>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-2 text-slate-400">O ingresa con tu cuenta</span></div>
                    </div>

                    <form onSubmit={handleEmailLogin} className="space-y-3">
                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-slate-800 dark:text-white"
                        />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary text-slate-800 dark:text-white"
                        />
                        {errorMsg && <p className="text-xs text-rose-500 font-bold">{errorMsg}</p>}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-4 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-3 ${(isLoading) ? 'cursor-wait opacity-70' : ''}`}
                        >
                            {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-10 text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                    LifeOS Authentication System
                </p>
            </div>
        </div>
    );
};