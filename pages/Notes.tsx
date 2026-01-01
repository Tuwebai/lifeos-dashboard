import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from '../components/UserProfile';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { NotionEditor } from '../components/NotionEditor';

// --- Types ---
interface NoteFolder {
    id: string;
    name: string;
    emoji: string;
    color: string;
    is_pinned: boolean;
    created_at: string;
}

interface NoteItem {
    id: string;
    folder_id: string;
    title: string;
    content: any[]; // Blocks array
    emoji?: string;
    color?: string;
    is_pinned: boolean;
    updated_at: string;
}

export const Notes: React.FC = () => {
    const { user } = useAuth();
    const [folders, setFolders] = useState<NoteFolder[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<NoteFolder | null>(null);
    const [notes, setNotes] = useState<NoteItem[]>([]);
    const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'updated' | 'title' | 'pinned'>('pinned');

    // Modal States
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderEmoji, setNewFolderEmoji] = useState('📁');

    useEffect(() => {
        if (user) {
            fetchFolders();
        }
    }, [user]);

    useEffect(() => {
        if (selectedFolder) {
            fetchNotes(selectedFolder.id);
        }
    }, [selectedFolder]);

    const fetchFolders = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('note_folders')
            .select('*')
            .order('created_at', { ascending: true });

        if (!error && data) setFolders(data);
        setIsLoading(false);
    };

    const fetchNotes = async (folderId: string) => {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('folder_id', folderId)
            .order('updated_at', { ascending: false });

        if (!error && data) setNotes(data);
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim() || !user) return;

        const { data, error } = await supabase
            .from('note_folders')
            .insert([{
                user_id: user.id,
                name: newFolderName,
                emoji: newFolderEmoji,
                color: 'blue'
            }])
            .select();

        if (!error && data) {
            setFolders([...folders, data[0]]);
            setIsFolderModalOpen(false);
            setNewFolderName('');
            setNewFolderEmoji('📁');
        }
    };

    const handleCreateNote = async () => {
        if (!selectedFolder || !user) return;

        const { data, error } = await supabase
            .from('notes')
            .insert([{
                user_id: user.id,
                folder_id: selectedFolder.id,
                title: 'Nueva Nota',
                content: [{ id: '1', type: 'text', content: 'Texto de la nota' }],
                emoji: '📝',
                color: 'blue'
            }])
            .select();

        if (!error && data) {
            setNotes([data[0], ...notes]);
            setEditingNote(data[0]);
        }
    };

    const handleSaveNote = async (title: string, content: any[], extra = {}) => {
        if (!editingNote || !user) return;

        setSaveStatus('saving');
        const updateData = { title, content, updated_at: new Date().toISOString(), ...extra };
        const { error } = await supabase
            .from('notes')
            .update(updateData)
            .eq('id', editingNote.id);

        if (!error) {
            setSaveStatus('saved');
            const updatedNote = { ...editingNote, ...updateData };
            setEditingNote(updatedNote);
            setNotes(prev => prev.map(n => n.id === editingNote.id ? updatedNote : n));
        }
    };

    const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (!error) {
            setNotes(notes.filter(n => n.id !== id));
            setNoteToDelete(null);
            if (editingNote?.id === id) setEditingNote(null);
        }
    };

    const handleTogglePin = async (note: NoteItem, e: React.MouseEvent) => {
        e.stopPropagation();
        const newPinStatus = !note.is_pinned;
        const { error } = await supabase
            .from('notes')
            .update({ is_pinned: newPinStatus })
            .eq('id', note.id);

        if (!error) {
            setNotes(prev => prev.map(n => n.id === note.id ? { ...n, is_pinned: newPinStatus } : n));
            if (editingNote?.id === note.id) setEditingNote({ ...editingNote, is_pinned: newPinStatus });
        }
    };

    const handleToggleFolderPin = async (folder: NoteFolder, e: React.MouseEvent) => {
        e.stopPropagation();
        const newPinStatus = !folder.is_pinned;
        const { error } = await supabase
            .from('note_folders')
            .update({ is_pinned: newPinStatus })
            .eq('id', folder.id);

        if (!error) {
            setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, is_pinned: newPinStatus } : f));
            if (selectedFolder?.id === folder.id) setSelectedFolder({ ...selectedFolder, is_pinned: newPinStatus });
        }
    };

    const sortedFolders = useMemo(() => {
        return [...folders].sort((a, b) => {
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
    }, [folders]);

    const filteredNotes = useMemo(() => {
        let result = [...notes];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(n =>
                n.title.toLowerCase().includes(query) ||
                (n.content?.some(block => block.content?.toLowerCase().includes(query)))
            );
        }

        result.sort((a, b) => {
            if (sortBy === 'pinned' && a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
            if (sortBy === 'title') return a.title.localeCompare(b.title);
            if (sortBy === 'updated') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
            // Default: Pinned first, then updated
            if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });

        return result;
    }, [notes, searchQuery, sortBy]);

    const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const { error } = await supabase.from('note_folders').delete().eq('id', id);
        if (!error) setFolders(folders.filter(f => f.id !== id));
    };

    return (
        <main className="flex-1 flex flex-col gap-6 h-full overflow-hidden px-4 md:px-6 pt-20 md:pt-4 pb-10 relative">
            {editingNote ? (
                <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-900 animate-in fade-in duration-300 flex flex-col overflow-hidden">
                    <header className="p-4 border-b flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setEditingNote(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                <span className="material-icons-round">arrow_back</span>
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={editingNote.emoji}
                                        onChange={(e) => handleSaveNote(editingNote.title, editingNote.content, { emoji: e.target.value })}
                                        className="w-10 h-10 text-xl text-center bg-slate-50 dark:bg-slate-800 rounded-lg border-none outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                                    />
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{selectedFolder?.name} / {editingNote.title}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 mr-4">
                                {['blue', 'rose', 'emerald', 'amber', 'purple', 'indigo'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => handleSaveNote(editingNote.title, editingNote.content, { color })}
                                        className={`w-4 h-4 rounded-full transition-all ${editingNote.color === color ? 'ring-2 ring-offset-2 ring-primary scale-125' : 'hover:scale-110'}`}
                                        style={{ backgroundColor: `var(--color-${color})` }}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => setNoteToDelete(editingNote.id)}
                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                            >
                                <span className="material-icons-round text-lg">delete_outline</span>
                            </button>
                            <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${saveStatus === 'saving' ? 'text-blue-500 animate-pulse' : 'text-emerald-500'}`}>
                                {saveStatus === 'saving' ? 'Guardando...' : 'Guardado'}
                            </span>
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <NotionEditor
                            initialTitle={editingNote.title}
                            initialBlocks={editingNote.content || []}
                            onSave={handleSaveNote}
                        />
                    </div>
                </div>
            ) : (
                <>
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 pl-12 md:pl-0 animate-enter relative z-30">
                        <div className="flex items-center gap-3">
                            {selectedFolder && (
                                <button onClick={() => setSelectedFolder(null)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                                    <span className="material-icons-round text-slate-500 group-hover:text-primary">arrow_back</span>
                                </button>
                            )}
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    {selectedFolder ? (
                                        <><span className="text-3xl">{selectedFolder.emoji}</span><span>{selectedFolder.name}</span></>
                                    ) : (
                                        <><span className="material-icons-round text-primary">auto_stories</span><span>Mis Notas</span></>
                                    )}
                                </h2>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-4 flex-1 w-full md:w-auto">
                            {selectedFolder && (
                                <div className="relative w-full md:w-64 group">
                                    <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-sm">search</span>
                                    <input
                                        type="text"
                                        placeholder="Buscar nota..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800/50 pl-11 pr-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-white border-none outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all"
                                    />
                                </div>
                            )}
                            {selectedFolder && (
                                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
                                    {[
                                        { id: 'pinned', label: 'Fijadas', icon: 'push_pin' },
                                        { id: 'updated', label: 'Recientes', icon: 'schedule' },
                                        { id: 'title', label: 'A-Z', icon: 'sort_by_alpha' }
                                    ].map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => setSortBy(s.id as any)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === s.id
                                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            <span className="material-icons-round text-xs">{s.icon}</span>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {selectedFolder && (
                                <button onClick={handleCreateNote} className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-xl shadow-glow transition-all active:scale-95 whitespace-nowrap">
                                    <span className="material-icons-round text-sm">add</span>
                                    <span className="font-bold text-xs">Nueva Nota</span>
                                </button>
                            )}
                            <UserProfile />
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {!selectedFolder ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-enter">
                                {sortedFolders.map(folder => (
                                    <div
                                        key={folder.id}
                                        onClick={() => setSelectedFolder(folder)}
                                        className="group relative bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-soft hover:shadow-glow hover:border-primary/20 transition-all cursor-pointer flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-300"
                                    >
                                        <div className="text-5xl group-hover:scale-110 transition-transform duration-500">{folder.emoji}</div>
                                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs">{folder.name}</h3>

                                        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleToggleFolderPin(folder, e)}
                                                className={`p-2 transition-colors rounded-lg ${folder.is_pinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-slate-200 hover:text-primary hover:bg-primary/10'}`}
                                            >
                                                <span className="material-icons-round text-sm">{folder.is_pinned ? 'push_pin' : 'push_pin'}</span>
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteFolder(folder.id, e)}
                                                className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors rounded-lg"
                                            >
                                                <span className="material-icons-round text-sm">delete</span>
                                            </button>
                                        </div>
                                        {folder.is_pinned && !isFolderModalOpen && (
                                            <div className="absolute top-4 left-4 text-amber-500 group-hover:opacity-0 transition-opacity">
                                                <span className="material-icons-round text-sm">push_pin</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => setIsFolderModalOpen(true)}
                                    className="bg-slate-50/50 dark:bg-slate-900/40 p-8 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all group"
                                >
                                    <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                        <span className="material-icons-round text-3xl">create_new_folder</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Nueva Carpeta</span>
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-enter">
                                {filteredNotes.map(note => (
                                    <div
                                        key={note.id}
                                        onClick={() => setEditingNote(note)}
                                        className="relative bg-white dark:bg-slate-800 pr-6 py-6 pl-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-soft hover:shadow-glow hover:border-primary/20 transition-all cursor-pointer group overflow-hidden"
                                    >
                                        <div
                                            className="absolute left-0 top-0 w-2 h-full transition-colors"
                                            style={{ backgroundColor: `var(--color-${note.color || 'blue'})` }}
                                        />
                                        <div
                                            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.1] group-hover:opacity-[0.07] dark:group-hover:opacity-[0.15] transition-opacity pointer-events-none"
                                            style={{
                                                background: `linear-gradient(135deg, transparent, var(--color-${note.color || 'blue'}))`
                                            }}
                                        />

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-2xl shrink-0">{note.emoji || '📝'}</span>
                                                    <h3 className="font-bold text-slate-800 dark:text-white truncate">{note.title}</h3>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 ml-4">
                                                    <button
                                                        onClick={(e) => handleTogglePin(note, e)}
                                                        className={`p-1.5 transition-colors rounded-lg ${note.is_pinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-slate-200 hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100'}`}
                                                    >
                                                        <span className="material-icons-round text-[14px]">push_pin</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setNoteToDelete(note.id); }}
                                                        className="p-1.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100 rounded-lg"
                                                    >
                                                        <span className="material-icons-round text-[14px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed italic">
                                                {note.content?.length > 0 ? note.content[0].content.replace(/<[^>]*>/g, '') : 'Nota vacía...'}
                                            </p>
                                            <div className="mt-4 flex justify-between items-center">
                                                <span className="text-[9px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-tighter">
                                                    Actualizado: {new Date(note.updated_at).toLocaleDateString()}
                                                </span>
                                                {note.is_pinned && (
                                                    <span className="text-amber-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                                        <span className="material-icons-round text-[10px]">push_pin</span> Fijada
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {notes.length === 0 && (
                                    <div className="col-span-full py-20 text-center flex flex-col items-center opacity-20">
                                        <span className="material-icons-round text-6xl mb-4">note_add</span>
                                        <p className="font-black uppercase tracking-[0.2em] text-xs">Esta carpeta está vacía</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}

            {isFolderModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-400/10 dark:bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <form onSubmit={handleCreateFolder} className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[40px] shadow-premium p-10 animate-in zoom-in-95 duration-200 border border-white dark:border-white/10">
                        <header className="mb-8">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Organización</p>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">Nueva Carpeta</h3>
                        </header>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={newFolderEmoji}
                                        onChange={(e) => setNewFolderEmoji(e.target.value)}
                                        className="w-20 h-20 bg-slate-50 dark:bg-slate-900 text-4xl text-center rounded-3xl border-none outline-none ring-2 ring-transparent focus:ring-primary shadow-inner"
                                    />
                                    <p className="absolute -bottom-6 left-0 w-full text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">Emoji</p>
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Nombre</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder="Trabajo, Ideas..."
                                        className="w-full bg-slate-50 dark:bg-slate-900 px-6 py-5 rounded-3xl font-bold text-slate-800 dark:text-white border-none outline-none ring-2 ring-transparent focus:ring-primary shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsFolderModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-glow active:scale-95 transition-all text-xs uppercase tracking-widest">Crear Carpeta</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {noteToDelete && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[32px] p-8 shadow-premium animate-in zoom-in-95 duration-200 border border-white/10">
                        <header className="mb-6 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 mb-4">
                                <span className="material-icons-round text-3xl">delete_forever</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest text-center">¿Eliminar Nota?</h3>
                            <p className="text-sm text-slate-400 text-center mt-2 px-4">Esta acción no se puede deshacer. La nota se perderá para siempre.</p>
                        </header>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setNoteToDelete(null)}
                                className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors bg-slate-50 dark:bg-slate-900/50 rounded-2xl"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDeleteNote(noteToDelete)}
                                className="flex-1 py-4 bg-rose-500 text-white font-black rounded-2xl shadow-glow active:scale-95 transition-all text-xs uppercase tracking-widest"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                :root {
                    --color-blue: #3b82f6;
                    --color-rose: #f43f5e;
                    --color-emerald: #10b981;
                    --color-amber: #f59e0b;
                    --color-purple: #a855f7;
                    --color-indigo: #6366f1;
                }
            `}</style>
        </main>
    );
};
