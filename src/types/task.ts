export type Task = {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
};

export type TaskMap = Record<string, Task[]>;