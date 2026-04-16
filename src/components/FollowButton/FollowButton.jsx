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

            let solanaAccount = user.linkedAccounts.find(acc => acc.chainType === 'solana');

            if (!followed && !solanaAccount) {
                await linkWallet();
                return;
            }

            let userWallet = solanaAccount?.address || user.wallet.address;

            if (!followed) {
                const statusRes = await fetch(`${baseUrl}/api/auth/status/${userWallet}`);
                const statusData = await statusRes.json();

                if (statusData.success && !statusData.has_agent) {;
                    const trueSolanaAddress = await bindAndSaveAgent();

                    if (trueSolanaAddress) userWallet = trueSolanaAddress;
                }
            }

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
                console.log(`✅ Following: ${newStatus}`);
            } else {
                console.error(`❌ Follow Error: ${data.error}`);
            }
        } catch (err) {
            console.error("🔴 Follow process error:", err);
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