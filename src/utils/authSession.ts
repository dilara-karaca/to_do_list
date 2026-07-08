import type { SupabaseClient } from '@supabase/supabase-js';

export type AuthUrlParams = {
    code: string | null;
    tokenHash: string | null;
    type: string | null;
    hasHashToken: boolean;
    isRecovery: boolean;
    hasAuthParams: boolean;
};

export function parseAuthUrlParams(url = window.location.href): AuthUrlParams {
    const parsedUrl = new URL(url);
    const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
    const query = parsedUrl.searchParams;
    const type = query.get('type') ?? hashParams.get('type');
    const code = query.get('code');
    const tokenHash = query.get('token_hash');
    const hasHashToken = hashParams.has('access_token');
    const isRecovery = type === 'recovery';

    return {
        code,
        tokenHash,
        type,
        hasHashToken,
        isRecovery,
        hasAuthParams: Boolean(code || tokenHash || hasHashToken || isRecovery),
    };
}

export function buildAuthTransferPath(pathname: string, url = window.location.href) {
    const parsedUrl = new URL(url);
    return `${pathname}${parsedUrl.search}${parsedUrl.hash}`;
}

export function clearAuthParamsFromUrl(pathname: string) {
    window.history.replaceState(null, '', pathname);
}

export async function establishRecoverySession(
    client: SupabaseClient,
    timeoutMs = 10000,
): Promise<{ ok: boolean; message?: string }> {
    const params = parseAuthUrlParams();

    if (!params.hasAuthParams) {
        return { ok: false, message: 'Şifre sıfırlama bağlantısı bulunamadı. Lütfen maildeki linki tekrar dene.' };
    }

    if (params.tokenHash && params.isRecovery) {
        const { error } = await client.auth.verifyOtp({
            token_hash: params.tokenHash,
            type: 'recovery',
        });

        if (error) {
            return { ok: false, message: error.message };
        }

        return { ok: true };
    }

    if (params.code) {
        const { error } = await client.auth.exchangeCodeForSession(params.code);

        if (error) {
            return { ok: false, message: error.message };
        }

        return { ok: true };
    }

    const immediateSession = await client.auth.getSession();
    if (immediateSession.data.session) {
        return { ok: true };
    }

    return waitForAuthSession(client, timeoutMs);
}

async function waitForAuthSession(
    client: SupabaseClient,
    timeoutMs: number,
): Promise<{ ok: boolean; message?: string }> {
    return new Promise((resolve) => {
        let settled = false;

        const finish = (result: { ok: boolean; message?: string }) => {
            if (settled) {
                return;
            }

            settled = true;
            clearTimeout(timer);
            subscription.subscription.unsubscribe();
            resolve(result);
        };

        const { data: subscription } = client.auth.onAuthStateChange((event, session) => {
            if (!session) {
                return;
            }

            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
                finish({ ok: true });
            }
        });

        void client.auth.getSession().then(({ data, error }) => {
            if (error) {
                finish({ ok: false, message: error.message });
                return;
            }

            if (data.session) {
                finish({ ok: true });
            }
        });

        const timer = setTimeout(() => {
            finish({
                ok: false,
                message: 'Bağlantı doğrulanamadı. Lütfen yeni bir şifre sıfırlama maili iste.',
            });
        }, timeoutMs);
    });
}
