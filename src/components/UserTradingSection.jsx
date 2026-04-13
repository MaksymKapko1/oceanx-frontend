import React, { useEffect, useState, useMemo } from 'react';
import './UserTradingSection.css';
import { usePrivy } from "@privy-io/react-auth";
import { usePacificaAccount } from "../hooks/usePacificaAccount";
import { useMarketStats } from '../hooks/useMarketStats';

export default function UserTradingSection() {
    const { authenticated, user } = usePrivy();
    const walletAddress = user?.wallet?.address;

    const [isFixedAmount, setIsFixedAmount] = useState(false);
    const [marginUSD, setMarginUSD] = useState("");
    const [marginAllocation, setMarginAllocation] = useState(10);
    const [leverage, setLeverage] = useState(5);
    const [slippage, setSlippage] = useState(1);
    const [maxExposure, setMaxExposure] = useState(500);

    const [allowedMarkets, setAllowedMarkets] = useState([]);
    const [availableMarkets, setAvailableMarkets] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    const { stats } = useMarketStats();
    const { accountData, isLoading: isBalanceLoading } = usePacificaAccount(walletAddress);
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';

    const availableBalance = useMemo(() =>
            accountData?.available_to_spend ? parseFloat(accountData.available_to_spend) : 0
        , [accountData]);

    const allocatedUSD = useMemo(() =>
            (availableBalance * (marginAllocation / 100)).toFixed(2)
        , [availableBalance, marginAllocation]);

    const positionSizeUSD = useMemo(() =>
            (parseFloat(allocatedUSD) * leverage).toFixed(2)
        , [allocatedUSD, leverage]);

    const handlePercentChange = (val) => {
        const percent = Math.min(100, Math.max(0, parseFloat(val) || 0));
        setMarginAllocation(percent);
        if (availableBalance > 0) {
            setMarginUSD((availableBalance * (percent / 100)).toFixed(2));
        }
    };

    const handleUSDChange = (val) => {
        setMarginUSD(val);
        const numVal = parseFloat(val);
        if (!isNaN(numVal) && availableBalance > 0) {
            let calculatedPercent = (numVal / availableBalance) * 100;
            calculatedPercent = Math.min(100, Math.max(0, calculatedPercent));
            setMarginAllocation(parseFloat(calculatedPercent.toFixed(2)));
        }
    };

    useEffect(() => {
        if (stats?.top_volume) {
            setAvailableMarkets(stats.top_volume.map(market => market.symbol));
        }
    }, [stats]);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!authenticated || !walletAddress) {
                setIsLoading(false);
                return;
            }
            try {
                const response = await fetch(`${baseUrl}/api/user/settings/${walletAddress}`);
                const data = await response.json();

                if (data.success && data.settings) {
                    const mPerc = data.settings.margin_allocation_pct || 10;
                    setMarginAllocation(mPerc);
                    setLeverage(data.settings.max_leverage || 5);
                    setSlippage(data.settings.max_slippage || 1);
                    setAllowedMarkets(data.settings.allowed_markets || []);
                    setMaxExposure(data.settings.max_total_exposure_usd || 500);

                    if (availableBalance > 0) {
                        setMarginUSD((availableBalance * (mPerc / 100)).toFixed(2));
                    }
                }
            } catch (error) {
                console.error("Error loading settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        void fetchSettings();
    }, [authenticated, walletAddress, availableBalance, baseUrl]);

    const handleSaveSettings = async () => {
        if (!authenticated || !walletAddress) return;
        setIsSaving(true);
        setSaveStatus(null);

        try {
            // 🔥 Перед отправкой принудительно делаем parseFloat/Number
            const payload = {
                user_wallet: walletAddress,
                margin_allocation: parseFloat(marginAllocation),
                leverage: parseFloat(leverage),
                slippage: parseFloat(slippage),
                allowed_markets: allowedMarkets,
                max_total_exposure_usd: parseFloat(maxExposure)
            };

            const response = await fetch(`${baseUrl}/api/user/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus(null), 3000);
            } else {
                const errorData = await response.json();
                console.error("422 Details:", errorData);
                setSaveStatus('error');
            }
        } catch (error) {
            console.error("Network error:", error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="trading-settings-section">
            <h3 className="settings-title">Risk Management Profile</h3>

            {isLoading ? (
                <div className="loading-state">Syncing parameters...</div>
            ) : (
                <>
                    <div className="settings-scroll-container">
                        <div className="balance-card">
                            <span className="balance-label">Trading Balance</span>
                            <span className="balance-value">
                                {isBalanceLoading ? 'Updating...' : `$${availableBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}`}
                            </span>
                        </div>

                        {/* MARGIN */}
                        <div className="setting-item">
                            <div className="setting-header">
                                <div className="label-with-toggle">
                                    <span>Margin per trade</span>
                                    <div className="mode-toggle">
                                        <button className={!isFixedAmount ? 'active' : ''} onClick={() => setIsFixedAmount(false)}>%</button>
                                        <button className={isFixedAmount ? 'active' : ''} onClick={() => setIsFixedAmount(true)}>$</button>
                                    </div>
                                </div>
                                <div className="input-group">
                                    {isFixedAmount ? (
                                        <input
                                            type="number" value={marginUSD}
                                            onChange={(e) => handleUSDChange(e.target.value)}
                                            className="numeric-input wide"
                                        />
                                    ) : (
                                        <input
                                            type="number" value={marginAllocation}
                                            onChange={(e) => handlePercentChange(e.target.value)}
                                            className="numeric-input"
                                        />
                                    )}
                                    <span className="usd-hint">{isFixedAmount ? `(${marginAllocation}%)` : `$${allocatedUSD}`}</span>
                                </div>
                            </div>
                            <input
                                type="range" min="1" max="100" step="0.5"
                                value={marginAllocation}
                                onChange={(e) => handlePercentChange(e.target.value)}
                                className="setting-slider"
                            />
                        </div>

                        {/* MAX EXPOSURE */}
                        <div className="setting-item">
                            <div className="setting-header">
                                <span>Max Total Exposure</span>
                                <input
                                    type="number" value={maxExposure}
                                    onChange={(e) => setMaxExposure(e.target.value)}
                                    className="numeric-input wide"
                                />
                            </div>
                            <p className="info-text">Stop opening new positions when total USD value exceeds this limit.</p>
                            <input
                                type="range" min="50" max="10000" step="50"
                                value={maxExposure}
                                onChange={(e) => setMaxExposure(e.target.value)}
                                className="setting-slider exposure-slider"
                            />
                        </div>

                        {/* LEVERAGE */}
                        <div className="setting-item">
                            <div className="setting-header">
                                <span>
                                    Max Leverage
                                    <span className={`leverage-warning ${leverage > 20 ? 'high-risk' : ''}`}>
                                        Max Pos: ${positionSizeUSD}
                                    </span>
                                </span>
                                <input
                                    type="number" value={leverage}
                                    onChange={(e) => setLeverage(e.target.value)}
                                    className="numeric-input"
                                />
                            </div>
                            <input
                                type="range" min="1" max="50"
                                value={leverage}
                                onChange={(e) => setLeverage(e.target.value)}
                                className="setting-slider leverage-slider"
                            />
                            <p className="leverage-disclaimer">
                                * The bot will use the maximum available if you set leverage higher than the market's limit.
                            </p>
                        </div>

                        {/* MARKETS */}
                        <div className="setting-item">
                            <div className="setting-header dropdown-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                <span>Copy Specific Markets</span>
                                <span className="setting-value" style={{color: '#4ade80'}}>
                                    {(!allowedMarkets || allowedMarkets.length === 0) ? 'All Active' : `${allowedMarkets.length} Selected ▼`}
                                </span>
                            </div>
                            {isDropdownOpen && (
                                <div className="markets-dropdown">
                                    {availableMarkets.map(symbol => (
                                        <label key={symbol} className="market-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={allowedMarkets.includes(symbol)}
                                                onChange={() => {
                                                    setAllowedMarkets(prev => prev.includes(symbol) ? prev.filter(m => m !== symbol) : [...prev, symbol])
                                                }}
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
                        {isSaving ? 'Processing...' : saveStatus === 'success' ? 'Profile Updated ✓' : saveStatus === 'error' ? 'Error! Check Log' : 'Save Risk Parameters'}
                    </button>
                </>
            )}
        </div>
    );
}