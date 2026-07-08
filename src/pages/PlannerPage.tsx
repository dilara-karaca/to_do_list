import { AnimatePresence } from 'framer-motion';
import { format, parseISO, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Calendar from '../components/Calendar/Calendar';
import DayModal from '../components/DayModal/DayModal';
import Header from '../components/Header/Header';
import { useAuth } from '../auth/AuthProvider';
import { defaultSelectedDate } from '../data/defaultDate';
import { isSupabaseConfigured } from '../lib/supabase';
import {
    collectTaskIds,
    deleteSingleTask,
    fetchOwnTasks,
    syncTaskMapForUser,
    upsertSingleTask,
} from '../lib/taskService';
import type { Task } from '../types/task';
import type { TaskMap } from '../types/task';
import { dateKey, isPastDate } from '../utils/date';
import { Motion } from '../utils/motion';
import {
    loadLegacyTaskMap,
    loadSelectedDate,
    loadTaskMapForUser,
    saveSelectedDate,
    saveTaskMapForUser,
} from '../utils/storage';

export function PlannerPage() {
    const { user } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(() => new Date(defaultSelectedDate.getFullYear(), defaultSelectedDate.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(defaultSelectedDate);
    const [taskMap, setTaskMap] = useState<TaskMap>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tasksLoading, setTasksLoading] = useState(true);
    const [remoteReady, setRemoteReady] = useState(false);
    const previousTaskIdsRef = useRef<Set<string>>(new Set());
    const taskMapRef = useRef<TaskMap>({});

    useEffect(() => {
        taskMapRef.current = taskMap;
    }, [taskMap]);

    useEffect(() => {
        const storedSelected = loadSelectedDate();
        if (storedSelected) {
            const parsedDate = parseISO(storedSelected);
            setSelectedDate(parsedDate);
            setCurrentMonth(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
        }
    }, []);

    useEffect(() => {
        if (!user?.id) {
            if (!isSupabaseConfigured) {
                const legacyTasks = loadLegacyTaskMap();
                setTaskMap(legacyTasks);
                previousTaskIdsRef.current = collectTaskIds(legacyTasks);
                setTasksLoading(false);
                setRemoteReady(true);
            }
            return;
        }

        let cancelled = false;

        const loadTasks = async () => {
            setTasksLoading(true);
            setRemoteReady(false);

            if (isSupabaseConfigured) {
                const remoteTasks = await fetchOwnTasks(user.id);
                if (cancelled) {
                    return;
                }

                if (Object.keys(remoteTasks).length) {
                    setTaskMap(remoteTasks);
                    previousTaskIdsRef.current = collectTaskIds(remoteTasks);
                    saveTaskMapForUser(user.id, remoteTasks);
                    setTasksLoading(false);
                    setRemoteReady(true);
                    return;
                }

                const cachedTasks = loadTaskMapForUser(user.id);
                const legacyTasks = Object.keys(cachedTasks).length ? cachedTasks : loadLegacyTaskMap();

                if (Object.keys(legacyTasks).length) {
                    setTaskMap(legacyTasks);
                    previousTaskIdsRef.current = collectTaskIds(legacyTasks);
                    await syncTaskMapForUser(user.id, legacyTasks, new Set());
                    saveTaskMapForUser(user.id, legacyTasks);
                    setTasksLoading(false);
                    setRemoteReady(true);
                    return;
                }

                setTaskMap({});
                previousTaskIdsRef.current = new Set();
                setTasksLoading(false);
                setRemoteReady(true);
                return;
            }

            const localTasks = loadTaskMapForUser(user.id);
            setTaskMap(localTasks);
            previousTaskIdsRef.current = collectTaskIds(localTasks);
            setTasksLoading(false);
            setRemoteReady(true);
        };

        void loadTasks();

        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    const persistTasks = useCallback(async (nextTaskMap: TaskMap, previousIds: Set<string>) => {
        if (!user?.id) {
            return;
        }

        saveTaskMapForUser(user.id, nextTaskMap);

        if (!isSupabaseConfigured || !remoteReady) {
            return;
        }

        const result = await syncTaskMapForUser(user.id, nextTaskMap, previousIds);
        if (result.ok) {
            previousTaskIdsRef.current = collectTaskIds(nextTaskMap);
        }
    }, [remoteReady, user?.id]);

    useEffect(() => {
        if (!user?.id || !remoteReady) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            void persistTasks(taskMapRef.current, previousTaskIdsRef.current);
        }, 500);

        return () => window.clearTimeout(timeoutId);
    }, [taskMap, persistTasks, remoteReady, user?.id]);

    useEffect(() => {
        const flushOnExit = () => {
            if (!user?.id || !remoteReady || !isSupabaseConfigured) {
                return;
            }

            void syncTaskMapForUser(user.id, taskMapRef.current, previousTaskIdsRef.current);
        };

        window.addEventListener('beforeunload', flushOnExit);
        return () => window.removeEventListener('beforeunload', flushOnExit);
    }, [remoteReady, user?.id]);

    useEffect(() => {
        saveSelectedDate(dateKey(selectedDate));
    }, [selectedDate]);

    const activeDateKey = useMemo(() => dateKey(selectedDate), [selectedDate]);
    const activeTasks = taskMap[activeDateKey] ?? [];
    const canEditSelectedDate = !isPastDate(selectedDate);

    const selectDate = (date: Date) => {
        setSelectedDate(date);
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
        setIsModalOpen(true);
    };

    const updateTasks = (nextTasks: Task[]) => {
        if (!canEditSelectedDate) {
            return;
        }

        setTaskMap((previous) => ({ ...previous, [activeDateKey]: nextTasks }));
    };

    const syncTaskImmediately = async (nextTasks: Task[], removedTaskId?: string) => {
        if (!user?.id || !isSupabaseConfigured || !remoteReady) {
            return;
        }

        if (removedTaskId) {
            await deleteSingleTask(user.id, removedTaskId);
            previousTaskIdsRef.current.delete(removedTaskId);
            return;
        }

        await Promise.all(nextTasks.map((task) => upsertSingleTask(user.id, activeDateKey, task)));
        nextTasks.forEach((task) => previousTaskIdsRef.current.add(task.id));
    };

    const handleToggleTask = (taskId: string) => {
        if (!canEditSelectedDate) {
            return;
        }

        const nextTasks = activeTasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task));
        updateTasks(nextTasks);
        void syncTaskImmediately(nextTasks.filter((task) => task.id === taskId));
    };

    const handleAddTask = (text: string) => {
        if (!canEditSelectedDate) {
            return;
        }

        const trimmedText = text.trim();
        if (!trimmedText) {
            return;
        }

        const newTask: Task = {
            id: crypto.randomUUID(),
            text: trimmedText,
            completed: false,
            createdAt: new Date().toISOString(),
        };
        const nextTasks = [newTask, ...activeTasks];
        updateTasks(nextTasks);
        void syncTaskImmediately([newTask]);
    };

    const handleDeleteTask = (taskId: string) => {
        if (!canEditSelectedDate) {
            return;
        }

        updateTasks(activeTasks.filter((task) => task.id !== taskId));
        void syncTaskImmediately([], taskId);
    };

    if (tasksLoading) {
        return <div className="grid min-h-[420px] place-items-center text-slate-500">Planların yükleniyor...</div>;
    }

    return (
        <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <Motion.div aria-hidden="true" className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" animate={{ y: [0, -18, 0], x: [0, 12, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
                <Motion.div aria-hidden="true" className="absolute right-8 top-28 h-80 w-80 rounded-full bg-violet-200/35 blur-3xl" animate={{ y: [0, 16, 0], x: [0, -10, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
                <Motion.div aria-hidden="true" className="absolute bottom-4 left-1/3 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" animate={{ y: [0, 12, 0], x: [0, 10, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
            </div>

            <Motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="glass-panel relative mx-auto flex w-full max-w-7xl flex-col rounded-[32px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
                <Header currentDate={selectedDate} monthLabel={format(currentMonth, 'MMMM yyyy', { locale: tr })} />
                <div className="mt-4 flex flex-col gap-4 lg:mt-5">
                    <Calendar currentMonth={currentMonth} onMonthChange={setCurrentMonth} onDaySelect={selectDate} selectedDate={selectedDate} taskMap={taskMap} onPreviousMonth={() => setCurrentMonth((month) => subMonths(month, 1))} onNextMonth={() => setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} />
                </div>
            </Motion.main>

            <AnimatePresence>
                {isModalOpen ? <DayModal key={activeDateKey} date={selectedDate} tasks={activeTasks} editable={canEditSelectedDate} onClose={() => setIsModalOpen(false)} onAddTask={handleAddTask} onDeleteTask={handleDeleteTask} onToggleTask={handleToggleTask} /> : null}
            </AnimatePresence>
        </div>
    );
}
