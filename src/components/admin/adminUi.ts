export const adminUi = {
    page: 'space-y-6',
    card: 'rounded-[24px] glass-card p-5',
    cardSoft: 'rounded-2xl border border-white/70 bg-white/70 px-4 py-3',
    title: 'text-3xl font-semibold text-slate-900',
    subtitle: 'text-xs uppercase tracking-[0.3em] text-slate-500',
    muted: 'text-sm text-slate-600',
    label: 'text-sm text-slate-500',
    value: 'text-3xl font-semibold text-slate-900',
    sectionTitle: 'text-lg font-semibold text-slate-900',
    link: 'text-sm font-medium text-slate-700 hover:text-slate-950',
    button: 'inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800',
    buttonSecondary: 'h-11 rounded-2xl border border-white/70 bg-white/80 px-4 text-sm text-slate-700 transition hover:bg-white',
    input: 'h-12 w-full rounded-2xl border border-white/70 bg-white/80 px-4 text-slate-800 outline-none placeholder:text-slate-400',
    error: 'rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700',
    warning: 'rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800',
    table: 'w-full text-left text-sm text-slate-700',
    tableHead: 'bg-slate-50/80 text-slate-500',
    badgeActive: 'rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700',
    badgeInactive: 'rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-700',
    chip: 'rounded-full bg-slate-950 px-3 py-1.5 text-xs text-white hover:bg-slate-800',
};

export const formatAdminError = (error: unknown) => {
    if (error instanceof TypeError && /failed to fetch/i.test(error.message)) {
        return 'Supabase bağlantısı kurulamadı. fix-admin.sql dosyasını çalıştırdığından ve internet bağlantının açık olduğundan emin ol.';
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'Admin verileri yüklenemedi.';
};
