import React from 'react';
import './MarketOverview.css';

export default function SummaryCards({ stats, loading }) {
    const formatCurrency = (val) => {
        const num = parseFloat(val || 0);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
            maximumFractionDigits: 2
        }).format(num);
    };

    return (
        <div className="stats-grid-container" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>

            <div className="stat-card">
                <div className="stat-label text-green">24H Volume</div>
                <div className="stat-value">
                    {loading ? "..." : formatCurrency(stats.volume_24h)}
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-label text-gold">Open Interest</div>
                <div className="stat-value">
                    {loading ? "..." : formatCurrency(stats.open_interest)}
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-label text-cyan">24H Liquidations</div>
                <div className="stat-value">
                    {loading ? "..." : formatCurrency(stats.liquidations_24h)}
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-label text-green">Active Markets</div>
                <div className="stat-value">
                    {loading ? "..." : stats.active_markets}
                </div>
            </div>

        </div>
    );
}