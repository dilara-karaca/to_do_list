import {
    addDays,
    addMonths,
    addWeeks,
    endOfMonth,
    format,
    isSameDay,
    isBefore,
    isToday,
    parseISO,
    startOfDay,
    startOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
} from 'date-fns';
import { tr } from 'date-fns/locale';
import type { TaskRecurrence } from '../types/task';


export const calendarWeekdays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const dateKey = (date: Date) => format(date, 'yyyy-MM-dd');

export const formatLongDate = (date: Date) =>
    format(date, 'd MMMM yyyy, EEEE', { locale: tr });

export const formatShortDay = (date: Date) => format(date, 'd');

export const formatMonthLabel = (date: Date) => format(date, 'MMMM yyyy', { locale: tr });

export const formatTodayLabel = (date: Date) => format(date, 'd MMMM yyyy', { locale: tr });

export const getMonthDays = (date: Date) => {
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
};

export const isSameCalendarDay = (firstDate: Date, secondDate: Date) =>
    isSameDay(firstDate, secondDate);

export const isTodayDate = (date: Date) => isToday(date);

export const isPastDate = (date: Date) => isBefore(startOfDay(date), startOfDay(new Date()));

export const clampMonth = (date: Date, delta: number) => addMonths(date, delta);

export const toDate = (value: string) => parseISO(value);

/** Start date included. Past days are skipped. */
export const getRecurrenceDates = (startDate: Date, recurrence: TaskRecurrence): Date[] => {
    const { frequency, count } = recurrence;
    const dates: Date[] = [];

    for (let index = 0; index < count; index += 1) {
        const nextDate =
            frequency === 'daily'
                ? addDays(startDate, index)
                : frequency === 'weekly'
                    ? addWeeks(startDate, index)
                    : addMonths(startDate, index);

        if (!isPastDate(nextDate)) {
            dates.push(nextDate);
        }
    }

    return dates;
};