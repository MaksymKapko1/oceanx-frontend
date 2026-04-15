import React, { useEffect, useState, useMemo } from 'react';
import './UserTradingSection.css';
import {usePrivy} from "@privy-io/react-auth";
import { usePacificaAccount } from "../hooks/usePacificaAccount";
import { useMarketStats } from '../hooks/useMarketStats';
import { useIdentityToken, getIdentityToken } from "@privy-io/react-auth";
import { privateFetch } from '../utils/pacificaUtils';

export default function UserTradingSection() {
    const { authenticated, user, getAccessToken } = usePrivy();
    const walletAddress = user?.wallet?.address;

    const { identityToken } = useIdentityToken();

    const [volumePerTrade, setVolumePerTrade] = useState(50);
    const [slippage, setSlippage]             = useState(1);
    const [maxExposure, setMaxExposure]       = useState(500);
    const [allowedMarkets, setAllowedMarkets] = useState([]);
    const [availableMarkets, setAvailableMarkets] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [isLoading, setIsLoading]   = useState(true);
    const [isSaving, setIsSaving]     = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // null | 'success' | 'error'

    const { stats } = useMarketStats();
    const { accountData, isLoading: isBalanceLoading } = usePacificaAccount(walletAddress);
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';

    const availableBalance = useMemo(() =>
            accountData?.available_to_spend ? parseFloat(accountData.available_to_spend) : 0
        , [accountData]);

    const maxPositions = useMemo(() => {
        if (volumePerTrade <= 0) return 0;
        return Math.floor(maxExposure / volumePerTrade);
    }, [volumePerTrade, maxExposure]);

    // Подгружаем список рынков
    useEffect(() => {
        if (stats?.top_volume) {
            setAvailableMarkets(stats.top_volume.map(m => m.symbol));
        }
    }, [stats]);

    // Загружаем сохранённые настройки
    useEffect(() => {
        const fetchSettings = async () => {
            if (!authenticated || !walletAddress) { setIsLoading(false); return; }
            try {
                const authToken = await getAccessToken();
                const res  = await fetch(`${baseUrl}/api/user/settings/${walletAddress}`);
                const data = await res.json();
                if (data.success && data.settings) {
                    const s = data.settings;
                    setVolumePerTrade(s.volume_per_trade_usd ?? 50);
                    setSlippage(s.max_slippage ?? 1);
                    setMaxExposure(s.max_total_exposure_usd ?? 500);
                    setAllowedMarkets(s.allowed_markets ?? []);
                }
            } catch (e) {
                console.error("Error loading settings:", e);
            } finally {
                setIsLoading(false);
            }
        };
        void fetchSettings();
    }, [authenticated, walletAddress, baseUrl]);

    const handleSaveSettings = async () => {
        if (!authenticated || !walletAddress) return;
        setIsSaving(true);
        setSaveStatus(null);
        try {
            const payload = {
                volume_per_trade_usd: parseFloat(volumePerTrade),
                slippage: parseFloat(slippage),
                allowed_markets: allowedMarkets,
                max_total_exposure_usd: parseFloat(maxExposure),
            };
            const res = await privateFetch(`${baseUrl}/api/user/settings`, {
                method: 'POST',
                body: JSON.stringify(payload),
            }, () => identityToken);
            setSaveStatus(res.ok ? 'success' : 'error');
            if (!res.ok) console.error("Save error:", await res.json());
        } catch (e) {
            console.error("Network error:", e);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    const toggleMarket = (symbol) => {
        setAllowedMarkets(prev =>
            prev.includes(symbol) ? prev.filter(m => m !== symbol) : [...prev, symbol]
        );
    };

    return (
        <div className="trading-settings-section">
            <h3 className="settings-title">Risk Management Profile</h3>

            {isLoading ? (
                <div className="loading-state">Syncing parameters...</div>
            ) : (
                <>
                    <div className="settings-scroll-container">

                        {/* БАЛАНС */}
                        <div className="balance-card">
                            <span className="balance-label">Trading Balance</span>
                            <span className="balance-value">
                                {isBalanceLoading
                                    ? 'Updating...'
                                    : `$${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                }
                            </span>
                        </div>

                        {/* VOLUME PER TRADE */}
                        <div className="setting-item">
                            <div className="setting-header">
                                <span>Volume per Trade</span>
                                <div className="input-group">
                                    <span className="currency-prefix">$</span>
                                    <input
                                        type="number"
                                        value={volumePerTrade}
                                        min={1}
                                        onChange={(e) => setVolumePerTrade(e.target.value)}
                                        className="numeric-input wide"
                                    />
                                </div>
                            </div>
                            <p className="info-text">
                                Fixed USD size for each new copied position.
                            </p>
                            <input
                                type="range" min="1" max={maxExposure} step="1"
                                value={volumePerTrade}
                                onChange={(e) => setVolumePerTrade(e.target.value)}
                                className="setting-slider"
                            />
                        </div>

                        {/* MAX TOTAL EXPOSURE */}
                        <div className="setting-item">
                            <div className="setting-header">
                                <span>Max Total Exposure</span>
                                <div className="input-group">
                                    <span className="currency-prefix">$</span>
                                    <input
                                        type="number"
                                        value={maxExposure}
                                        min={volumePerTrade}
                                        onChange={(e) => setMaxExposure(e.target.value)}
                                        className="numeric-input wide"
                                    />
                                </div>
                            </div>
                            <p className="info-text">
                                Stop opening new positions when total USD value exceeds this.
                                {maxPositions > 0 && (
                                    <span className="exposure-hint"> Max ~{maxPositions} simultaneous positions.</span>
                                )}
                            </p>
                            <input
                                type="range" min="50" max="10000" step="50"
                                value={maxExposure}
                                onChange={(e) => setMaxExposure(e.target.value)}
                                className="setting-slider exposure-slider"
                            />
                        </div>

                        {/* SLIPPAGE */}
                        <div className="setting-item">
                            <div className="setting-header">
                                <span>Max Slippage</span>
                                <div className="input-group">
                                    <input
                                        type="number"
                                        value={slippage}
                                        min={0.1} max={10} step={0.1}
                                        onChange={(e) => setSlippage(e.target.value)}
                                        className="numeric-input"
                                    />
                                    <span className="usd-hint">%</span>
                                </div>
                            </div>
                            <input
                                type="range" min="0.1" max="10" step="0.1"
                                value={slippage}
                                onChange={(e) => setSlippage(e.target.value)}
                                className="setting-slider"
                            />
                        </div>

                        {/* MARKETS */}
                        <div className="setting-item">
                            <div
                                className="setting-header dropdown-trigger"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <span>Copy Specific Markets</span>
                                <span className="setting-value" style={{ color: '#4ade80' }}>
                                    {(!allowedMarkets || allowedMarkets.length === 0)
                                        ? 'All Active ▼'
                                        : `${allowedMarkets.length} Selected ▼`
                                    }
                                </span>
                            </div>
                            {isDropdownOpen && (
                                <div className="markets-dropdown">
                                    {availableMarkets.map(symbol => (
                                        <label key={symbol} className="market-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={allowedMarkets.includes(symbol)}
                                                onChange={() => toggleMarket(symbol)}
                                            />
                                            <span>{symbol}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    <button
                        className={`save-settings-btn ${saveStatus === 'success' ? 'success' : saveStatus === 'error' ? 'error' : ''}`}
                        onClick={handleSaveSettings}
                        disabled={isSaving || !authenticated}
                    >
                        {isSaving
                            ? 'Processing...'
                            : saveStatus === 'success'
                                ? 'Profile Updated ✓'
                                : saveStatus === 'error'
                                    ? 'Error! Check Log'
                                    : 'Save Risk Parameters'
                        }
                    </button>
                </>
            )}
        </div>
    );
}