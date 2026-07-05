import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { TaskMap } from '../../types/task';
import { calendarWeekdays, formatMonthLabel, getMonthDays } from '../../utils/date';
import { Motion } from '../../utils/motion';
import CalendarDay from '../CalendarDay/CalendarDay';

type CalendarProps = {
    currentMonth: Date;
    selectedDate: Date;
    taskMap: TaskMap;
    onDaySelect: (date: Date) => void;
    onPreviousMonth: () => void;
    onNextMonth: () => void;
    onMonthChange: (date: Date) => void;
};

export default function Calendar({
    currentMonth,
    selectedDate,
    taskMap,
    onDaySelect,
    onPreviousMonth,
    onNextMonth,
    onMonthChange,
}: CalendarProps) {
    const days = getMonthDays(currentMonth);

    return (
        <section className="glass-card rounded-[32px] p-3 shadow-[0_18px_60px_rgba(148,163,184,0.18)] sm:p-4 lg:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-400">
                        Takvim
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900 sm:text-2xl">
                        {formatMonthLabel(currentMonth)}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <Motion.button
                        whileTap={{ scale: 0.94 }}
                        whileHover={{ y: -1 }}
                        onClick={onPreviousMonth}
                        className="grid h-11 w-11 place-items-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm transition"
                        aria-label="Önceki ay"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Motion.button>
                    <Motion.button
                        whileTap={{ scale: 0.94 }}
                        whileHover={{ y: -1 }}
                        onClick={onNextMonth}
                        className="grid h-11 w-11 place-items-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm transition"
                        aria-label="Sonraki ay"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Motion.button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarWeekdays.map((weekday) => (
                    <div
                        key={weekday}
                        className="px-1 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 sm:text-xs"
                    >
                        {weekday}
                    </div>
                ))}
            </div>

            <div className="mt-1.5 grid grid-cols-7 gap-1.5 sm:gap-2">

                {days.map((day) => {
                    const dayKey = day.toLocaleDateString('en-CA');
                    const tasks = taskMap[dayKey] ?? [];

                    return (
                        <CalendarDay
                            key={dayKey}
                            date={day}
                            tasks={tasks}
                            isSelected={day.toDateString() === selectedDate.toDateString()}
                            isCurrentMonth={day.getMonth() === currentMonth.getMonth()}
                            onClick={() => {
                                onMonthChange(new Date(day.getFullYear(), day.getMonth(), 1));
                                onDaySelect(day);
                            }}
                        />
                    );
                })}
            </div>
        </section>
    );
}