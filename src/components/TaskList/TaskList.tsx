import { AnimatePresence } from 'framer-motion';
import type { Task, TaskDeleteScope } from '../../types/task';
import TaskItem from '../TaskItem/TaskItem';

type TaskListProps = {
    tasks: Task[];
    editable: boolean;
    isSeriesTask: (id: string) => boolean;
    onToggle: (id: string) => void;
    onDelete: (id: string, scope?: TaskDeleteScope) => void;
};

export default function TaskList({ tasks, editable, isSeriesTask, onToggle, onDelete }: TaskListProps) {
    if (!tasks.length) {
        return (
            <div className="px-2 py-6 text-center text-sm text-slate-500">
                Görev yok.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <AnimatePresence mode="popLayout">
                {tasks.map((task) => (
                    <TaskItem
                        key={task.id}
                        task={task}
                        editable={editable}
                        isSeries={isSeriesTask(task.id)}
                        onToggle={onToggle}
                        onDelete={onDelete}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
