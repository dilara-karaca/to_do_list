import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { buildAuthTransferPath, clearAuthParamsFromUrl, establishRecoverySession, parseAuthUrlParams } from '../utils/authSession';

export function AuthCallbackPage() {
    const navigate = useNavigate();
    const [message, setMessage] = useState('Oturum oluşturuluyor...');
    const handledRef = useRef(false);

    useEffect(() => {
        const client = supabase;
        if (!client) {
            setMessage('Supabase yapılandırılmamış.');
            return;
        }

        const params = parseAuthUrlParams();

        if (params.isRecovery || (params.tokenHash && params.type === 'recovery')) {
            navigate(buildAuthTransferPath('/auth/reset-password'), { replace: true });
            return;
        }

        let unsubscribe: (() => void) | undefined;

        const finish = async () => {
            if (handledRef.current) {
                return true;
            }

            const { data, error } = await client.auth.getSession();

            if (error || !data.session) {
                return false;
            }

            handledRef.current = true;
            clearAuthParamsFromUrl('/auth/callback');
            navigate('/planner', { replace: true });
            return true;
        };

        const fail = (errorMessage: string) => {
            setMessage(errorMessage);
        };

        const handleCallback = async () => {
            if (params.code) {
                const { error } = await client.auth.exchangeCodeForSession(params.code);
                if (error) {
                    fail(error.message);
                    return;
                }

                const success = await finish();
                if (!success) {
                    fail('Oturum oluşturulamadı. Lütfen tekrar giriş yapın.');
                }
                return;
            }

            const { data: subscription } = client.auth.onAuthStateChange((event, session) => {
                if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
                    void finish();
                }
            });

            unsubscribe = () => subscription.subscription.unsubscribe();

            if (params.hasHashToken) {
                const success = await finish();
                if (!success) {
                    const recoveryResult = await establishRecoverySession(client);
                    if (recoveryResult.ok) {
                        navigate(buildAuthTransferPath('/auth/reset-password'), { replace: true });
                        return;
                    }
                }
                return;
            }

            if (!params.hasAuthParams) {
                fail('Oturum oluşturulamadı. Lütfen tekrar giriş yapın.');
            }
        };

        void handleCallback();

        return () => {
            unsubscribe?.();
        };
    }, [navigate]);

    return (
        <div className="grid min-h-screen place-items-center px-4 text-center text-slate-500">
            <p>{message}</p>
            <a href="/login" className="mt-4 text-sm font-medium text-slate-800 hover:underline">
                Giriş sayfasına dön
            </a>
        </div>
    );
}
