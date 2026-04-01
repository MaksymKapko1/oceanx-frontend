import React, { useEffect, useState } from 'react';
import './LeaderboardTable.css';

const PAGE_SIZE = 10;

export default function LeaderboardTable() {
    const PERIODS = [
        { key: '1d', label: '1D' },
        { key: '7d', label: '7D' },
        { key: '30d', label: '30D' },
        { key: 'all_time', label: 'All Time' },
    ]
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [period, setPeriod] = useState('1d');

    const fetchLeaderboard = async (currentPage, currentPeriod) => {
        try {
            setLoading(true);
            const offset = currentPage * PAGE_SIZE;
            const response = await fetch(
                `http://localhost:8001/api/leaderboard?period=${currentPeriod}&limit=${PAGE_SIZE}&offset=${offset}`
            );
            const res = await response.json();
            if (res.success && res.data) {
                setLeaderboard(res.data);
                setTotal(res.total);
            }
        } catch (err) {
            console.error("🔴 Ошибка загрузки лидерборда:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard(page, period);
        const interval = setInterval(() => fetchLeaderboard(page, period), 10000);
        return () => clearInterval(interval);
    }, [page, period]);

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        setPage(0)
    }

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const formatCurrency = (val) => {
        const num = parseFloat(val || 0);
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD', maximumFractionDigits: 0
        }).format(num);
    };

    const pnlColor = (val) => parseFloat(val) < 0 ? '#f87171' : '#4ade80';

    return (
        <div className="lb-wrapper">
            <div className="lb-container">

                {/* Шапка */}
                <div className="lb-header">
                    <h2 className="lb-title">Top Traders</h2>
                    <div className='lb-period-filter'>
                        {PERIODS.map(p => (
                            <button key={p.key}
                                    className={`lb-period-btn ${period === p.key ? 'active' : ''}`}
                                    onClick={() => handlePeriodChange(p.key)}>
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div className="lb-badge">🏆 LEADERBOARD</div>
                </div>

                {/* Колонки */}
                <div className="lb-columns">
                    <span>Rank / Account</span>
                    <span className={period === '1d' ? 'active-sort' : ''}>1D PNL</span>
                    <span className={period === '7d' ? 'active-sort' : ''}>7D PNL</span>
                    <span className={period === '30d' ? 'active-sort' : ''}>30D PNL</span>
                    <span className={period === 'all_time' ? 'active-sort' : ''}>Total PNL</span>
                </div>

                {/* Строки */}
                <div className="lb-list">
                    {loading ? (
                        <div className="lb-loading">Loading...</div>
                    ) : (
                        leaderboard.map((trader, index) => {
                            const globalRank = page * PAGE_SIZE + index + 1;
                            const addr = trader.address || '';
                            const name = trader.username || `${addr.slice(0, 6)}...${addr.slice(-4)}`;

                            const pnlFieldMap = {
                                '1d': 'pnl_1d',
                                '7d': 'pnl_7d',
                                '30d': 'pnl_30d',
                                'all_time': 'pnl_all_time'
                            };

                            return (
                                <div key={trader.address || index} className="lb-row">
                                    <div className="lb-cell lb-account">
                                        <div className={`lb-rank ${globalRank <= 3 ? 'lb-rank-top' : ''}`}>
                                            {globalRank}
                                        </div>
                                        <span className="lb-name">{name}</span>
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