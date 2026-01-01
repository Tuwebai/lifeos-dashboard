
import React from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { DarkModeToggle } from './components/DarkModeToggle';
import { Dashboard } from './pages/Dashboard';
import { Calendar } from './pages/Calendar';
import { Notes } from './pages/Notes';
import { Tasks } from './pages/Tasks';
import { Work } from './pages/Work';
import { Finance } from './pages/Finance';
import { FinanceExplorer } from './pages/FinanceExplorer';
import { Settings } from './pages/Settings';
import { Debug } from './pages/Debug';
import { Login } from './pages/Login';
import AccessDeniedPage from './pages/AccessDeniedPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

const Background: React.FC = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-200/40 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }}></div>
    </div>
);

const AppContent: React.FC = () => {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] relative overflow-hidden">
                <Background />
                <div className="relative z-10 flex flex-col items-center gap-6 animate-enter">
                    <div className="w-20 h-20 relative">
                        {/* Outer Glow/Pulse */}
                        <div className="absolute inset-x-[-20%] inset-y-[-20%] rounded-3xl bg-primary/20 animate-pulse blur-xl"></div>

                        {/* Loading Box */}
                        <div className="relative w-20 h-20 rounded-2xl bg-white/70 dark:bg-slate-800/70 shadow-2xl flex items-center justify-center border border-white dark:border-white/10 backdrop-blur-xl">
                            <span className="material-icons-round text-4xl text-primary animate-spin" style={{ animationDuration: '3s' }}>sync</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">LifeOS</h2>
                        <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] opacity-80">Sincronizando</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    if (profile && profile.subscription === false) {
        return <AccessDeniedPage />;
    }

    return (
        <div className="relative z-10 flex h-screen p-0 md:p-6 gap-0 md:gap-6 max-w-[1920px] mx-auto overflow-hidden animate-enter">
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 h-full relative flex flex-col min-w-0">
                <div
                    key={location.pathname}
                    className="flex-1 h-full w-full animate-enter overflow-hidden flex flex-col bg-transparent md:rounded-2xl"
                >
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/work" element={<Work />} />
                        <Route path="/finance" element={<Finance />} />
                        <Route path="/finance-explorer" element={<FinanceExplorer />} />
                        <Route path="/notes" element={<Notes />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/debug" element={<Debug />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <SettingsProvider>
                <HashRouter>
                    <Background />
                    <AppContent />
                    <DarkModeToggle />
                </HashRouter>
            </SettingsProvider>
        </AuthProvider>
    );
};

export default App;
