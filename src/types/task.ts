export type Task = {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
    description?: string;
    userId?: string;
};

export type TaskMap = Record<string, Task[]>;