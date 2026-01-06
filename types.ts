
export interface CalendarEventLabel {
    id?: string;
    text: string;
    color: 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'indigo' | 'gray' | 'emerald' | 'pink';
    border?: boolean;
    time?: string;
    description?: string;
    location?: string;
    participants?: string[];
}

export interface CalendarDay {
    num: number;
    type: 'prev' | 'current' | 'next';
    isToday?: boolean;
    labels?: CalendarEventLabel[];
    date?: string;
}

export interface NavItem {
    label: string;
    icon: string;
    to: string;
}

export interface ProjectFile {
    name: string;
    content: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

export interface GeneratedAsset {
    id: string;
    type: 'image' | 'video';
    url: string;
    prompt: string;
    timestamp: number;
}

export interface WorkProject {
    id: string;
    title: string;
    client: string;
    description?: string;
    status: 'quote' | 'pending' | 'completed';
    amount: number;
    deadline?: string;
    priority: 'low' | 'medium' | 'high';
}

export interface FinanceTransaction {
    id: string;
    type: 'income' | 'expense' | 'investment';
    amount: number;
    category: string;
    description: string;
    date: string;
}

export interface FinanceCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export interface FinanceWeeklyClosing {
    id: string;
    week_number: number;
    month: number;
    year: number;
    net_amount: number;
    assigned_expenses: number;
    assigned_investments: number;
    created_at: string;
}

export interface Quote {
    id: string;
    text: string;
    author: string;
}

export interface UserSettings {
    name: string;
    location: string;
    quotes: Quote[];
    finance_password_enabled?: boolean;
    finance_password?: string;
    finance_ratio_limit?: number;
    wallet_expenses?: number;
    wallet_investments?: number;
    finance_show_data?: boolean;
    finance_chart_visible_lines?: {
        income: boolean;
        expense: boolean;
        investment: boolean;
        balance: boolean;
    };
}