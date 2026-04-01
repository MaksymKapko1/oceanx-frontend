import React, { useState } from 'react';
import { createPortal } from 'react-dom'; // 👈 ВАЖНО: ИМПОРТИРУЕМ ПОРТАЛ!
import './MarketOverview.css';

export default function VolumeTreemap({ topVolume }) {
    const [tooltipData, setTooltipData] = useState({
        visible: false, x: 0, y: 0, symbol: '', value: '', isRightHalf: false, isBottomHalf: false
    });

    if (!topVolume || topVolume.length === 0) return <div className="chart-card">Loading Treemap...</div>;

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2
        }).format(val);
    };

    const coins = topVolume.slice(0, 6);
    const totalVol = coins.reduce((sum, c) => sum + c.volume_24h, 0);
    const colors = ['#f97316', '#5b7fff', '#8b5cf6', '#84cc16', '#eab308', '#ec4899'];

    const col1 = coins[0];
    const col2 = coins[1];
    const rest = coins.slice(2);

    const width1 = (col1.volume_24h / totalVol) * 100;
    const width2 = col2 ? (col2.volume_24h / totalVol) * 100 : 0;
    const width3 = 100 - width1 - width2;

    const showTooltip = (coin, e) => {
        setTooltipData({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            symbol: coin.symbol,
            value: formatCurrency(coin.volume_24h),
            isRightHalf: e.clientX > window.innerWidth / 2,
            isBottomHalf: e.clientY > window.innerHeight / 2
        });
    };

    const hideTooltip = () => setTooltipData({ ...tooltipData, visible: false });

    return (
        <div className="chart-card">
            <h3 className="chart-title">Volume by Market (24h)</h3>

            <div className="treemap-container">
                <div
                    className="treemap-box"
                    style={{ width: `${width1}%`, backgroundColor: colors[0] }}
                    onMouseMove={(e) => showTooltip(col1, e)}
                    onMouseLeave={hideTooltip}
                >
                    <span className="tm-symbol">{col1.symbol}</span>
                    <span className="tm-value">{formatCurrency(col1.volume_24h)}</span>
                </div>

                {col2 && (
                    <div
                        className="treemap-box"
                        style={{ width: `${width2}%`, backgroundColor: colors[1] }}
                        onMouseMove={(e) => showTooltip(col2, e)}
                        onMouseLeave={hideTooltip}
                    >
                        <span className="tm-symbol">{col2.symbol}</span>
                        <span className="tm-value">{formatCurrency(col2.volume_24h)}</span>
                    </div>
                )}

                {rest.length > 0 && (
                    <div className="treemap-col" style={{ width: `${width3}%` }}>
                        {rest.map((coin, idx) => (
                            <div
                                key={idx}
                                className="treemap-box"
                                style={{ flex: coin.volume_24h, backgroundColor: colors[idx + 2] }}
                                onMouseMove={(e) => showTooltip(coin, e)}
                                onMouseLeave={hideTooltip}
                            >
                                <span className="tm-symbol">{coin.symbol}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {tooltipData.visible && createPortal(
                <div className="custom-treemap-tooltip" style={{
                    position: 'fixed',
                    left: tooltipData.isRightHalf ? 'auto' : `${tooltipData.x + 15}px`,
                    right: tooltipData.isRightHalf ? `${window.innerWidth - tooltipData.x + 15}px` : 'auto',
                    top: tooltipData.isBottomHalf ? 'auto' : `${tooltipData.y + 15}px`,
                    bottom: tooltipData.isBottomHalf ? `${window.innerHeight - tooltipData.y + 15}px` : 'auto',
                }}>
                    <span className="tooltip-symbol">{tooltipData.symbol}</span>
                    <span className="tooltip-value">{tooltipData.value}</span>
                </div>,
                document.body
            )}
        </div>
    );
}