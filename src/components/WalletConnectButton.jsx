import React, { useMemo, useState } from 'react';
import { Wallet, LogOut, ChevronDown, User } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import {usePacificaAccount} from "../hooks/usePacificaAccount.js";
import './AppHeader.css';

const generateAvatar = (address = '') => {
    const hash = (str) => {
        let h = 5381;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) + h) + str.charCodeAt(i);
            h = h & 0xffffffff;
        }
        return Math.abs(h);
    };

    const h = hash(address.toLowerCase());

    const palettes = [
        ['#22d3ee', '#0891b2', '#164e63'],
        ['#3b82f6', '#1d4ed8', '#1e3a5f'],
        ['#06b6d4', '#0e7490', '#083344'],
        ['#8b5cf6', '#6d28d9', '#2e1065'],
        ['#10b981', '#047857', '#064e3b'],
        ['#f59e0b', '#d97706', '#78350f'],
    ];

    const shapes = ['circle', 'rect', 'triangle', 'diamond'];

    const palette = palettes[h % palettes.length];
    const shape1 = shapes[(h >> 4) % shapes.length];
    const shape2 = shapes[(h >> 8) % shapes.length];
    const rot = (h >> 12) % 360;
    const cx = 30 + (h % 20) - 10;
    const cy = 30 + ((h >> 6) % 20) - 10;

    const renderShape = (type, color, size, x, y, rotation = 0) => {
        const t = `rotate(${rotation} ${x} ${y})`;
        if (type === 'circle')
            return `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" transform="${t}" opacity="0.9"/>`;
        if (type === 'rect')
            return `<rect x="${x - size}" y="${y - size}" width="${size * 2}" height="${size * 2}" rx="${size * 0.3}" fill="${color}" transform="${t}" opacity="0.9"/>`;
        if (type === 'triangle')
            return `<polygon points="${x},${y - size} ${x + size},${y + size} ${x - size},${y + size}" fill="${color}" transform="${t}" opacity="0.9"/>`;
        if (type === 'diamond')
            return `<polygon points="${x},${y - size} ${x + size * 0.7},${y} ${x},${y + size} ${x - size * 0.7},${y}" fill="${color}" transform="${t}" opacity="0.9"/>`;
        return '';
    };

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="30" fill="${palette[2]}"/>
            <g opacity="0.8">
                ${renderShape(shape1, palette[0], 18, cx, cy, rot)}
                ${renderShape(shape2, palette[1], 10, 60 - cx, 60 - cy, rot + 45)}
            </g>
        </svg>
    `.trim();

    return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export default function WalletConnectButton({ isMobile = false, onClick }) {
    const { login, logout, authenticated, user, ready } = usePrivy();
    const walletAddress = user?.wallet?.address;

    const [isHovered, setIsHovered] = useState(false);

    const {accountData, isLoading} = usePacificaAccount(walletAddress);

    const avatarUrl = useMemo(
        () => generateAvatar(walletAddress),
        [walletAddress]
    );

    const truncateAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    const handleLogout = (e) => {
        e.stopPropagation(); // Чтобы hover не дергался
        logout();
        setIsHovered(false);
        if (onClick) onClick();
    };

    if (isMobile) {
        return (
            <button
                className="mobile-connect-btn"
                onClick={authenticated ? handleLogout : login}
                disabled={!ready}
            >
                {authenticated ? (
                    <>
                        <LogOut size={18} />
                        <span>Disconnect</span>
                    </>
                ) : (
                    <>
                        <Wallet size={18} />
                        <span>Connect Wallet</span>
                    </>
                )}
            </button>
        );
    }

    return (
        <div
            className="wallet-button-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {authenticated ? (
                <button
                    className="glass-btn connect-btn"
                    disabled={!ready}
                    title="Hover to show menu"
                >
                    <img src={avatarUrl} alt="avatar" className="wallet-avatar" />

                    <span className="wallet-address-text">{truncateAddress(walletAddress)}</span>

                    <ChevronDown size={16} className={`dropdown-arrow ${isHovered ? 'open' : ''}`} />
                </button>
            ) : (
                <button
                    className="glass-btn connect-btn"
                    onClick={login}
                    disabled={!ready}
                >
                    <Wallet size={16} />
                    <span>Connect Wallet</span>
                </button>
            )}

            {authenticated && isHovered && (
                <div className="profile-dropdown-wrapper">
                    <div className="profile-dropdown-menu">
                        <div className="profile-header">
                            <img src={avatarUrl} alt="User Avatar" className="profile-dropdown-avatar" />
                            <div className="profile-info">
                                <span className="profile-dropdown-label">Connected Wallet</span>
                                <span className="profile-address-full">{truncateAddress(walletAddress)}</span>
                            </div>
                        </div>

                        <div className="profile-balance-section">
                            <span className="balance-label">Total Equity: </span>
                            {isLoading ? (
                                <span className="balance-value loading">Loading...</span>
                            ) : (
                                <span className="balance-value">
                                    ${accountData?.account_equity ? Number(accountData.account_equity).toFixed(2) : '0.00'}
                                </span>
                            )}
                        </div>

                        <div className="profile-pending-balance">
                            <span className="pending-label">Pending: </span>
                            {isLoading ? (
                                <span className="balance-value loading">Loading...</span>
                            ) : (
                                <span className="balance-pending">
                                    ${accountData?.pending_balance ? Number(accountData.pending_balance).toFixed(2) : '0.00'}
                                </span>
                            )}
                        </div>

                        <div className="profile-fee-lvl">
                            <span className="fee-label">Fee LVL: </span>
                            {isLoading ? (
                                <span className="balance-value loading">Loading...</span>
                            ) : (
                                <span className="fee-lvl">
                                    {accountData?.fee_level !== undefined ? accountData.fee_level : '0'}

                                    <span className="fee-rates" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85em', marginLeft: '6px' }}>
                                        (M: {accountData?.maker_fee !== undefined ? (Number(accountData.maker_fee) * 100).toFixed(3) + '%' : '0%'}
                                        {' '}|{' '}
                                        T: {accountData?.taker_fee !== undefined ? (Number(accountData.taker_fee) * 100).toFixed(3) + '%' : '0%'})
                                    </span>
                                </span>

                            )}
                        </div>

                        <div className="dropdown-divider"></div>
                        <button className="dropdown-item text-red" onClick={handleLogout}>
                            <LogOut size={16} />
                            <span>Disconnect</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}