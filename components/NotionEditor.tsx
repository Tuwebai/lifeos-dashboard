import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Block {
    id: string;
    type: 'text' | 'h1' | 'h2' | 'h3' | 'todo' | 'bullet';
    content: string; // Now stores HTML for Bold/Italic
    completed?: boolean;
}

interface BlockProps {
    block: Block;
    index: number;
    totalBlocks: number;
    onUpdate: (id: string, content: string) => void;
    onKeyDown: (e: React.KeyboardEvent, id: string, index: number) => void;
    onFocus: (id: string) => void;
    onToggleTodo: (id: string, completed: boolean) => void;
    innerRef: (id: string, el: HTMLDivElement | null) => void;
}

const EditableBlock: React.FC<BlockProps> = ({
    block, index, onUpdate, onKeyDown, onFocus, onToggleTodo, innerRef
}) => {
    const contentRef = useRef<HTMLDivElement>(null);

    // Sync content from state to DOM using innerHTML for rich text
    useEffect(() => {
        if (contentRef.current && contentRef.current.innerHTML !== block.content) {
            contentRef.current.innerHTML = block.content;
        }
    }, [block.id, block.type]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onUpdate(block.id, e.currentTarget.innerHTML || '');
    };

    return (
        <div className="relative group flex items-start gap-3">
            {block.type === 'todo' && (
                <div className="flex items-center h-7 mt-0.5">
                    <input
                        type="checkbox"
                        checked={block.completed}
                        onChange={(e) => onToggleTodo(block.id, e.target.checked)}
                        className="w-5 h-5 rounded-md border-slate-200 text-primary focus:ring-primary cursor-pointer transition-all"
                    />
                </div>
            )}
            {block.type === 'bullet' && <div className="flex items-center h-7 mt-0.5"><span className="text-slate-400 font-bold">•</span></div>}

            <div
                ref={(el) => {
                    contentRef.current = el as HTMLDivElement;
                    innerRef(block.id, el);
                }}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyDown={(e) => onKeyDown(e, block.id, index)}
                onFocus={() => onFocus(block.id)}
                data-placeholder={block.type === 'text' ? "Escribe '/' para comandos..." : 'Título...'}
                className={`flex-1 outline-none transition-all placeholder-style ${block.type === 'h1' ? 'text-4xl font-black mt-8 mb-4 text-slate-900 dark:text-white' :
                    block.type === 'h2' ? 'text-2xl font-bold mt-6 mb-2 text-slate-800 dark:text-slate-100' :
                        block.type === 'h3' ? 'text-xl font-bold mt-4 text-slate-700 dark:text-slate-200' :
                            block.type === 'todo' ? `text-lg py-0.5 ${block.completed ? 'line-through text-slate-400 opacity-50' : 'text-slate-700 dark:text-slate-300'}` :
                                'text-lg py-0.5 leading-relaxed text-slate-600 dark:text-slate-400'
                    }`}
            />
        </div>
    );
};

interface NotionEditorProps {
    initialTitle: string;
    initialBlocks: Block[];
    onSave: (title: string, blocks: Block[]) => void;
}

export const NotionEditor: React.FC<NotionEditorProps> = ({ initialTitle, initialBlocks, onSave }) => {
    const [title, setTitle] = useState(initialTitle);
    const [blocks, setBlocks] = useState<Block[]>(initialBlocks.length > 0 ? initialBlocks : [{ id: '1', type: 'text', content: '' }]);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    // Selection state for Floating Toolbar
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

    const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEvents = () => {
            setShowSlashMenu(false);
            updateSelection();
        };
        window.addEventListener('click', handleEvents);
        document.addEventListener('selectionchange', updateSelection);
        return () => {
            window.removeEventListener('click', handleEvents);
            document.removeEventListener('selectionchange', updateSelection);
        };
    }, []);

    const updateSelection = () => {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const containerRect = editorRef.current?.getBoundingClientRect();

            if (containerRect) {
                setToolbarPosition({
                    top: rect.top - containerRect.top - 50,
                    left: Math.max(0, rect.left - containerRect.left + (rect.width / 2) - 100)
                });
                setShowToolbar(true);
            }
        } else {
            setShowToolbar(false);
        }
    };

    const formatText = (command: string) => {
        document.execCommand(command, false);
    };

    useEffect(() => {
        if (!activeBlockId) return;
        const activeBlock = blocks.find(b => b.id === activeBlockId);

        // Check for slash command
        if (activeBlock?.content.endsWith('/')) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                const containerRect = editorRef.current?.getBoundingClientRect();

                if (containerRect) {
                    let left = rect.left - containerRect.left;
                    if (left + 260 > containerRect.width) left = containerRect.width - 270;

                    setMenuPosition({
                        top: rect.bottom - containerRect.top + 10,
                        left: Math.max(0, left)
                    });
                    setShowSlashMenu(true);
                }
            }
        } else {
            setShowSlashMenu(false);
        }
    }, [blocks, activeBlockId]);

    useEffect(() => {
        const timer = setTimeout(() => onSave(title, blocks), 1000);
        return () => clearTimeout(timer);
    }, [title, blocks]);

    const addBlock = (id: string, type: Block['type'] = 'text', content = '') => {
        const newBlock: Block = { id: Math.random().toString(36).substr(2, 9), type, content };
        const index = blocks.findIndex(b => b.id === id);
        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, newBlock);
        setBlocks(newBlocks);
        setTimeout(() => {
            blockRefs.current[newBlock.id]?.focus();
        }, 50);
    };

    const updateBlock = (id: string, content: string) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
    };

    const toggleTodo = (id: string, completed: boolean) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, completed } : b));
    };

    const handleKeyDown = (e: React.KeyboardEvent, id: string, index: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const currentBlock = blocks[index];
            const nextType = currentBlock.type.startsWith('h') ? 'text' : currentBlock.type;
            addBlock(id, nextType);
        } else if (e.key === 'Backspace') {
            const currentBlock = blocks[index];
            if ((currentBlock.content === '' || currentBlock.content === '<br>') && blocks.length > 1 && index > 0) {
                e.preventDefault();
                const prevId = blocks[index - 1]?.id;
                setBlocks(blocks.filter(b => b.id !== id));
                if (prevId) {
                    setTimeout(() => {
                        const el = blockRefs.current[prevId];
                        if (el) {
                            el.focus();
                            const range = document.createRange();
                            const sel = window.getSelection();
                            range.selectNodeContents(el);
                            range.collapse(false);
                            sel?.removeAllRanges();
                            sel?.addRange(range);
                        }
                    }, 0);
                }
            } else if (currentBlock.content.endsWith('/')) {
                setShowSlashMenu(false);
            }
        } else if (e.key === 'ArrowUp' && index > 0) {
            blockRefs.current[blocks[index - 1].id]?.focus();
        } else if (e.key === 'ArrowDown' && index < blocks.length - 1) {
            blockRefs.current[blocks[index + 1].id]?.focus();
        } else if (e.key === 'Escape') {
            setShowSlashMenu(false);
            setShowToolbar(false);
        }
    };

    const applyCommand = (type: Block['type']) => {
        setBlocks(prev => prev.map(b => {
            if (b.id === activeBlockId) {
                const newContent = b.content.replace('/', '');
                return { ...b, type, content: newContent };
            }
            return b;
        }));

        setShowSlashMenu(false);
        setTimeout(() => {
            if (activeBlockId) {
                const el = blockRefs.current[activeBlockId];
                if (el) {
                    el.focus();
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.selectNodeContents(el);
                    range.collapse(false);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                }
            }
        }, 50);
    };

    return (
        <div ref={editorRef} className="relative w-full max-w-3xl mx-auto py-20 px-4 min-h-screen bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la nota"
                className="w-full text-5xl font-black border-none outline-none bg-transparent mb-12 placeholder:text-slate-100 dark:placeholder:text-slate-800"
            />

            <div className="space-y-1">
                {blocks.map((block, index) => (
                    <EditableBlock
                        key={block.id}
                        block={block}
                        index={index}
                        totalBlocks={blocks.length}
                        onUpdate={updateBlock}
                        onKeyDown={handleKeyDown}
                        onFocus={setActiveBlockId}
                        onToggleTodo={toggleTodo}
                        innerRef={(id, el) => blockRefs.current[id] = el}
                    />
                ))}
            </div>

            {/* Floating Toolbar */}
            {showToolbar && (
                <div
                    className="absolute z-[1100] bg-slate-900 text-white rounded-xl shadow-premium border border-slate-800 p-1 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200"
                    style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    <button onClick={() => formatText('bold')} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <span className="material-icons-round text-sm">format_bold</span>
                    </button>
                    <button onClick={() => formatText('italic')} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <span className="material-icons-round text-sm">format_italic</span>
                    </button>
                    <button onClick={() => formatText('underline')} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <span className="material-icons-round text-sm">format_underlined</span>
                    </button>
                    <div className="w-px h-4 bg-slate-700 mx-1" />
                    <button onClick={() => formatText('justifyLeft')} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <span className="material-icons-round text-sm">format_align_left</span>
                    </button>
                </div>
            )}

            {/* Slash Menu */}
            {showSlashMenu && (
                <div
                    className="absolute z-[1000] bg-white dark:bg-slate-800 rounded-2xl shadow-premium border border-slate-100 dark:border-slate-700 p-2 w-64 max-h-[300px] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200"
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                >
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-2 sticky top-0 bg-white dark:bg-slate-800 z-10">Comandos</p>
                    {[
                        { type: 'text', icon: 'text_fields', label: 'Texto', desc: 'Escritura normal' },
                        { type: 'h1', icon: 'title', label: 'Título 1', desc: 'Encabezado grande' },
                        { type: 'h2', icon: 'title', label: 'Título 2', desc: 'Encabezado medio' },
                        { type: 'h3', icon: 'title', label: 'Título 3', desc: 'Encabezado chico' },
                        { type: 'todo', icon: 'check_box', label: 'Checklist', desc: 'Lista de tareas' },
                        { type: 'bullet', icon: 'format_list_bulleted', label: 'Lista', desc: 'Lista con puntos' },
                    ].map(cmd => (
                        <button
                            key={cmd.type}
                            onClick={() => applyCommand(cmd.type as any)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-left"
                        >
                            <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                                <span className="material-icons-round text-lg">{cmd.icon}</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-700 dark:text-white">{cmd.label}</p>
                                <p className="text-[10px] text-slate-400">{cmd.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <style>{`
                .placeholder-style:empty:before {
                    content: attr(data-placeholder);
                    color: #cbd5e1;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    pointer-events: none;
                }
                .placeholder-style:focus:empty:before {
                    opacity: 1;
                }
                .dark .placeholder-style:empty:before {
                    color: #334155;
                }
            `}</style>
        </div>
    );
};
