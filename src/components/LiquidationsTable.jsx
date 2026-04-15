import React, {useCallback, useEffect, useState, useMemo, useRef} from 'react';
import { Flame, TrendingDown, TrendingUp, Activity, ChevronDown } from 'lucide-react';
import {useMarketStats} from "../hooks/useMarketStats.js";
import './LiquidationsTable.css';

export default function LiquidationsTable() {
    const PAGE_SIZE = 20;
    const {stats} = useMarketStats();

    // Динамический список монет
    const availableMarkets = useMemo(() => {
        if (stats && stats.top_volume) {
            const symbols = stats.top_volume.map(market => market.symbol);
            return ['ALL', ...symbols];
        }
        return ['ALL', 'BTC', 'ETH', 'SOL'];
    }, [stats]);

    const [liquidations, setLiquidations] = useState([]);
    const [summary, setSummary] = useState({ total_usd: 0, long_usd: 0, short_usd: 0 });
    const [loading, setLoading] = useState(true);

    // Стейты фильтров и дропдауна
    const [filterCoin, setFilterCoin] = useState('ALL');
    const [isCoinDropdownOpen, setIsCoinDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [offset, setOffset] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const [sortOrder, setSortOrder] = useState('desc');
    const [timeRange, setTimeRange] = useState('all');

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';

    // ЗАГРУЗКА ИСТОРИИ И СТАТИСТИКИ
    const fetchLiquidations = useCallback(async (currentOffset, isNewFilter = false) => {
        try {
            if (isNewFilter) setLoading(true);
            else setLoadingMore(true);

            const url = `${baseUrl}/api/liquidations/history?symbol=${filterCoin}&sort_order=${sortOrder}&period=${timeRange}&limit=${PAGE_SIZE}&offset=${currentOffset}`;
            const res = await fetch(url);
            const json = await res.json();

            if (json.success) {
                if (isNewFilter) {
                    setLiquidations(json.data);
                } else {
                    setLiquidations(prev => [...prev, ...json.data]);
                }

                if (json.data.length < PAGE_SIZE) setHasMore(false);
                else setHasMore(true);
            }
        } catch (err) {
            console.error("❌ Ошибка загрузки ликвидаций:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [filterCoin, baseUrl, sortOrder, timeRange]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsCoinDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchSummary = async () => {
        try {
            const res = await fetch(`${baseUrl}/api/liquidations/summary`);
            const json = await res.json();
            if (json.success) setSummary(json.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        setOffset(0);
        fetchLiquidations(0, true);
        fetchSummary();

        const interval = setInterval(fetchSummary, 30000);
        return () => clearInterval(interval);
    }, [filterCoin, sortOrder, timeRange, fetchLiquidations]);

    const handleLoadMore = () => {
        const nextOffset = offset + PAGE_SIZE;
        setOffset(nextOffset);
        fetchLiquidations(nextOffset, false);
    };

    useEffect(() => {
        const wsUrl = baseUrl.replace('http', 'ws') + '/ws';
        const ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'liquidations') {
                const filtered = msg.data.filter(l => filterCoin === 'ALL' || l.coin === filterCoin);
                setLiquidations(prev => [...filtered, ...prev].slice(0, 100));
            }
        };
        return () => ws.close();
    }, [filterCoin, baseUrl]);

    const formatUSD = (val) => new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', maximumFractionDigits: 0
    }).format(val);

    return (
        <div className="lb-wrapper">
            {/* ВЕРХНИЕ КАРТОЧКИ (SUMMARY) */}
            <div style={{marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="lb-container" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(34, 211, 238, 0.1)', padding: '10px', borderRadius: '12px' }}>
                        <Activity color="#22d3ee" size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>24h Vol Burnt</div>
                        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>{formatUSD(summary.total_usd)}</div>
                    </div>
                </div>

                <div className="lb-container" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(248, 113, 113, 0.1)', padding: '10px', borderRadius: '12px' }}>
                        <TrendingDown color="#f87171" size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Longs Wiped</div>
                        <div style={{ color: '#f87171', fontWeight: 'bold', fontSize: '1.2rem' }}>{formatUSD(summary.long_usd)}</div>
                    </div>
                </div>

                <div className="lb-container" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(74, 222, 128, 0.1)', padding: '10px', borderRadius: '12px' }}>
                        <TrendingUp color="#4ade80" size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>Shorts Squeezed</div>
                        <div style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '1.2rem' }}>{formatUSD(summary.short_usd)}</div>
                    </div>
                </div>
            </div>

            <div className="lb-container">
                {/* HEADER С ФИЛЬТРАМИ */}
                <div className="lb-header">
                    <div className="lb-title-side">
                        <Flame color="#ff4d4d" size={20} />
                        <h2 className="lb-title">Live Liquidations</h2>
                    </div>

                    <div className="lb-controls-wrapper">
                        {/* Группа 1: Таймфрейм */}
                        <div className="lb-button-group">
                            <button
                                className={`lb-control-btn ${timeRange === '24h' ? 'active' : ''}`}
                                onClick={() => setTimeRange('24h')}
                            >24H</button>
                            <button
                                className={`lb-control-btn ${timeRange === 'all' ? 'active' : ''}`}
                                onClick={() => setTimeRange('all')}
                            >All Time</button>
                        </div>

                        <div className="lb-divider"></div>

                        {/* Группа 2: Сортировка */}
                        <button
                            className="lb-control-btn sort-btn"
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        >
                            {sortOrder === 'desc' ? '🐘 Huge First' : '🐜 Small First'}
                        </button>

                        <div className="lb-divider"></div>

                        {/* Группа 3: Динамический Dropdown Монет */}
                        <div className="lb-dropdown" onMouseLeave={() => setIsCoinDropdownOpen(false)}>
                            <div
                                className={`lb-dropdown-trigger ${isCoinDropdownOpen ? 'active' : ''}`}
                                onClick={() => setIsCoinDropdownOpen(!isCoinDropdownOpen)}
                            >
                                <span>{filterCoin === 'ALL' ? 'All Markets' : `${filterCoin}-PERP`}</span>
                                <ChevronDown size={16} className={isCoinDropdownOpen ? 'rotated' : ''} />
                            </div>

                            {isCoinDropdownOpen && (
                                <div className="lb-dropdown-menu">
                                    {availableMarkets.map(coin => (
                                        <div
                                            key={coin}
                                            className={`lb-dropdown-item ${filterCoin === coin ? 'active' : ''}`}
                                            onClick={() => { setFilterCoin(coin); setIsCoinDropdownOpen(false); }}
                                        >
                                            {coin === 'ALL' ? '🌐 All Markets' : coin}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ТАБЛИЦА */}
                <div className="lb-columns" style={{ gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr 1.2fr' }}>
                    <span>Time</span>
                    <span>Symbol</span>
                    <span>Type</span>
                    <span>Price</span>
                    <span>Size</span>
                    <span style={{ textAlign: 'right' }}>Total (USD)</span>
                </div>

                <div className="lb-list">
                    {loading ? (
                        <div className="lb-loading">Retrieving market data...</div>
                    ) : (
                        <>
                            {liquidations.map((liq, idx) => (
                                <div key={liq.trade_id || idx} className="lb-row" style={{ gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr 1.2fr' }}>
                                    <div className="lb-cell" style={{ color: 'rgba(255,255,255,0.5)' }}>{new Date(liq.timestamp).toLocaleTimeString()}</div>
                                    <div className="lb-cell lb-account"><span className="lb-name">{liq.coin}</span></div>
                                    <div className="lb-cell"><span className="liq-badge">{liq.liq_type.replace(/_/g, ' ')}</span></div>
                                    <div className="lb-cell">${parseFloat(liq.price).toLocaleString()}</div>
                                    <div className="lb-cell" style={{ color: liq.side === 'close_short' ? '#4ade80' : '#f87171' }}>{parseFloat(liq.size).toFixed(4)}</div>
                                    <div className="lb-cell lb-total" style={{ textAlign: 'right', color: liq.side === 'close_short' ? '#4ade80' : '#f87171' }}>
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(liq.usd_amount)}
                                    </div>
                                </div>
                            ))}

                            {hasMore && (
                                <div className="lb-pagination" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px' }}>
                                    <button
                                        className="lb-page-btn"
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
                                    >
                                        {loadingMore ? 'Loading...' : <>Load More History <ChevronDown size={16}/></>}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}