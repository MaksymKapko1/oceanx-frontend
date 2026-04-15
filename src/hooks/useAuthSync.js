import { useEffect, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useIdentityToken, getIdentityToken } from "@privy-io/react-auth";
import { privateFetch } from '../utils/pacificaUtils';

export function useAuthSync() {
    const { ready, authenticated, user, getAccessToken } = usePrivy();
    const hasSynced = useRef(false);
    const { identityToken } = useIdentityToken();

    useEffect(() => {
        if (ready && !authenticated) {
            hasSynced.current = false;
            return;
        }

        if (ready && authenticated && user?.wallet?.address && !hasSynced.current) {
            const syncUserWithBackend = async () => {
                const walletAddress = user.wallet.address;
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';

                try {
                    const res = await privateFetch(`${baseUrl}/api/auth/connect`, {
                        method: 'POST',
                        body: JSON.stringify({}),
                    }, () => identityToken)
                    const data = await res.json();
                    if (data.success) {
                        console.log('✅ Юзер успешно сохранен в БД:', data.user);
                        hasSynced.current = true;
                    } else {
                        console.error('❌ Бэкенд вернул ошибку при сохранении юзера:', data.error);
                    }
                } catch (err) {
                    console.error('❌ Сетевая ошибка при синхронизации юзера:', err);
                }
            }
            void syncUserWithBackend();
        }
    }, [ready, authenticated, user])
}