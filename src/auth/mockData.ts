import type { AppUser } from '../types/auth';
import type { Task } from '../types/task';

export type MockPlannerRecord = {
    id: string;
    userId: string;
    date: string;
    title: string;
    description: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
};

export const mockUsers: AppUser[] = [
    {
        id: 'user-1',
        fullName: 'Ayşe Yılmaz',
        email: 'ayse@example.com',
        role: 'user',
        emailConfirmed: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        lastSignInAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        active: true,
        avatarUrl: null,
    },
    {
        id: 'admin-1',
        fullName: 'Mert Demir',
        email: 'admin@example.com',
        role: 'admin',
        emailConfirmed: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        lastSignInAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        active: true,
        avatarUrl: null,
    },
];

export const mockPlannerRecords: MockPlannerRecord[] = [
    {
        id: 'task-1',
        userId: 'user-1',
        date: new Date().toISOString().slice(0, 10),
        title: 'Sprint toplantısı',
        description: 'Takım koordinasyonu',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

export const seedTasksFromRecords = (records: MockPlannerRecord[]): Record<string, Task[]> =>
    records.reduce<Record<string, Task[]>>((accumulator, record) => {
        const list = accumulator[record.date] ?? [];
        list.push({
            id: record.id,
            text: record.title,
            description: record.description,
            userId: record.userId,
            completed: record.completed,
            createdAt: record.createdAt,
        });
        accumulator[record.date] = list;
        return accumulator;
    }, {});
