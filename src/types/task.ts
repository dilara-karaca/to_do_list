export type Task = {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
    description?: string;
    userId?: string;
    seriesId?: string;
};

export type TaskDeleteScope = 'single' | 'series';

export type TaskMap = Record<string, Task[]>;

export type TaskRecurrence = 'daily' | 'weekly' | 'monthly';
