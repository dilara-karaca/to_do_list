import { TaskMap } from '../types/task';

const STORAGE_KEYS = {
    tasks: 'gorev-planlayici.tasks',
    selectedDate: 'gorev-planlayici.selected-date',
} as const;

export const loadTaskMap = (): TaskMap => {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.tasks);
        return raw ? (JSON.parse(raw) as TaskMap) : {};
    } catch {
        return {};
    }
};

export const saveTaskMap = (taskMap: TaskMap) => {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(taskMap));
};

export const loadSelectedDate = (): string | null => {
    try {
        return localStorage.getItem(STORAGE_KEYS.selectedDate);
    } catch {
        return null;
    }
};

export const saveSelectedDate = (dateKey: string) => {
    localStorage.setItem(STORAGE_KEYS.selectedDate, dateKey);
};