export function UnauthorizedPage() {
    return (
        <div className="grid min-h-[60vh] place-items-center rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-center text-rose-950">
            <div>
                <div className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-500">403 Unauthorized</div>
                <h1 className="mt-3 text-3xl font-semibold">Bu alana erişim yetkiniz yok.</h1>
                <p className="mt-2 text-sm text-rose-800/80">Sadece role=admin kullanıcılar erişebilir.</p>
            </div>
        </div>
    );
}
