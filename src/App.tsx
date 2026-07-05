import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { format, parseISO, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import Header from './components/Header/Header';
import Calendar from './components/Calendar/Calendar';
import DayModal from './components/DayModal/DayModal';
import { defaultSelectedDate } from './data/defaultDate';
import type { Task } from './types/task';
import type { TaskMap } from './types/task';
import { dateKey, isPastDate } from './utils/date';
import { Motion } from './utils/motion';
import { loadTaskMap, saveSelectedDate, saveTaskMap } from './utils/storage';

const storageDateKey = 'gorev-planlayici.selected-date';

function App() {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = defaultSelectedDate;
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selectedDate, setSelectedDate] = useState(defaultSelectedDate);
    const [taskMap, setTaskMap] = useState<TaskMap>(() => loadTaskMap());
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const storedSelected = localStorage.getItem(storageDateKey);
        if (storedSelected) {
            const parsedDate = parseISO(storedSelected);
            setSelectedDate(parsedDate);
            setCurrentMonth(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
        }
    }, []);

    useEffect(() => {
        saveTaskMap(taskMap);
    }, [taskMap]);

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

        setTaskMap((previous) => ({
            ...previous,
            [activeDateKey]: nextTasks,
        }));
    };

    const handleToggleTask = (taskId: string) => {
        if (!canEditSelectedDate) {
            return;
        }

        updateTasks(
            activeTasks.map((task) =>
                task.id === taskId ? { ...task, completed: !task.completed } : task,
            ),
        );
    };

    const handleAddTask = (text: string) => {
        if (!canEditSelectedDate) {
            return;
        }

        const trimmedText = text.trim();
        if (!trimmedText) {
            return;
        }

        const nextTask: Task = {
            id: crypto.randomUUID(),
            text: trimmedText,
            completed: false,
            createdAt: new Date().toISOString(),
        };

        updateTasks([nextTask, ...activeTasks]);
    };

    const handleDeleteTask = (taskId: string) => {
        if (!canEditSelectedDate) {
            return;
        }

        updateTasks(activeTasks.filter((task) => task.id !== taskId));
    };

    const goToPreviousMonth = () => {
        setCurrentMonth((month) => subMonths(month, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1));
    };

    return (
        <div className="relative min-h-screen overflow-x-hidden px-4 py-6 text-slate-800 sm:px-6 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <Motion.div
                    aria-hidden="true"
                    className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl"
                    animate={{ y: [0, -18, 0], x: [0, 12, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <Motion.div
                    aria-hidden="true"
                    className="absolute right-8 top-28 h-80 w-80 rounded-full bg-violet-200/35 blur-3xl"
                    animate={{ y: [0, 16, 0], x: [0, -10, 0] }}
                    transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                />
                <Motion.div
                    aria-hidden="true"
                    className="absolute bottom-4 left-1/3 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl"
                    animate={{ y: [0, 12, 0], x: [0, 10, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            <Motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="glass-panel relative mx-auto flex w-full max-w-7xl flex-col rounded-[32px] px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6"
            >
                <Header currentDate={selectedDate} monthLabel={format(currentMonth, 'MMMM yyyy', { locale: tr })} />

                <div className="mt-4 flex flex-col gap-4 lg:mt-5">
                    <Calendar
                        currentMonth={currentMonth}
                        onMonthChange={setCurrentMonth}
                        onDaySelect={selectDate}
                        selectedDate={selectedDate}
                        taskMap={taskMap}
                        onPreviousMonth={goToPreviousMonth}
                        onNextMonth={goToNextMonth}
                    />
                </div>
            </Motion.main>

            <AnimatePresence>
                {isModalOpen ? (
                    <DayModal
                        key={activeDateKey}
                        date={selectedDate}
                        tasks={activeTasks}
                        editable={canEditSelectedDate}
                        onClose={() => setIsModalOpen(false)}
                        onAddTask={handleAddTask}
                        onDeleteTask={handleDeleteTask}
                        onToggleTask={handleToggleTask}
                    />
                ) : null}
            </AnimatePresence>
        </div>
    );
}

export default App;