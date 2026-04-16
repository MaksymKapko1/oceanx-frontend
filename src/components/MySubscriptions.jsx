import React, { useState, useEffect } from 'react';
import { usePrivy } from "@privy-io/react-auth";
import { Copy, Check, XCircle } from 'lucide-react';
import { getIdentityToken, useIdentityToken } from "@privy-io/react-auth";
import "./MySybscriptions.css";
import {privateFetch} from "../utils/pacificaUtils.js";

export default function MySubscriptions() {
    const { authenticated, user } = usePrivy();
    const { identityToken } = useIdentityToken();
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedAddress, setCopiedAddress] = useState(null);


    const fetchSubscriptions = async () => {
        if (!authenticated || !user?.wallet?.address) {
            setLoading(false);
            return;
        }

        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
            const res = await fetch(`${baseUrl}/api/copy/subscriptions/${user.wallet.address}`);
            const data = await res.json();

            if (data.success && data.subscriptions) {
                const activeBots = Object.entries(data.subscriptions)
                    .filter(([address, isActive]) => isActive === true)
                    .map(([address]) => ({ address }));

                setSubscriptions(activeBots);
            }
        } catch (err) {
            console.error("Subscription loading error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
        const interval = setInterval(fetchSubscriptions, 30000);
        return () => clearInterval(interval);
    }, [authenticated, user?.wallet?.address]);

    const handleUnfollow = async (masterAddr) => {
        if (!window.confirm(`Are you sure you want to stop following ${masterAddr.slice(0,6)}...?`)) return;

        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
            const res = await privateFetch(`${baseUrl}/api/copy/unfollow`, {
                method: 'POST',
                body: JSON.stringify({
                    master_wallet: masterAddr
                })
            }, () => identityToken);
            const data = await res.json();

            if (data.success) {
                setSubscriptions(prev => prev.filter(s => s.address !== masterAddr));
            }
        } catch (err) {
            console.error("Error while unsubscribing:", err);
        }
    };

    const handleCopy = (address) => {
        navigator.clipboard.writeText(address);
        setCopiedAddress(address);
        setTimeout(() => setCopiedAddress(null), 2000);
    };

    return (
        <div className="subscriptions-panel">
            <div className="subs-header">
                <h3>Active Bots</h3>
                <span className="subs-count">{subscriptions.length}</span>
            </div>

            <div className="subs-list">
                {loading ? (
                    <div className="subs-empty">Loading bots...</div>
                ) : subscriptions.length === 0 ? (
                    <div className="subs-empty">No active bots.</div>
                ) : (
                    subscriptions.map((sub, idx) => {
                        const addr = sub.address;
                        const shortAddr = `${addr.slice(0, 4)}...${addr.slice(-4)}`;

                        return (
                            <div key={idx} className="sub-card">
                                <div className="sub-info">
                                    <div className="sub-addr-row">
                                        <span className="sub-address">{shortAddr}</span>
                                        <button
                                            className="sub-copy-btn"
                                            onClick={() => handleCopy(addr)}
                                            data-tooltip={copiedAddress === addr ? "Copied!" : "Copy"}
                                        >
                                            {copiedAddress === addr ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                    </div>
                                    <span className="sub-status">Active</span>
                                </div>

                                <div className="sub-actions">
                                    <button
                                        className="sub-unfollow-btn"
                                        onClick={() => handleUnfollow(addr)}
                                        title="Stop Bot"
                                    >
                                        <XCircle size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}