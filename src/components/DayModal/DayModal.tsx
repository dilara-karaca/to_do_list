import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CalendarDays, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import TaskList from '../TaskList/TaskList';
import type { Task } from '../../types/task';
import { Motion } from '../../utils/motion';

type DayModalProps = {
    date: Date;
    tasks: Task[];
    editable: boolean;
    onClose: () => void;
    onAddTask: (text: string) => void;
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
};

export default function DayModal({
    date,
    tasks,
    editable,
    onClose,
    onAddTask,
    onToggleTask,
    onDeleteTask,
}: DayModalProps) {
    const modalTitle = useMemo(() => format(date, 'd MMMM yyyy, EEEE', { locale: tr }), [date]);
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    useEffect(() => {
        if (isComposerOpen) {
            requestAnimationFrame(() => {
                inputRef.current?.focus();
            });
        }
    }, [isComposerOpen]);

    return (
        <Motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <Motion.div
                className="absolute inset-0 bg-slate-900/35 backdrop-blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            />

            <Motion.section
                role="dialog"
                aria-modal="true"
                aria-label="Gün görevleri"
                initial={{ opacity: 0, scale: 0.88, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 18 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="glass-panel relative z-10 flex max-h-[min(90vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-[34px]"
            >
                <div className="flex items-start justify-between gap-4 border-b border-white/70 px-5 py-5 sm:px-7">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-violet-500 shadow-sm">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Seçilen Gün
                        </div>
                        <h3 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                            {modalTitle}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            {tasks.length} tamamlanmış görev
                        </p>
                    </div>

                    <Motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={onClose}
                        className="grid h-11 w-11 place-items-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm"
                        aria-label="Kapat"
                    >
                        <X className="h-5 w-5" />
                    </Motion.button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
                    <div className="rounded-[28px] border border-white/80 bg-gradient-to-br from-white/85 to-violet-50/70 p-4 shadow-sm sm:p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pink-400">
                                GÖREVLER
                            </p>
                            {editable ? (
                                <Motion.button
                                    whileHover={{ scale: 1.04, y: -1 }}
                                    whileTap={{ scale: 0.96 }}
                                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-300 via-violet-300 to-sky-300 text-white shadow-[0_16px_30px_rgba(167,139,250,0.3)]"
                                    aria-label="Görev ekle"
                                    onClick={() => setIsComposerOpen(true)}
                                >
                                    <Plus className="h-5.5 w-5.5" />
                                </Motion.button>
                            ) : null}
                        </div>

                        <TaskList tasks={tasks} editable={editable} onToggle={onToggleTask} onDelete={onDeleteTask} />

                        {editable && isComposerOpen ? (
                            <AnimatePresence>
                                <Motion.div
                                    initial={{ opacity: 0, height: 0, y: -6 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: -6 }}
                                    transition={{ duration: 0.25 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                        <input
                                            ref={inputRef}
                                            placeholder="Yeni görev yaz..."
                                            className="h-14 flex-1 rounded-full border border-white/80 bg-white/95 px-5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-200/40"
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    const value = (event.currentTarget as HTMLInputElement).value.trim();
                                                    if (!value) {
                                                        return;
                                                    }
                                                    onAddTask(value);
                                                    event.currentTarget.value = '';
                                                    setIsComposerOpen(false);
                                                }
                                            }}
                                        />
                                        <Motion.button
                                            whileTap={{ scale: 0.96 }}
                                            onClick={() => {
                                                const input = inputRef.current;
                                                const value = input?.value.trim() ?? '';
                                                if (!value) {
                                                    return;
                                                }
                                                onAddTask(value);
                                                if (input) {
                                                    input.value = '';
                                                }
                                                setIsComposerOpen(false);
                                            }}
                                            className="h-14 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white shadow-lg shadow-slate-900/15"
                                        >
                                            Görevi Ekle
                                        </Motion.button>
                                    </div>
                                </Motion.div>
                            </AnimatePresence>
                        ) : null}
                    </div>
                </div>
            </Motion.section>
        </Motion.div>
    );
}