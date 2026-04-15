import React, { useState } from 'react';
import { Zap, ArrowLeftRight, ShieldCheck, Info } from 'lucide-react';
import './TradingPanel.css';

export default function TradingPanel({ primaryAsset }) {
    const [mode, setMode] = useState('simple'); // 'simple' | 'pair'
    const [side, setSide] = useState('long'); // 'long' | 'short'
    const [assetB, setAssetB] = useState('ETH');
    const [amount, setAmount] = useState('');

    return (
        <div className="trading-panel-root">
            {/* Переключатель режимов */}
            <div className="mode-selector-pill">
                <button
                    className={`mode-btn ${mode === 'simple' ? 'active' : ''}`}
                    onClick={() => setMode('simple')}
                >
                    Simple
                </button>
                <button
                    className={`mode-btn ${mode === 'pair' ? 'active' : ''}`}
                    onClick={() => setMode('pair')}
                >
                    Pair Trade
                </button>
            </div>

            <div className="trade-config-box">
                {/* Выбор стороны (только для Simple) */}
                {mode === 'simple' && (
                    <div className="side-selector">
                        <button className={`side-btn long ${side === 'long' ? 'active' : ''}`} onClick={() => setSide('long')}>LONG</button>
                        <button className={`side-btn short ${side === 'short' ? 'active' : ''}`} onClick={() => setSide('short')}>SHORT</button>
                    </div>
                )}

                {/* Активы */}
                <div className="assets-config">
                    <div className="asset-row">
                        <span className="label">{mode === 'pair' ? 'Long (A)' : 'Asset'}</span>
                        <div className="asset-badge-static">{primaryAsset}</div>
                    </div>

                    {mode === 'pair' && (
                        <>
                            <div className="pair-visual-divider">
                                <ArrowLeftRight size={14} className="text-cyan" />
                            </div>
                            <div className="asset-row">
                                <span className="label">Short (B)</span>
                                <select
                                    className="asset-select-glass"
                                    value={assetB}
                                    onChange={(e) => setAssetB(e.target.value)}
                                >
                                    <option value="ETH">ETH</option>
                                    <option value="SOL">SOL</option>
                                    <option value="BTC">BTC</option>
                                </select>
                            </div>
                        </>
                    )}
                </div>

                {/* Инпуты */}
                <div className="input-field">
                    <div className="field-header">
                        <span>Margin (USD)</span>
                        <span className="balance">Max: $1,240</span>
                    </div>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="glass-input"
                    />
                </div>

                {/* Кнопка исполнения */}
                <button className={`execute-trade-btn ${mode === 'pair' ? 'pair-neon' : side}`}>
                    {mode === 'pair' ? <ArrowLeftRight size={18} /> : <Zap size={18} />}
                    <span>
                        {mode === 'pair' ? 'Execute Atomic Pair' : `${side.toUpperCase()} ${primaryAsset}`}
                    </span>
                </button>

            </div>
        </div>
    );
}