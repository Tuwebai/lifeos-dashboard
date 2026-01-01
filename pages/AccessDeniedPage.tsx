import React from 'react';
import { useAuth } from '../context/AuthContext';

const AccessDeniedPage: React.FC = () => {
    const { signOut } = useAuth();

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background-light dark:bg-background-dark font-sans">
            {/* Background Effects - Using Reds/Oranges for Access Denied */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-red-500/20 dark:bg-red-900/20 rounded-full blur-[120px] animate-float"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-orange-500/20 dark:bg-red-800/10 rounded-full blur-[120px] animate-float-delayed"></div>

            <div className="relative z-10 w-full max-w-lg p-8 md:p-12 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-3xl shadow-2xl animate-enter text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6">
                    <span className="material-icons-round text-3xl text-white">lock</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
                    <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                        Verificación de acceso requerida
                    </span>
                </h1>

                <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                    No hemos podido validar una suscripción vigente vinculada a este perfil.
                    Por favor, asegúrate de que tu cuenta haya sido confirmada por nuestro equipo.
                </p>

                <button
                    onClick={() => signOut()}
                    className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all inline-flex items-center gap-2 group"
                >
                    <span className="material-icons-round text-sm group-hover:-translate-x-1 transition-transform">logout</span>
                    Cerrar sesión
                </button>

                <p className="text-center mt-12 text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                    LifeOS Access Control
                </p>
            </div>
        </div>
    );
};

export default AccessDeniedPage;
