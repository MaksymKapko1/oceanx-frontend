import React, {useEffect, useState} from 'react';
import {Menu, X, BookOpen, Zap, BarChart2, ChevronDown, Flame, ChartLine} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';
import WalletConnectButton from './WalletConnectButton';
import BridgeModal from "./BridgeModal/BridgeModal.jsx";
import './AppHeader.css';
import { getIdentityToken, useIdentityToken } from "@privy-io/react-auth";
import { privateFetch } from '../utils/pacificaUtils';
import { usePrivy } from "@privy-io/react-auth";
import { useWallets, useSignMessage } from '@privy-io/react-auth/solana';
import {createPortal} from "react-dom";
import bs58 from 'bs58';
import {toast} from "sonner";

// --- КОНСТАНТЫ ---
const BUILDER_CODE = "redwingss";
const MAX_FEE_RATE = "0.0001"; // Новая комиссия
const ADMIN_WALLET = "97TqKNTw7ZgHWpUDs2mYn4f1TWeLnGNFTRn3QufgD5Gh"; // Вставь свой кошелек

export default function AppHeader() {
    const { identityToken } = useIdentityToken();
    const { user } = usePrivy();
    const { wallets } = useWallets();
    const { signMessage } = useSignMessage();

    const walletAddress = user?.wallet?.address;

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const [isBridgeOpen, setIsBridgeOpen] = useState(false);

    const [isBuilderApproved, setIsBuilderApproved] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [showActivationModal, setShowActivationModal] = useState(false);
    const [isStatsHovered, setIsStatsHovered] = useState(false);

    const getLinkClass = ({ isActive }) => isActive ? 'nav-link active' : 'nav-link';
    const getMobileLinkClass = ({ isActive }) => isActive ? "mobile-link active" : "mobile-link";
    const closeMenu = () => setIsMobileMenuOpen(false);

    useEffect(() => {
        if (!walletAddress) return;
        if (!identityToken) return;

        const checkStatus = async () => {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';

            try {
                // 1. Проверяем БД
                const cachedRes = await privateFetch(`${baseUrl}/api/user/builder-status`, { method: 'GET' }, () => identityToken);
                const cachedData = await cachedRes.json();

                if (cachedData?.is_approved === true) {
                    setIsBuilderApproved(true);
                    return;
                }

                // 2. Идем на Pacifica ТОЛЬКО если в нашей БД false
                const res = await fetch(`https://api.pacifica.fi/api/v1/account/builder_codes/approvals?account=${walletAddress}`);
                const data = await res.json();

                // Проверяем и наличие кода, И то, что fee_rate >= MAX_FEE_RATE
                const isApproved = Array.isArray(data) && data.some(b =>
                    b.builder_code === BUILDER_CODE &&
                    parseFloat(b.max_fee_rate) >= parseFloat(MAX_FEE_RATE)
                );

                setIsBuilderApproved(isApproved);

                // Если биржа говорит true, а у нас было false -> обновляем БД на true
                if (isApproved && cachedData?.is_approved !== true) {
                    await privateFetch(`${baseUrl}/api/user/update-builder-status`, {
                        method: 'POST',
                        body: JSON.stringify({ is_approved: true })
                    }, () => identityToken);
                }

                if (!isApproved) {
                    setTimeout(() => setShowActivationModal(true), 1000);
                }

            } catch (e) {
                console.error('[BuilderStatus] ❌ Error:', e);
            }
        };

        checkStatus();
    }, [walletAddress, identityToken]);

    const handleActivationFromModal = async () => {
        await handleApproveBuilder();
        setShowActivationModal(false);
    };

    const handleApproveBuilder = async () => {
        if (!wallets || wallets.length === 0) {
            toast.error("Wallet not ready. Please wait or reconnect.");
            return;
        }
        setIsApproving(true);

        try {
            const selectedWallet = wallets.find(w => w.address === walletAddress)
                || wallets.find(w => w.walletClientType === 'phantom')
                || wallets[0];

            const timestamp = Date.now();
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';

            const payloadToSign = {
                timestamp: timestamp,
                expiry_window: 60000,
                type: "approve_builder_code",
                data: {
                    builder_code: BUILDER_CODE,
                    max_fee_rate: MAX_FEE_RATE
                }
            };

            const stringifySorted = (obj) => {
                if (typeof obj !== 'object' || obj === null) return JSON.stringify(obj);
                if (Array.isArray(obj)) return `[${obj.map(stringifySorted).join(',')}]`;
                const keys = Object.keys(obj).sort();
                const pairs = keys.map(k => `"${k}":${stringifySorted(obj[k])}`);
                return `{${pairs.join(',')}}`;
            };

            const messageString = stringifySorted(payloadToSign);
            const messageUint8Array = new TextEncoder().encode(messageString);

            const { signature: signatureUint8Array } = await signMessage({
                message: messageUint8Array,
                wallet: selectedWallet,
                options: { uiOptions: { title: 'Activate OceanX Builder' } }
            });

            const signatureBase58 = bs58.encode(signatureUint8Array);

            const finalPayload = {
                account: walletAddress,
                agent_wallet: null,
                signature: signatureBase58,
                timestamp: timestamp,
                expiry_window: 60000,
                builder_code: BUILDER_CODE,
                max_fee_rate: MAX_FEE_RATE
            };

            const pacificaResponse = await fetch("https://api.pacifica.fi/api/v1/account/builder_codes/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalPayload)
            });

            const responseText = await pacificaResponse.text();
            let pacificaResult;

            try {
                pacificaResult = JSON.parse(responseText);
            } catch (e) {
                pacificaResult = { error: responseText || "Unknown Pacifica Error" };
            }

            if (pacificaResponse.ok && !pacificaResult.error) {
                await privateFetch(`${baseUrl}/api/user/update-builder-status`, {
                    method: 'POST',
                    body: JSON.stringify({is_approved: true })
                }, () => identityToken);

                setIsBuilderApproved(true);
                setShowActivationModal(false);
                toast.success("OceanX Builder activated! You are ready to trade.");
            } else {
                toast.error(pacificaResult.error || "Exchange error");
            }

        } catch (err) {
            console.error("Error signing builder code:", err);
            if (err.message?.includes("User rejected")) {
                toast.warning("Activation declined in the wallet.");
            }
        } finally {
            setIsApproving(false);
        }
    };

    // ==========================================
    // ФУНКЦИЯ ДЛЯ АДМИНА: ОБНОВЛЕНИЕ FEE RATE
    // ==========================================
    const handleUpdateFeeRate = async () => {
        if (!wallets || wallets.length === 0) {
            toast.error("Wallet not ready.");
            return;
        }

        try {
            const selectedWallet = wallets.find(w => w.address === walletAddress)
                || wallets.find(w => w.walletClientType === 'phantom')
                || wallets[0];

            const timestamp = Date.now();
            const NEW_FEE_RATE = MAX_FEE_RATE; // Берем из константы (0.01)

            const payloadToSign = {
                timestamp: timestamp,
                expiry_window: 60000,
                type: "update_builder_code_fee_rate",
                data: {
                    builder_code: BUILDER_CODE,
                    fee_rate: NEW_FEE_RATE
                }
            };

            const stringifySorted = (obj) => {
                if (typeof obj !== 'object' || obj === null) return JSON.stringify(obj);
                if (Array.isArray(obj)) return `[${obj.map(stringifySorted).join(',')}]`;
                const keys = Object.keys(obj).sort();
                const pairs = keys.map(k => `"${k}":${stringifySorted(obj[k])}`);
                return `{${pairs.join(',')}}`;
            };

            const messageString = stringifySorted(payloadToSign);
            const messageUint8Array = new TextEncoder().encode(messageString);

            const { signature: signatureUint8Array } = await signMessage({
                message: messageUint8Array,
                wallet: selectedWallet,
                options: { uiOptions: { title: 'Update Builder Fee Rate' } }
            });

            const signatureBase58 = bs58.encode(signatureUint8Array);

            const finalPayload = {
                account: walletAddress,
                agent_wallet: null,
                signature: signatureBase58,
                timestamp: timestamp,
                expiry_window: 60000,
                builder_code: BUILDER_CODE,
                fee_rate: NEW_FEE_RATE
            };

            const pacificaResponse = await fetch("https://api.pacifica.fi/api/v1/builder/update_fee_rate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalPayload)
            });

            const responseText = await pacificaResponse.text();
            let pacificaResult;

            try {
                pacificaResult = JSON.parse(responseText);
            } catch (e) {
                pacificaResult = { error: responseText || "Unknown error" };
            }

            if (pacificaResponse.ok && !pacificaResult.error) {
                toast.success(`✅ Global Fee rate updated to ${NEW_FEE_RATE} on Pacifica!`);
            } else {
                toast.error(pacificaResult.error || "Exchange error");
            }
        } catch (err) {
            console.error("Error updating fee rate:", err);
            toast.error("Failed to update fee rate. Check console.");
        }
    };

    const handleTutorialClick = () => {
        if (location.pathname === '/copytrading') {
            window.dispatchEvent(new Event('open-copy-guide'));
        } else {
            window.dispatchEvent(new Event('open-guide'));
        }
    };

    return (
        <header className="app-header">
            <div className="header-container">
                <div className="header-left">
                    <div className="logo-group"></div>
                    <nav className="glass-btn desktop-nav">
                        <NavLink to="/" className={getLinkClass}>Main Page</NavLink>
                    </nav>
                    <nav className="glass-btn desktop-nav" style={{ marginLeft: '20px' }}>
                        <NavLink to="/copytrading" id="step-copy-trading" className={getLinkClass}>Copy Trading</NavLink>
                        <NavLink to="/strategies" className={getLinkClass}>Strategies</NavLink>
                        <div
                            className="nav-dropdown-wrapper"
                            onMouseEnter={() => setIsStatsHovered(true)}
                            onMouseLeave={() => setIsStatsHovered(false)}
                        >
                            <div className={`nav-link dropdown-trigger ${isStatsHovered ? 'hovered' : ''} ${location.pathname.includes('stats') || location.pathname.includes('liquidations') || location.pathname.includes('heatmaps') ? 'active' : ''}`}>
                                Insights <ChevronDown size={14} className={`arrow ${isStatsHovered ? 'open' : ''}`} />
                            </div>
                            {isStatsHovered && (
                                <div className="oceanx-glass-menu">
                                    <NavLink to="/stats" className="glass-item" onClick={() => setIsStatsHovered(false)}>
                                        <BarChart2 size={16} className="icon-cyan" />
                                        <span>Market Stats</span>
                                    </NavLink>
                                    <NavLink to="/liquidations" className="glass-item" onClick={() => setIsStatsHovered(false)}>
                                        <Flame size={16} className="icon-red" />
                                        <span>Liquidations</span>
                                    </NavLink>
                                    <NavLink to="/heatmaps" className="glass-item" onClick={() => setIsStatsHovered(false)}>
                                        <Zap size={16} className="icon-yellow" />
                                        <span>Heatmaps</span>
                                    </NavLink>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>

                <div className="header-actions">
                    {/* АДМИНСКАЯ КНОПКА ВИДНА ТОЛЬКО ТЕБЕ */}
                    {walletAddress === ADMIN_WALLET && (
                        <button
                            className="glass-btn icon-btn"
                            title="Update Pacifica Global Fee"
                            onClick={handleUpdateFeeRate}
                            style={{color: '#f59e0b', borderColor: '#f59e0b'}}
                        >
                            Update Global Fee
                        </button>
                    )}

                    <button className="glass-btn icon-btn" title="Show Tutorial" onClick={handleTutorialClick}>
                        <BookOpen size={20} />
                    </button>

                    <button className="glass-btn icon-btn desktop-only" title="Bridge / Deposit" onClick={() => setIsBridgeOpen(true)}>
                        <ArrowLeftRight size={20} />
                    </button>

                    {walletAddress && !isBuilderApproved && (
                        <button
                            className="activate-builder-btn"
                            onClick={handleApproveBuilder}
                            disabled={isApproving}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'linear-gradient(90deg, #0891b2, #0284c7)',
                                color: 'white', border: '1px solid rgba(34, 211, 238, 0.4)',
                                padding: '8px 16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
                                opacity: isApproving ? 0.7 : 1, boxShadow: '0 0 15px rgba(8, 145, 178, 0.3)'
                            }}
                        >
                            <Zap size={16} color="#22d3ee" fill="#22d3ee" />
                            {isApproving ? "Confirming..." : "Activate OceanX"}
                        </button>
                    )}

                    <div className="wallet-wrapper">
                        <WalletConnectButton />
                    </div>

                    <button className="glass-btn mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="mobile-dropdown">
                    <NavLink to="/" className={getMobileLinkClass} onClick={closeMenu}>Main Page</NavLink>
                    <NavLink to="/copytrading" className={getMobileLinkClass} onClick={closeMenu}>Copy Trading</NavLink>
                    <NavLink to="/stats" className={getMobileLinkClass} onClick={closeMenu}>Stats</NavLink>
                    <NavLink to="/heatmaps" className={getMobileLinkClass} onClick={closeMenu}>Heatmaps</NavLink>
                    <NavLink to="/liquidations" className={getMobileLinkClass} onClick={closeMenu}>Liquidations</NavLink>
                    <NavLink to="/strategies" className={getMobileLinkClass} onClick={closeMenu}>Strategies</NavLink>
                </div>
            )}

            {isBridgeOpen && <BridgeModal onClose={() => setIsBridgeOpen(false)} recipientAddress={walletAddress} />}

            {walletAddress && showActivationModal && createPortal(
                <div className="builder-modal-overlay">
                    <div className="builder-modal-content">
                        <div className="builder-modal-icon">
                            <Zap size={36} color="#22d3ee" fill="#22d3ee" />
                        </div>
                        <h2>Almost done!</h2>
                        <p>In order for OceanX to execute trades on your behalf, you need to activate builder code.</p>
                        <div className="builder-modal-features">
                            <div className="feature-item">1-Click Copy Trading</div>
                            <div className="feature-item">Best UX</div>
                            <div className="feature-item">Fast transaction processing</div>
                        </div>
                        <button className="builder-activate-btn" onClick={handleActivationFromModal} disabled={isApproving}>
                            {isApproving ? "Signing..." : "Activate OceanX"}
                        </button>
                        <button className="builder-skip-btn" onClick={() => setShowActivationModal(false)}>
                            Do it later
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </header>
    );
}