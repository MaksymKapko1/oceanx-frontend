import React, {useEffect, useState} from 'react';
import {Menu, X, BookOpen, Zap, BarChart2, ChevronDown, Flame} from 'lucide-react';
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

const BUILDER_CODE = "redwingss";
const MAX_FEE_RATE = "0.001";

export default function AppHeader() {
    const { identityToken } = useIdentityToken();
    const { user } = usePrivy();
    const { wallets } = useWallets();
    const { signMessage } = useSignMessage(); // 👈 Достаем метод подписи для Solana

    const walletAddress = user?.wallet?.address;

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const [isBridgeOpen, setIsBridgeOpen] = useState(false);

    const [isBuilderApproved, setIsBuilderApproved] = useState(true);
    const [isApproving, setIsApproving] = useState(false);
    const [showActivationModal, setShowActivationModal] = useState(false);

    const [isStatsHovered, setIsStatsHovered] = useState(false)

    const getLinkClass = ({ isActive }) => isActive ? 'nav-link active' : 'nav-link';
    const getMobileLinkClass = ({ isActive }) => isActive ? "mobile-link active" : "mobile-link";

    const closeMenu = () => setIsMobileMenuOpen(false);

    useEffect(() => {
        if (!walletAddress) return;

        const checkStatus = async () => {
            try {
                const res = await fetch(`https://api.pacifica.fi/api/v1/account/builder_codes/approvals?account=${walletAddress}`);
                const data = await res.json();

                const isApproved = Array.isArray(data) && data.some(b => b.builder_code === BUILDER_CODE);
                setIsBuilderApproved(isApproved);

                if (!isApproved) {
                    setTimeout(() => setShowActivationModal(true), 1000);
                }

                await privateFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/user/update-builder-status`, {
                    method: 'POST',
                    body: JSON.stringify({is_approved: isApproved })
                }, () => identityToken);
            } catch (e) {
                console.error("Status check failed", e);
            }
        };

        checkStatus();
    }, [walletAddress]);

    const handleActivationFromModal = async () => {
        await handleApproveBuilder();
        setShowActivationModal(false);
    };

    const handleApproveBuilder = async () => {
        if (!wallets || wallets.length === 0) {
            alert("Wallet not ready. Please wait or reconnect.");
            return;
        }
        setIsApproving(true);

        try {
            // Ищем нужный кошелек (Phantom / Solana)
            const selectedWallet = wallets.find(w => w.address === walletAddress)
                || wallets.find(w => w.walletClientType === 'phantom')
                || wallets[0];

            const timestamp = Date.now();
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

            // 👈 1. Переводим строку в Uint8Array, как требует Privy Solana SDK
            const messageUint8Array = new TextEncoder().encode(messageString);

            // 👈 2. Вызываем подпись через useSignMessage
            const { signature: signatureUint8Array } = await signMessage({
                message: messageUint8Array,
                wallet: selectedWallet,
                options: {
                    uiOptions: {
                        title: 'Activate OceanX Builder'
                    }
                }
            });

            // 👈 3. Кодируем результат в base58
            const signatureBase58 = bs58.encode(signatureUint8Array);

            const finalPayload = {
                account: walletAddress,
                agent_wallet: null,
                signature: signatureBase58, // 👈 4. Передаем готовую подпись
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
                pacificaResult = { error: responseText }; // Ловит текстовые ошибки типа "Invalid message"
            }

            if (pacificaResponse.ok && !pacificaResult.error) {
                await privateFetch(`${baseUrl}/api/user/update-builder-status`, {
                    method: 'POST',
                    body: JSON.stringify({is_approved: true })
                }, () => identityToken);

                setIsBuilderApproved(true);
                setShowActivationModal(false);
                alert("OceanX Builder activated! You are ready to trade.");
            } else {
                console.error("Биржа отклонила запрос:", pacificaResult);
                alert(`Error: ${pacificaResult.error || 'Check console'}`);
            }

        } catch (err) {
            console.error("Error signing builder code:", err);
            if (err.message?.includes("User rejected")) {
                alert("Activation has been declined in the wallet.");
            }
        } finally {
            setIsApproving(false);
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
                    <div className="logo-group">
                    </div>

                    <nav className="glass-btn desktop-nav">
                        <NavLink to="/" className={getLinkClass}>Main Page</NavLink>
                    </nav>

                    <nav className="glass-btn desktop-nav" style={{ marginLeft: '20px' }}>
                        <NavLink to="/copytrading" id="step-copy-trading" className={getLinkClass}>Copy Trading</NavLink>
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
                        {/*<NavLink to="/stats" id="step-market-stats" className={getLinkClass}>Stats</NavLink>*/}
                        {/*<NavLink to="/heatmaps" id="step-heatmaps" className={getLinkClass}>Heatmaps</NavLink>*/}
                    </nav>
                </div>

                <div className="header-actions">
                    <button
                        className="glass-btn icon-btn"
                        title="Show Tutorial"
                        onClick={handleTutorialClick}
                    >
                        <BookOpen size={20} />
                    </button>

                    <button
                        className="glass-btn icon-btn desktop-only"
                        title="Bridge / Deposit"
                        onClick={() => setIsBridgeOpen(true)}
                    >
                        <ArrowLeftRight size={20} />
                    </button>

                    {walletAddress && !isBuilderApproved && (
                        <button
                            className="activate-builder-btn"
                            onClick={handleApproveBuilder}
                            disabled={isApproving}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'linear-gradient(90deg, #0891b2, #0284c7)', // 👈 Поменяли цвета
                                color: 'white',
                                border: '1px solid rgba(34, 211, 238, 0.4)', // 👈 Добавили бордер
                                padding: '8px 16px',
                                borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
                                opacity: isApproving ? 0.7 : 1,
                                boxShadow: '0 0 15px rgba(8, 145, 178, 0.3)' // 👈 Добавили легкое свечение
                            }}
                        >
                            <Zap size={16} color="#22d3ee" fill="#22d3ee" />
                            {isApproving ? "Confirming..." : "Activate OceanX"}
                        </button>
                    )}

                    <div className="wallet-wrapper">
                        <WalletConnectButton />
                    </div>

                    <button
                        className="glass-btn mobile-menu-btn"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
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
                </div>
            )}

            {isBridgeOpen && (
                <BridgeModal
                    onClose={() => setIsBridgeOpen(false)}
                    recipientAddress={walletAddress}
                />
            )}

            {/* Модалка активации Билдер-кода */}
            {walletAddress && showActivationModal && createPortal(
                <div className="builder-modal-overlay">
                    <div className="builder-modal-content">
                        <div className="builder-modal-icon">
                            {/* 👈 Изменили цвет молнии на фирменный циановый */}
                            <Zap size={36} color="#22d3ee" fill="#22d3ee" />
                        </div>
                        <h2>Almost done!</h2>
                        <p>
                            In order for OceanX to execute trades on your behalf,
                            you need to activate builder code.
                        </p>
                        <div className="builder-modal-features">
                            {/* 👈 Убрали эмодзи, галочки теперь рисует CSS */}
                            <div className="feature-item">1-Click Copy Trading</div>
                            <div className="feature-item">Best UX</div>
                            <div className="feature-item">Fast transaction processing</div>
                        </div>

                        <button
                            className="builder-activate-btn"
                            onClick={handleActivationFromModal}
                            disabled={isApproving}
                        >
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