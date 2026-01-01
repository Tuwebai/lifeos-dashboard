import React, { useState, useEffect } from 'react';

export const DarkModeToggle: React.FC = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Force Light Mode by default on mount
        document.documentElement.classList.remove('dark');
        setIsDark(false);
    }, []);

    const toggleDarkMode = () => {
        if (isDark) {
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
        }
        setIsDark(!isDark);
    };

    return (
        <button 
            className="fixed bottom-6 right-6 p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 z-50 hover:scale-110 transition-transform text-slate-600 dark:text-yellow-400" 
            onClick={toggleDarkMode}
            aria-label="Toggle Dark Mode"
        >
            <span className={`material-icons-round text-xl ${isDark ? 'hidden' : 'block'}`}>dark_mode</span>
            <span className={`material-icons-round text-xl ${isDark ? 'block' : 'hidden'}`}>light_mode</span>
        </button>
    );
};