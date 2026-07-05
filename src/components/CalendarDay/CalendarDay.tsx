import { isToday } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';
import { formatShortDay } from '../../utils/date';
import type { Task } from '../../types/task';
import { Motion } from '../../utils/motion';

type CalendarDayProps = {
    date: Date;
    tasks: Task[];
    isSelected: boolean;
    isCurrentMonth: boolean;
    onClick: () => void;
};

export default function CalendarDay({
    date,
    tasks,
    isSelected,
    isCurrentMonth,
    onClick,
}: CalendarDayProps) {
    const completedTasks = tasks.filter((task) => task.completed).length;
    const today = isToday(date);

    return (
        <Motion.button
            type="button"
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`group relative min-h-[78px] overflow-hidden rounded-[22px] border p-2.5 text-left transition-all sm:min-h-[92px] sm:p-3 ${isSelected
                ? 'border-violet-300 bg-violet-50 text-violet-950 shadow-[0_14px_35px_rgba(167,139,250,0.22)]'
                : 'border-white/70 bg-white/75 text-slate-800 shadow-sm hover:border-pink-200 hover:bg-white'
                } ${today ? 'ring-2 ring-sky-300 ring-offset-2 ring-offset-transparent' : ''} ${isCurrentMonth ? '' : 'opacity-45'}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div
                        className={`text-base font-semibold sm:text-lg ${isSelected ? 'text-violet-700' : 'text-slate-900'}`}
                    >
                        {formatShortDay(date)}
                    </div>
                    <div className={`mt-0.5 text-[10px] font-medium uppercase tracking-[0.22em] ${isSelected ? 'text-violet-400' : 'text-slate-400'}`}>
                        {date.toLocaleDateString('tr-TR', { weekday: 'short' })}
                    </div>
                </div>

                {today ? (
                    <div className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-sky-600">
                        Bugün
                    </div>
                ) : null}
            </div>

            <div className="mt-3 flex items-end justify-between gap-2">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 sm:text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {tasks.length} görev
                    </div>
                    <div className="text-[10px] font-semibold tracking-wide text-slate-400">
                        {completedTasks}/{tasks.length} tamamlandı
                    </div>
                </div>

                {tasks.length ? (
                    <div className="rounded-full bg-gradient-to-r from-pink-100 to-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-600">
                        {completedTasks}/{tasks.length}
                    </div>
                ) : (
                    <div className="rounded-full border border-dashed border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-400">
                        Boş
                    </div>
                )}
            </div>

            <Motion.div
                aria-hidden="true"
                className="absolute -bottom-10 -right-10 h-20 w-20 rounded-full bg-gradient-to-br from-pink-200/45 to-violet-200/20 blur-2xl transition-opacity group-hover:opacity-100"
                initial={{ opacity: 0.2, scale: 0.9 }}
                animate={{ opacity: isSelected ? 0.9 : 0.45, scale: isSelected ? 1 : 0.92 }}
            />
        </Motion.button>
    );
}