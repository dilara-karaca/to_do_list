import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { mockPlannerRecords, mockUsers, seedTasksFromRecords } from '../../auth/mockData';
import { PlannerPage } from '../PlannerPage';

export function AdminPlannerViewPage() {
    const { userId } = useParams();
    const user = useMemo(() => mockUsers.find((candidate) => candidate.id === userId), [userId]);
    const _plannerData = useMemo(() => seedTasksFromRecords(mockPlannerRecords.filter((record) => record.userId === userId)), [userId]);

    if (!user) {
        return <div className="text-white">Kullanıcı bulunamadı.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="rounded-[22px] border border-rose-300 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-100">
                Admin Görünümü — Bu kullanıcıya ait planner görüntüleniyor.
            </div>
            <PlannerPage />
        </div>
    );
}
