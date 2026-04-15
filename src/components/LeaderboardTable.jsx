import React, { useEffect, useState } from 'react';
import { usePrivy } from "@privy-io/react-auth";
import FollowButton from './FollowButton/FollowButton';
import { Copy, Check, ShieldAlert, Zap, Info } from 'lucide-react';
import './LeaderboardTable.css';
import { useIdentityToken, getIdentityToken } from "@privy-io/react-auth";
import { privateFetch } from '../utils/pacificaUtils';

const PAGE_SIZE = 10;

export default function LeaderboardTable() {
    const PERIODS = [
        { key: '1d', label: '1D' },
        { key: '7d', label: '7D' },
        { key: '30d', label: '30D' },
        { key: 'all_time', label: 'All Time' },
    ];

    const { authenticated, user } = usePrivy();

    const [traderStrategies, setTraderStrategies] = useState({});
    const { identityToken } = useIdentityToken();

    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [period, setPeriod] = useState('1d');

    const [mode, setMode] = useState('copy');

    // Стейты для поиска
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Стейт для открытой строки позиций
    const [expandedAddress, setExpandedAddress] = useState(null);

    // Стейт для индикации копирования
    const [copiedAddress, setCopiedAddress] = useState(null);

    const handleRowClick = (address) => {
        setExpandedAddress(prev => prev === address ? null : address);
    };

    // Функция копирования
    const handleCopyAddress = (e, address) => {
        e.stopPropagation(); // ВАЖНО: блокируем клик, чтобы строка не открывалась
        navigator.clipboard.writeText(address);
        setCopiedAddress(address);
        setTimeout(() => setCopiedAddress(null), 2000); // Возвращаем иконку обратно через 2 сек
    };

    const toggleStrategy = async (trader) => {
        const addr = trader.address;
        const currentMode = traderStrategies[addr] || 'copy';
        const newMode = currentMode === 'anticopy' ? 'copy' : 'anticopy';
        const isReverse = newMode === 'anticopy';

        // 1. Сначала обновляем локально для мгновенного отклика UI
        setTraderStrategies(prev => ({ ...prev, [addr]: newMode }));

        // 2. Если юзер уже подписан — сразу шлем запрос на бэк
        if (trader.is_followed && authenticated && user?.wallet?.address) {
            try {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
                const response = await privateFetch(`${baseUrl}/api/user/update-strategy`, {
                    method: 'POST',
                    body: JSON.stringify({
                        master_wallet: addr,
                        is_reverse: isReverse
                    })
                }, () => identityToken);
                const data = await response.json();

                if (!data.success) {
                    // Если бэк вернул ошибку, откатываем стейт назад
                    setTraderStrategies(prev => ({ ...prev, [addr]: currentMode }));
                    console.error("Failed to sync strategy:", data.error);
                } else {
                    console.log(`✅ Стратегия синхронизирована: ${newMode}`);
                }
            } catch (err) {
                console.error("Ошибка при обновлении стратегии:", err);
                setTraderStrategies(prev => ({ ...prev, [addr]: currentMode }));
            }
        }
    };

    // Debounce: ждем 300мс после ввода
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput);
            setPage(0); // При новом поиске всегда возвращаемся на первую страницу
        }, 300);

        return () => clearTimeout(timer);
    }, [searchInput]);

    const fetchLeaderboard = async (currentPage, currentPeriod, isBackground = false, currentSearch = '',
                                    currentMode = 'copy') => {
        try {
            if (!isBackground) setLoading(true);
            const offset = currentPage * PAGE_SIZE;
            const sortOrder = currentMode === 'anticopy' ? 'asc' : 'desc';
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';

            let url = `${baseUrl}/api/leaderboard?period=${currentPeriod}&limit=${PAGE_SIZE}&offset=${offset}&sort_order=${sortOrder}`;

            if (authenticated && user?.wallet?.address) {
                url += `&user_wallet=${user.wallet.address}`;
            }

            if (currentSearch) {
                url += `&search=${encodeURIComponent(currentSearch)}`;
            }

            const response = await fetch(url);
            const res = await response.json();

            if (res.success && res.data) {
                // --- 👇 ВОТ ЭТОТ БЛОК НУЖНО ДОБАВИТЬ 👇 ---
                const syncStrategies = {};

                res.data.forEach(trader => {
                    // Если мы уже подписаны на этого чела (is_followed пришел true с бэка)
                    if (trader.is_followed) {
                        // Подтягиваем из базы реальный режим: если is_reverse=true, то anticopy
                        syncStrategies[trader.address] = trader.is_reverse ? 'anticopy' : 'copy';
                    }
                });

                // Мержим данные из базы в наш локальный стейт свитчеров
                setTraderStrategies(prev => ({
                    ...prev,
                    ...syncStrategies
                }));
                // --- 👆 КОНЕЦ БЛОКА СИНХРОНИЗАЦИИ 👆 ---

                setLeaderboard(res.data);
                setTotal(res.total);
            }
        } catch (err) {
            console.error("🔴 Ошибка загрузки лидерборда:", err);
        } finally {
            setLoading(false);
        }
    };

    // Главный хук загрузки данных
    useEffect(() => {
        fetchLeaderboard(page, period, false, debouncedSearch, mode);

        const interval = setInterval(() => fetchLeaderboard(page, period, true, debouncedSearch, mode), 10000);
        return () => clearInterval(interval);
    }, [page, period, authenticated, user?.wallet?.address, debouncedSearch, mode]);

    const handleModeToggle = () => {
        const newMode = mode === 'copy' ? 'anticopy' : 'copy';
        setMode(newMode);
        setPage(0); // Сброс на первую страницу при смене режима
    };

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        setPage(0);
    };

    // Обновляем статус кнопки без перезагрузки всей таблицы
    const handleSubscriptionChange = (address, isFollowing) => {
        setLeaderboard(prev => prev.map(trader =>
            trader.address.toLowerCase() === address.toLowerCase()
                ? { ...trader, is_followed: isFollowing }
                : trader
        ));
    };

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const formatCurrency = (val) => {
        const num = parseFloat(val || 0);
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD', maximumFractionDigits: 0
        }).format(num);
    };

    const pnlColor = (val) => parseFloat(val) < 0 ? '#f87171' : '#4ade80';

    return (
        <div className={`lb-wrapper ${mode === 'anticopy' ? 'mode-anticopy' : ''}`}>
            <div className="lb-container">

                {/* Шапка */}
                <div className="lb-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h2 className="lb-title">
                            {mode === 'copy' ? 'Top Traders' : 'Top Losers'}
                        </h2>

                        {/* 👈 ДОБАВИЛИ КНОПКУ ПЕРЕКЛЮЧЕНИЯ */}
                        <button
                            className={`mode-toggle-btn ${mode}`}
                            onClick={handleModeToggle}
                            title={mode === 'copy' ? "Switch to Anti-Copy" : "Back to Copy Trading"}
                        >
                            {mode === 'copy' ? <ShieldAlert size={18} /> : <Zap size={18} />}
                            <span>{mode === 'copy' ? 'Hunt Losers' : 'Follow Kings'}</span>
                        </button>
                    </div>

                    <div className="lb-search-container">
                        <input
                            type="text"
                            className="lb-search-input"
                            placeholder="Search by address..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>
                    <div className='lb-period-filter'>
                        {PERIODS.map(p => (
                            <button key={p.key}
                                    className={`lb-period-btn ${period === p.key ? 'active' : ''}`}
                                    onClick={() => handlePeriodChange(p.key)}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Колонки */}
                <div className="lb-columns">
                    <span>Rank / Account</span>
                    <span className={period === '1d' ? 'active-sort' : ''}>1D PNL</span>
                    <span className={period === '7d' ? 'active-sort' : ''}>7D PNL</span>
                    <span className={period === '30d' ? 'active-sort' : ''}>30D PNL</span>
                    <span className={period === 'all_time' ? 'active-sort' : ''}>Total PNL</span>
                    <span>Action</span>
                </div>

                {/* Строки */}
                <div className="lb-list">
                    {loading ? (
                        <div className="lb-loading">Loading...</div>
                    ) : (
                        leaderboard.map((trader, index) => {
                            const displayRank = trader.global_rank || (page * PAGE_SIZE + index + 1);
                            const addr = trader.address || '';
                            const name = trader.username || `${addr.slice(0, 6)}...${addr.slice(-4)}`;

                            const isExpanded = expandedAddress === addr;

                            return (
                                // Обертка для строки и панели позиций
                                <div key={addr || index} className="lb-row-wrapper">
                                    <div
                                        className={`lb-row ${isExpanded ? 'expanded' : ''}`}
                                        onClick={() => handleRowClick(addr)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {/* ВНЕДРЕНА ЛОГИКА КОПИРОВАНИЯ */}
                                        <div className="lb-cell lb-account">
                                            <div className={`lb-rank ${displayRank <= 3 ? 'lb-rank-top' : ''}`}>
                                                {displayRank}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span className="lb-name" title={addr}>{name}</span>
                                                {addr && (
                                                    <button
                                                        onClick={(e) => handleCopyAddress(e, addr)}
                                                        title="Copy address"
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: copiedAddress === addr ? '#4ade80' : 'rgba(255,255,255,0.4)',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            padding: '2px',
                                                            transition: 'color 0.2s'
                                                        }}
                                                    >
                                                        {copiedAddress === addr ? <Check size={14} /> : <Copy size={14} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="lb-cell" style={{ color: pnlColor(trader.pnl_1d) }}>
                                            {formatCurrency(trader.pnl_1d)}
                                        </div>
                                        <div className="lb-cell" style={{ color: pnlColor(trader.pnl_7d) }}>
                                            {formatCurrency(trader.pnl_7d)}
                                        </div>
                                        <div className="lb-cell" style={{ color: pnlColor(trader.pnl_30d) }}>
                                            {formatCurrency(trader.pnl_30d)}
                                        </div>
                                        <div className="lb-cell lb-total" style={{ color: pnlColor(trader.pnl_all_time) }}>
                                            {formatCurrency(trader.pnl_all_time)}
                                        </div>

                                        {/* e.stopPropagation() не дает клику по кнопке открыть строку */}
                                        <div className="lb-cell lb-action" onClick={(e) => e.stopPropagation()}>
                                            <FollowButton
                                                masterAddress={addr}
                                                initialFollowed={trader.is_followed}
                                                onToggle={handleSubscriptionChange}
                                                isReverse={(traderStrategies[addr] || 'copy') === 'anticopy'}
                                            />

                                            <div className="strategy-selector">
                                                <div
                                                    className="strategy-toggle"
                                                    onClick={() => toggleStrategy(trader)}
                                                    title={
                                                        (traderStrategies[addr] || 'copy') === 'copy'
                                                            ? 'Switch to Anti-Copy'
                                                            : 'Switch to Copy'
                                                    }
                                                >
                                                    <div className={`strategy-option ${(traderStrategies[addr] || 'copy') === 'copy' ? 'active' : ''}`}>
                                                        <Zap size={13} />
                                                    </div>
                                                    <div className={`strategy-option reverse ${(traderStrategies[addr] || 'copy') === 'anticopy' ? 'active' : ''}`}>
                                                        <ShieldAlert size={13} />
                                                    </div>
                                                    <div className={`strategy-slider ${traderStrategies[addr] || 'copy'}`} />
                                                </div>

                                                <div
                                                    className="strategy-info"
                                                    data-tooltip={(traderStrategies[addr] || 'copy') === 'copy'
                                                        ? 'Mode: Mirrors trader positions'
                                                        : 'Mode: REVERSE positions (Anti-Copy)'}
                                                >
                                                    <Info size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Рендерим позиции только если строка открыта */}
                                    {isExpanded && <PositionsPanel address={addr} />}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Пагинация */}
                {totalPages > 1 && (
                    <div className="lb-pagination">
                        <button
                            className="lb-page-btn"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                        >
                            ← Prev
                        </button>
                        <span className="lb-page-info">
                            Page {page + 1} of {totalPages}
                        </span>
                        <button
                            className="lb-page-btn"
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

const PositionsPanel = ({ address }) => {
    const [positions, setPositions] = useState([]);
    const [prices, setPrices] = useState({});
    const [loading, setLoading] = useState(true);

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';

    // 1. ПОТОК ПОЗИЦИЙ (Раз в 30 сек)
    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const res = await fetch(`${baseUrl}/api/leaderboard/${address}/positions`);
                const data = await res.json();
                if (data.success) {
                    console.log("📦 [СТАТИКА] Пришли позиции:", data.data);
                    setPositions(data.data);
                }
            } catch (err) {
                console.error("Ошибка загрузки позиций:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPositions();
        const interval = setInterval(fetchPositions, 30000);
        return () => clearInterval(interval);
    }, [address, baseUrl]);

    // 2. ПОТОК ЦЕН (Каждые 10 сек)
    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await fetch(`${baseUrl}/api/leaderboard/prices`);
                const data = await res.json();
                if (data.success) {
                    // Выводим в консоль цены только для BTC, ETH, SOL, чтобы не засорять эфир
                    console.log(`🔥 [ДИНАМИКА] Свежие цены: BTC=$${data.data.BTC}, ETH=$${data.data.ETH}, SOL=$${data.data.SOL}`);
                    setPrices(data.data);
                }
            } catch (err) {
                console.error("Ошибка загрузки цен:", err);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, [baseUrl]);

    if (loading) return <div className="lb-positions-panel loading">Loading active positions...</div>;
    if (positions.length === 0) return <div className="lb-positions-panel empty">No active positions.</div>;

    const formatNum = (val, decimals = 2) => parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

    return (
        <div className="lb-positions-panel">
            <h4 className="pos-title">Active Positions ({positions.length})</h4>

            <div className="positions-grid pos-header">
                <span>Symbol</span>
                <span>Side</span>
                <span>Size</span>
                <span>Entry Price</span>
                <span>Liq. Price</span>
                <span>Funding</span>
                <span>Est. PNL</span>
            </div>

            {positions.map((pos, i) => {
                const isLong = pos.d === 'bid';
                const size = parseFloat(pos.a || 0);
                const entryPrice = parseFloat(pos.p || 0);
                const symbol = pos.s;

                let pnl = 0;
                const currentPrice = prices[symbol];

                if (currentPrice && entryPrice > 0) {
                    if (isLong) {
                        pnl = (currentPrice - entryPrice) * size;
                    } else {
                        pnl = (entryPrice - currentPrice) * size;
                    }
                }

                const pnlColor = pnl >= 0 ? '#4ade80' : '#f87171';
                const pnlSign = pnl >= 0 ? '+' : '';

                const liqRaw = parseFloat(pos.l || 0);
                const liqPrice = (pos.l !== null && pos.l !== undefined) ? `$${formatNum(liqRaw, 4)}` : 'Cross';

                const fundingRaw = parseFloat(pos.f || 0);
                const fundingColor = fundingRaw < 0 ? '#f87171' : (fundingRaw > 0 ? '#4ade80' : 'rgba(255,255,255,0.7)');

                return (
                    <div key={i} className="positions-grid pos-row">
                        <span className="pos-symbol">{symbol}</span>
                        <span className={isLong ? 'pos-long' : 'pos-short'}>
                            {isLong ? 'LONG' : 'SHORT'}
                        </span>
                        <span>{formatNum(size, 4)}</span>
                        <span>${formatNum(entryPrice, 4)}</span>

                        <span style={{ color: liqPrice === 'Cross' ? 'rgba(255,255,255,0.4)' : 'inherit' }}>
                            {liqPrice}
                        </span>

                        <span style={{ color: fundingColor }}>
                            {formatNum(fundingRaw, 4)}
                        </span>

                        <span style={{ color: pnlColor, fontWeight: 'bold' }}>
                            {pnlSign}${formatNum(pnl, 2)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};