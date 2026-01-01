import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings, Quote } from '../types';
import { useAuth } from './AuthContext';

interface SettingsContextType {
    settings: UserSettings;
    updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
    addQuote: (text: string, author: string) => Promise<void>;
    deleteQuote: (id: string) => Promise<void>;
}

const DEFAULT_QUOTES: Quote[] = [];

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, profile, updateProfile } = useAuth();
    const [settings, setSettings] = useState<UserSettings>({
        name: 'Usuario',
        location: 'Ubicación no definida',
        quotes: DEFAULT_QUOTES,
        finance_password_enabled: false,
        finance_password: '',
        finance_ratio_limit: 30,
        wallet_expenses: 0,
        wallet_investments: 0,
        finance_show_data: false
    });

    // Synchronize with AuthContext profile
    useEffect(() => {
        if (profile) {
            let parsedQuotes = DEFAULT_QUOTES;
            if (profile.quotes) {
                try {
                    parsedQuotes = JSON.parse(profile.quotes);
                } catch (e) {
                    console.error('Error parsing quotes from DB:', e);
                }
            }

            setSettings({
                name: profile.full_name || user?.user_metadata?.full_name || 'Usuario',
                location: profile.location || 'Ubicación no definida',
                quotes: parsedQuotes,
                finance_password_enabled: profile.finance_password_enabled || false,
                finance_password: profile.finance_password || '',
                finance_ratio_limit: profile.finance_ratio_limit || 30,
                wallet_expenses: profile.wallet_expenses || 0,
                wallet_investments: profile.wallet_investments || 0,
                finance_show_data: settings.finance_show_data // Keep existing local state on profile refresh
            });
        }
    }, [profile, user]);

    const updateSettings = async (newSettings: Partial<UserSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);

        // Persist to Supabase
        const dbUpdates: any = {};
        if (newSettings.name) dbUpdates.full_name = newSettings.name;
        if (newSettings.location) dbUpdates.location = newSettings.location;
        if (newSettings.quotes) dbUpdates.quotes = JSON.stringify(newSettings.quotes);
        if (newSettings.finance_password_enabled !== undefined) dbUpdates.finance_password_enabled = newSettings.finance_password_enabled;
        if (newSettings.finance_password !== undefined) dbUpdates.finance_password = newSettings.finance_password;
        if (newSettings.finance_ratio_limit !== undefined) dbUpdates.finance_ratio_limit = newSettings.finance_ratio_limit;
        if (newSettings.wallet_expenses !== undefined) dbUpdates.wallet_expenses = newSettings.wallet_expenses;
        if (newSettings.wallet_investments !== undefined) dbUpdates.wallet_investments = newSettings.wallet_investments;

        await updateProfile(dbUpdates);
    };

    const addQuote = async (text: string, author: string) => {
        const newQuote: Quote = {
            id: Date.now().toString(),
            text,
            author: author || 'Anónimo'
        };
        const updatedQuotes = [...settings.quotes, newQuote];
        await updateSettings({ quotes: updatedQuotes });
    };

    const deleteQuote = async (id: string) => {
        const updatedQuotes = settings.quotes.filter(q => q.id !== id);
        await updateSettings({ quotes: updatedQuotes });
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, addQuote, deleteQuote }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
