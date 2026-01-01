import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const UserProfile: React.FC = () => {
    const { user, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        setIsOpen(false);
    };

    const goToSettings = () => {
        navigate('/settings');
        setIsOpen(false);
    };

    const goToDebug = () => {
        navigate('/debug');
        setIsOpen(false);
    };

    if (!user) return null;

    const avatarUrl = user.user_metadata?.avatar_url || "https://picsum.photos/id/64/100/100";
    const fullName = user.user_metadata?.full_name || "Usuario";
    const email = user.email;

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 p-[2px] shadow-md cursor-pointer hover:scale-105 transition-transform"
            >
                <img
                    alt="User Profile"
                    className="w-full h-full object-cover rounded-full border-2 border-white dark:border-slate-800"
                    src={avatarUrl}
                />
            </div>

            {/* Dropdown Menu */}
            <div className={`absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-50 transform transition-all duration-200 origin-top-right ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{email}</p>
                </div>

                <div className="p-1">
                    <button
                        onClick={goToSettings}
                        className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <span className="material-icons-round text-base text-slate-400">settings</span>
                        Configuración
                    </button>
                    <button
                        onClick={goToDebug}
                        className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <span className="material-icons-round text-base text-slate-400">smart_toy</span>
                        Debug
                    </button>
                </div>

                <div className="p-1 border-t border-slate-100 dark:border-slate-700">
                    <button
                        onClick={handleSignOut}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <span className="material-icons-round text-base">logout</span>
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};