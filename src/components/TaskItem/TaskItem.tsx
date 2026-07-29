import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import type { Task, TaskDeleteScope } from '../../types/task';
import { Motion } from '../../utils/motion';

type TaskItemProps = {
    task: Task;
    editable: boolean;
    isSeries: boolean;
    onToggle: (id: string) => void;
    onDelete: (id: string, scope?: TaskDeleteScope) => void;
};

export default function TaskItem({ task, editable, isSeries, onToggle, onDelete }: TaskItemProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        if (!confirmOpen) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setConfirmOpen(false);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [confirmOpen]);

    const confirmDelete = (scope: TaskDeleteScope) => {
        setConfirmOpen(false);
        onDelete(task.id, scope);
    };

    return (
        <>
            <Motion.div
                layout
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className={`group flex items-center gap-3 rounded-[22px] border px-4 py-3 shadow-sm transition ${task.completed
                    ? 'border-emerald-200/80 bg-emerald-50/70 opacity-80'
                    : 'border-white/80 bg-white/85'
                    }`}
            >
                {editable ? (
                    <Motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onToggle(task.id)}
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition ${task.completed
                            ? 'border-emerald-300 bg-emerald-500 text-white'
                            : 'border-slate-200 bg-white text-transparent group-hover:border-violet-200'
                            }`}
                        aria-label={task.completed ? 'Görevi tamamlandı olarak işaretle' : 'Görevi tamamla'}
                    >
                        <Check className="h-5 w-5" strokeWidth={3} />
                    </Motion.button>
                ) : (
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${task.completed
                        ? 'border-emerald-300 bg-emerald-500 text-white'
                        : 'border-slate-300 bg-white text-slate-300'
                        }`}>
                        {task.completed ? (
                            <Check className="h-5 w-5" strokeWidth={3} />
                        ) : (
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-current opacity-60" />
                        )}
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <p className={`text-[15px] font-medium sm:text-base ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {task.text}
                    </p>
                    <p className={`mt-1 text-xs ${task.completed ? 'text-emerald-700/80' : 'text-slate-400'}`}>
                        {task.completed ? 'Tamamlandı' : 'Oluşturulma'}: {new Date(task.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>

                {editable ? (
                    <Motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ y: -1, scale: 1.03 }}
                        onClick={() => setConfirmOpen(true)}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/80 bg-rose-50 text-rose-500 transition hover:bg-rose-100"
                        aria-label="Görevi sil"
                        aria-haspopup="dialog"
                        aria-expanded={confirmOpen}
                    >
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current stroke-[2]">
                            <path d="M3 6h18M8 6V4h8v2m-9 0 .6 12.2A2 2 0 0 0 9.6 20h4.8a2 2 0 0 0 2-1.8L17 6" />
                        </svg>
                    </Motion.button>
                ) : null}
            </Motion.div>

            {confirmOpen
                ? createPortal(
                    <div
                        className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-[2px] sm:items-center"
                        role="presentation"
                        onClick={() => setConfirmOpen(false)}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-label="Görevi sil"
                            className="w-full max-w-md rounded-[28px] border border-white/80 bg-white p-5 shadow-2xl shadow-slate-900/20"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-400">
                                {isSeries ? 'Tekrarlayan görev' : 'Görevi sil'}
                            </p>
                            <h4 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                                Nasıl silmek istersin?
                            </h4>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500">
                                {isSeries
                                    ? `“${task.text}” birden fazla güne atanmış. Sadece bu günü veya atanan tümünü silebilirsin.`
                                    : `“${task.text}” görevini silmek istediğine emin misin?`}
                            </p>

                            <div className="mt-5 flex flex-col gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => confirmDelete('single')}
                                    className={`h-12 rounded-full px-4 text-sm font-semibold transition ${
                                        isSeries
                                            ? 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                                            : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600'
                                    }`}
                                >
                                    Sadece bu görevi sil
                                </button>
                                {isSeries ? (
                                    <button
                                        type="button"
                                        onClick={() => confirmDelete('series')}
                                        className="h-12 rounded-full bg-rose-500 px-4 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:bg-rose-600"
                                    >
                                        Atanan tümünü sil
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => setConfirmOpen(false)}
                                    className="h-11 rounded-full px-4 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                    Vazgeç
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )
                : null}
        </>
    );
}
