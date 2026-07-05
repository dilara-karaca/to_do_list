import { CalendarDays, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Motion } from '../../utils/motion';

type HeaderProps = {
    currentDate: Date;
    monthLabel: string;
};

export default function Header({ currentDate, monthLabel }: HeaderProps) {
    return (
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2.5">
                <div>
                    <h1 className="bg-gradient-to-r from-slate-950 via-violet-950 to-slate-700 bg-clip-text text-[clamp(2.8rem,6vw,4.75rem)] font-semibold tracking-[-0.05em] text-transparent sm:text-[clamp(3.2rem,7vw,5.25rem)]">
                        To Do List
                    </h1>
                    <p className="mt-1.5 text-sm leading-6 text-slate-500 sm:text-base">
                        {format(currentDate, 'd MMMM yyyy, EEEE', { locale: tr })}
                    </p>
                </div>
            </div>

            <div className="glass-card inline-flex items-center gap-3 self-start rounded-full px-4 py-3 text-sm text-slate-600 lg:self-auto">
                <CalendarDays className="h-4 w-4 text-sky-500" />
                {monthLabel}
            </div>
        </header>
    );
}