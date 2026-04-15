import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAgentWallet } from "../../hooks/useAgentWallet.js";
import './FollowButton.css';
import { useIdentityToken } from "@privy-io/react-auth";
import { privateFetch} from "../../utils/pacificaUtils.js";

export default function FollowButton({ masterAddress, initialFollowed, onToggle, isReverse }) {

    const { authenticated, user, login, linkWallet } = usePrivy();
    const { bindAndSaveAgent } = useAgentWallet();
    const { getIdentityToken } = useIdentityToken();
    const [loading, setLoading] = useState(false);
    const [followed, setFollowed] = useState(initialFollowed || false);
    const { identityToken } = useIdentityToken();

    useEffect(() => {
        setFollowed(initialFollowed);
    }, [initialFollowed]);

    const handleToggleFollow = async (e) => {
        e.stopPropagation();

        if (!authenticated) {
            login();
            return;
        }

        try {

            setLoading(true);
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';

            // 1. Ищем ИМЕННО Solana-аккаунт в привязанных профилях Privy
            let solanaAccount = user.linkedAccounts.find(acc => acc.chainType === 'solana');

            // 2. Если Solana-кошелек не привязан к аккаунту Privy
            if (!followed && !solanaAccount) {
                console.log("🌐 Solana не привязана. Открываем окно привязки Phantom...");
                // Это откроет модалку Privy. После успешной привязки нужно будет нажать Follow еще раз.
                await linkWallet();
                return;
            }

            // Теперь мы точно знаем, что у нас есть Solana адрес (или мы в режиме Unfollow)
            let userWallet = solanaAccount?.address || user.wallet.address;

            if (!followed) {
                console.log("🔍 Проверяем статус агента для адреса:", userWallet);
                const statusRes = await fetch(`${baseUrl}/api/auth/status/${userWallet}`);
                const statusData = await statusRes.json();

                // 3. Если агента нет в БД — создаем его
                if (statusData.success && !statusData.has_agent) {
                    console.log("⚡ Агента нет. Запускаем создание...");
                    // Вызываем хук, который теперь сам найдет правильный кошелек внутри Privy
                    const trueSolanaAddress = await bindAndSaveAgent();

                    // Если адрес изменился (например, юзер выбрал другой в Phantom), обновляем
                    if (trueSolanaAddress) userWallet = trueSolanaAddress;
                }
            }

            // 4. Выполняем подписку/отписку
            const endpoint = followed ? '/api/copy/unfollow' : '/api/copy/follow';

            const response = await privateFetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                body: JSON.stringify({
                    master_wallet: masterAddress,
                    copy_amount: 100.0,
                    max_leverage: 10,
                    is_reverse: isReverse
                })
            }, () => identityToken);
            const data = await response.json();

            if (data.success) {
                const newStatus = !followed;
                setFollowed(newStatus);
                if (onToggle) onToggle(masterAddress, newStatus);
                console.log(`✅ Успешно. Теперь Following: ${newStatus}`);
            } else {
                console.error("❌ Полный ответ бэкенда:", data);
                console.error("❌ Backend Error:", data.error);
                alert(`Ошибка: ${data.error}`);
            }
        } catch (err) {
            console.error("🔴 Ошибка в процессе Follow:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            className={`follow-btn ${followed ? 'followed' : ''}`}
            onClick={handleToggleFollow}
            disabled={loading}
        >
            {loading ? '...' : (followed ? <span>Following</span> : 'Follow')}
        </button>
    );
}