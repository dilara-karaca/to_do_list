import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

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

        let unsubscribe: (() => void) | undefined;

        const finish = async () => {
            if (handledRef.current) {
                return true;
            }

            const { data, error } = await client.auth.getSession();

            if (import.meta.env.DEV) {
                console.log('[auth] getSession after callback', data.session);
            }

            if (error || !data.session) {
                return false;
            }

            handledRef.current = true;
            window.history.replaceState(null, '', '/auth/callback');
            navigate('/planner', { replace: true });
            return true;
        };

        const fail = (errorMessage: string) => {
            setMessage(errorMessage);
            window.setTimeout(() => navigate('/login', { replace: true }), 3000);
        };

        const handleCallback = async () => {
            const query = new URLSearchParams(window.location.search);
            const code = query.get('code');

            if (code) {
                const { error } = await client.auth.exchangeCodeForSession(code);
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

            const hasHashToken = window.location.hash.includes('access_token');
            const success = await finish();
            if (!success && !hasHashToken) {
                fail('Oturum oluşturulamadı. Lütfen tekrar giriş yapın.');
            }
        };

        void handleCallback();

        return () => {
            unsubscribe?.();
        };
    }, [navigate]);

    return (
        <div className="grid min-h-screen place-items-center text-slate-500">
            {message}
        </div>
    );
}
