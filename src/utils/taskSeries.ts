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

export function collectSeriesTaskIds(taskMap: TaskMap, task: Task): string[] {
    const allTasks = Object.values(taskMap).flat();

    if (task.seriesId) {
        return allTasks.filter((candidate) => candidate.seriesId === task.seriesId).map((candidate) => candidate.id);
    }

    return allTasks
        .filter((candidate) => candidate.text === task.text && candidate.createdAt === task.createdAt)
        .map((candidate) => candidate.id);
}

export function isSeriesTask(taskMap: TaskMap, task: Task): boolean {
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
