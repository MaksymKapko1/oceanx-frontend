import React, { useState } from 'react';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

export default function ChartsComponent({ markets }) {
    const [selectedCoin, setSelectedCoin] = useState('BTC');
    const getTVSymbol = (coin) => {
        const specialExchanges = {
            'MEGA': 'MEXC:MEGAUSDT',  // Ищем MEGA на MEXC
            'CRCL': 'BINANCE:CRCLUSDT.P',
            'PLATINUM': 'BINGX:PLATINUMXPTUSDT.P',// AAVE есть на бинансе
            // 'DEGEN': 'BYBIT:DEGENUSDT' // Пример
        };
        return specialExchanges[coin] || `BINANCE:${coin}USDT`;
    };

    const tvSymbol = getTVSymbol(selectedCoin);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>

            <div className="chart-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 'bold' }}>Select Market:</h3>

                <select
                    value={selectedCoin}
                    onChange={(e) => setSelectedCoin(e.target.value)}
                    style={{
                        padding: '8px 16px',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        outline: 'none',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    {!markets || markets.length === 0 ? (
                        <option value="BTC">Loading markets...</option>
                    ) : (
                        markets.map((coin) => (
                            <option key={coin} value={coin} style={{ background: '#0d1e1f' }}>
                                {coin}
                            </option>
                        ))
                    )}
                </select>
            </div>

            <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', height: '100%' }}>
                <AdvancedRealTimeChart
                    symbol={tvSymbol}
                    theme="dark"
                    autosize={true}
                    hide_top_toolbar={false}
                    hide_legend={false}
                    allow_symbol_change={false}
                    backgroundColor="#0d1e1f"
                    toolbar_bg="#0d1e1f"
                />
            </div>

        </div>
    );
}