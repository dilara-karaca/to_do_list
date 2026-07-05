import { Check } from 'lucide-react';
import type { Task } from '../../types/task';
import { Motion } from '../../utils/motion';

type TaskItemProps = {
    task: Task;
    editable: boolean;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
};

export default function TaskItem({ task, editable, onToggle, onDelete }: TaskItemProps) {
    return (
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
                    onClick={() => onDelete(task.id)}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/80 bg-rose-50 text-rose-500 transition hover:bg-rose-100"
                    aria-label="Görevi sil"
                >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current stroke-[2]">
                        <path d="M3 6h18M8 6V4h8v2m-9 0 .6 12.2A2 2 0 0 0 9.6 20h4.8a2 2 0 0 0 2-1.8L17 6" />
                    </svg>
                </Motion.button>
            ) : null}
        </Motion.div>
    );
}