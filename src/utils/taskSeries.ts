import type { Task, TaskMap } from '../types/task';

export function findTaskInMap(taskMap: TaskMap, taskId: string): Task | undefined {
    for (const tasks of Object.values(taskMap)) {
        const match = tasks.find((task) => task.id === taskId);
        if (match) {
            return match;
        }
    }

    return undefined;
}

const createdAtMs = (value: string) => {
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : Number.NaN;
};

type CollectSeriesOptions = {
    /** Inclusive yyyy-MM-dd lower bound. Past dates are excluded when set. */
    fromDateKey?: string;
};

function iterateTaskEntries(taskMap: TaskMap, fromDateKey?: string) {
    const entries: Array<{ date: string; task: Task }> = [];

    for (const [date, tasks] of Object.entries(taskMap)) {
        if (fromDateKey && date < fromDateKey) {
            continue;
        }

        for (const task of tasks) {
            entries.push({ date, task });
        }
    }

    return entries;
}

export function collectSeriesTaskIds(
    taskMap: TaskMap,
    task: Task,
    options?: CollectSeriesOptions,
): string[] {
    const entries = iterateTaskEntries(taskMap, options?.fromDateKey);

    if (task.seriesId) {
        const bySeries = entries
            .filter(({ task: candidate }) => candidate.seriesId === task.seriesId)
            .map(({ task: candidate }) => candidate.id);
        if (bySeries.length) {
            return bySeries;
        }
    }

    const taskCreatedAt = createdAtMs(task.createdAt);
    const byCreatedAt = entries
        .filter(({ task: candidate }) => {
            if (candidate.text !== task.text) {
                return false;
            }

            const candidateCreatedAt = createdAtMs(candidate.createdAt);
            return Number.isFinite(taskCreatedAt)
                && Number.isFinite(candidateCreatedAt)
                && candidateCreatedAt === taskCreatedAt;
        })
        .map(({ task: candidate }) => candidate.id);

    if (byCreatedAt.length > 1) {
        return byCreatedAt;
    }

    // Eski tekrarlayan görevlerde created_at birebir tutmayabilir; aynı metni sil seçeneği için kullan.
    return entries
        .filter(({ task: candidate }) => candidate.text === task.text)
        .map(({ task: candidate }) => candidate.id);
}

export function isSeriesTask(taskMap: TaskMap, task: Task): boolean {
    if (task.seriesId) {
        return true;
    }

    return collectSeriesTaskIds(taskMap, task).length > 1;
}

export function removeTasksFromMap(taskMap: TaskMap, taskIds: Set<string>): TaskMap {
    const next: TaskMap = {};

    for (const [date, tasks] of Object.entries(taskMap)) {
        const remaining = tasks.filter((task) => !taskIds.has(task.id));
        if (remaining.length) {
            next[date] = remaining;
        }
    }

    return next;
}
