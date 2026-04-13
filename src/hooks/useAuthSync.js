import { useEffect, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export function useAuthSync() {
    const { ready, authenticated, user } = usePrivy();
    const hasSynced = useRef(false);

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
                    const res = await fetch(`${baseUrl}/api/auth/connect`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({wallet_address: walletAddress}),
                    })
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