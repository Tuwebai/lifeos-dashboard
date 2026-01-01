import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavItem } from '../types';

const NavLink: React.FC<NavItem & { isActive: boolean; isCollapsed: boolean; onClick?: () => void }> = ({ to, icon, label, isActive, isCollapsed, onClick }) => {
    const activeClass = isActive 
        ? "bg-white/50 dark:bg-white/5 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10 font-medium" 
        : "text-text-secondary-light dark:text-text-secondary-dark hover:bg-white/30 dark:hover:bg-white/5";

    return (
        <Link 
            to={to} 
            onClick={onClick}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden whitespace-nowrap ${activeClass}`}
            title={isCollapsed ? label : ''}
        >
            <span className="material-icons-round text-2xl flex-shrink-0">{icon}</span>
            <span className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 translate-x-10 w-0' : 'opacity-100 translate-x-0 w-auto'}`}>
                {label}
            </span>
        </Link>
    );
};

export const Sidebar: React.FC = () => {
    const location = useLocation();
    // Default to collapsed on mobile (handled by media query logic visual, but state starts true for desktop usually, let's start false for mobile safety)
    const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) setIsCollapsed(false); // Auto expand on desktop
            if (mobile) setIsCollapsed(true); // Auto collapse on mobile
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navItems: NavItem[] = [
        { to: "/", icon: "grid_view", label: "Resumen" },
        { to: "/calendar", icon: "calendar_today", label: "Calendario" },
        { to: "/tasks", icon: "check_circle", label: "Tareas" },
        { to: "/work", icon: "work_outline", label: "Trabajo" },
        { to: "/finance", icon: "account_balance_wallet", label: "Finanzas" },
        { to: "/notes", icon: "description", label: "Notas" },
    ];

    // On mobile:
    // If collapsed: width is small, background transparent (looks like just a button)
    // If open: width full/large, background glass
    
    // On Desktop:
    // Standard behavior

    const sidebarClasses = isMobile
        ? `fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[80px] bg-transparent shadow-none pointer-events-none' : 'w-64 glass-nav shadow-2xl pointer-events-auto'}`
        : `relative flex-shrink-0 flex flex-col glass-nav rounded-2xl shadow-soft h-full transition-all duration-500 ease-in-out overflow-hidden z-20 ${isCollapsed ? 'w-20' : 'w-72'}`;

    const contentClasses = isMobile && isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 transition-opacity duration-300 delay-100';

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            {isMobile && !isCollapsed && (
                <div 
                    className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-40 animate-enter"
                    onClick={() => setIsCollapsed(true)}
                />
            )}

            <aside className={`${sidebarClasses} flex flex-col`}>
                <div className="p-4 md:p-6 flex items-center gap-4 mb-4 relative min-h-[88px] pointer-events-auto">
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-glow hover:scale-105 active:scale-95 transition-transform cursor-pointer z-50"
                    >
                        <span className="material-icons-round text-white text-xl">
                            {isCollapsed ? 'menu_open' : 'menu'}
                        </span>
                    </button>
                    
                    <h1 className={`font-bold text-xl tracking-tight text-slate-700 dark:text-slate-200 whitespace-nowrap absolute left-20 transition-all duration-500 ${isCollapsed ? 'opacity-0 -translate-x-10 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
                        Automatizate
                    </h1>
                </div>

                <div className={`flex-1 flex flex-col ${contentClasses}`}>
                    <nav className="flex-1 px-3 space-y-2">
                        {navItems.map((item) => (
                            <NavLink 
                                key={item.label}
                                {...item}
                                isActive={location.pathname === item.to}
                                isCollapsed={isCollapsed}
                                onClick={() => isMobile && setIsCollapsed(true)}
                            />
                        ))}
                    </nav>

                    <div className="p-3 mt-auto">
                        <NavLink 
                            to="/settings" 
                            icon="settings" 
                            label="Configuración" 
                            isActive={location.pathname === '/settings'} 
                            isCollapsed={isCollapsed}
                            onClick={() => isMobile && setIsCollapsed(true)}
                        />
                    </div>
                </div>
            </aside>
        </>
    );
};