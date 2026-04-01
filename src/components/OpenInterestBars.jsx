import React from 'react';
import './MarketOverview.css';

export default function OpenInterestBars({ topOI }) {
    if (!topOI || topOI.length === 0) return <div className="chart-card">Loading OI...</div>;

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2
        }).format(val);
    };

    // 1. Сначала отрезаем только топ-10
    const displayedOI = topOI.slice(0, 20);

    // 2. Считаем максимум только по этим десяти (чтобы полоски были красивые)
    const maxOI = Math.max(...displayedOI.map(v => v.open_interest), 1);

    return (
        <div className="chart-card">
            <h3 className="chart-title">Top Markets by OI</h3>

            <div className="chart-bars-scroll-wrapper">
                {displayedOI.map((coin, idx) => (
                    <div key={idx} className="bar-row">
                        <div className="bar-label">{coin.symbol}</div>
                        <div className="bar-track">
                            <div className="bar-fill bg-blue" style={{ width: `${(coin.open_interest / maxOI) * 100}%` }}></div>
                            <div className="bar-value">{formatCurrency(coin.open_interest)}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}