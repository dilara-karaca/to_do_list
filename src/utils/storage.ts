import type { TaskMap } from '../types/task';

const LEGACY_TASKS_KEY = 'gorev-planlayici.tasks';
const LEGACY_SELECTED_DATE_KEY = 'gorev-planlayici.selected-date';
const SELECTED_DATE_KEY = 'planner.selected-date';

const taskStorageKey = (userId: string) => `gorev-planlayici.tasks.${userId}`;

export const loadTaskMapForUser = (userId: string): TaskMap => {
    try {
        const scopedRaw = localStorage.getItem(taskStorageKey(userId));
        if (scopedRaw) {
            return JSON.parse(scopedRaw) as TaskMap;
        }

        const legacyRaw = localStorage.getItem(LEGACY_TASKS_KEY);
        return legacyRaw ? (JSON.parse(legacyRaw) as TaskMap) : {};
    } catch {
        return {};
    }
};

export const saveTaskMapForUser = (userId: string, taskMap: TaskMap) => {
    localStorage.setItem(taskStorageKey(userId), JSON.stringify(taskMap));
};

export const loadLegacyTaskMap = (): TaskMap => {
    try {
        const raw = localStorage.getItem(LEGACY_TASKS_KEY);
        return raw ? (JSON.parse(raw) as TaskMap) : {};
    } catch {
        return {};
    }
};

export const loadSelectedDate = (): string | null => {
    try {
        return localStorage.getItem(SELECTED_DATE_KEY) ?? localStorage.getItem(LEGACY_SELECTED_DATE_KEY);
    } catch {
        return null;
    }
};

export const saveSelectedDate = (dateKey: string) => {
    localStorage.setItem(SELECTED_DATE_KEY, dateKey);
};
