import React, { useState } from 'react';
import {baseUrl} from "../../constants/constants.js";
import {privateFetch} from "../../utils/pacificaUtils.js";
import {useIdentityToken} from "@privy-io/react-auth";

export default function StrategiesTradingPanelComponent({ markets }) {
    const { identityToken } = useIdentityToken();
    const [mode, setMode] = useState('single');

    const [singleCoin, setSingleCoin] = useState('BTC');
    const [singleAction, setSingleAction] = useState('long');
    const [singleSize, setSingleSize] = useState('');

    const [hedgeLongCoin, setHedgeLongCoin] = useState('BTC');
    const [hedgeShortCoin, setHedgeShortCoin] = useState('ETH');
    const [hedgeSize, setHedgeSize] = useState('');

    const handleExecute = async () => {
        if (mode === 'single') {
            if (!singleCoin || parseFloat(singleSize) <= 11) {
                alert("Please enter a valid size!")
                return;
            }

            try {
                const response = await privateFetch(`${baseUrl}/api/manual-trades/open`, {
                    method: 'POST',
                    body: JSON.stringify({
                        symbol: singleCoin,
                        side: singleAction,
                        size_usd: parseFloat(singleSize)
                    })
                }, () => identityToken);
                const result = await response.json();

                if (response.ok && result.success) {
                    alert(`✅ Order Executed!\nOpened ${singleAction.toUpperCase()} on ${singleCoin}`);
                } else {
                    alert(`❌ Failed to open order:\n${result.detail || result.error || 'Unknown error'}`);
                }
            } catch (error) {
                console.error("Error executing order:", error);
                alert("Network error. Check console.");
            }
        } else {
            if (!hedgeLongCoin || !hedgeShortCoin || parseFloat(hedgeSize) <= 22) {
                alert("Please enter valid coins and a size (min $11)!");
                return;
            }

            try {
                const response = await privateFetch(`${baseUrl}/api/manual-trades/hedge`, {
                    method: 'POST',
                    body: JSON.stringify({
                        long_symbol: hedgeLongCoin,
                        short_symbol: hedgeShortCoin,
                        size_usd: parseFloat(hedgeSize),
                    })
                }, () => identityToken);
                const result = await response.json();

                if (response.ok && result.success) {
                    alert(`✅ Hedge Executed!\nLong: ${hedgeLongCoin}\nShort: ${hedgeShortCoin}`);
                } else {
                    alert(`❌ Failed to execute hedge:\n${result.detail || result.error || 'Unknown error'}`);
                }
            } catch (error) {
                console.error("Error executing hedge:", error);
                alert("Network error. Check console.");
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px', color: 'white' }}>

            {/* Тумблер переключения режимов */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px' }}>
                <button
                    onClick={() => setMode('single')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                        background: mode === 'single' ? '#0ea5e9' : 'transparent', // Синий акцент для активного
                        color: mode === 'single' ? 'white' : 'rgba(255,255,255,0.5)',
                        transition: 'all 0.2s'
                    }}
                >
                    Single Order
                </button>
                <button
                    onClick={() => setMode('hedge')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                        background: mode === 'hedge' ? '#10b981' : 'transparent', // Изумрудный акцент для хеджа
                        color: mode === 'hedge' ? 'white' : 'rgba(255,255,255,0.5)',
                        transition: 'all 0.2s'
                    }}
                >
                    Double (Hedge)
                </button>
            </div>

            {/* КОНТЕНТ ДЛЯ SINGLE РЕЖИМА */}
            {mode === 'single' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setSingleAction('long')} style={actionBtnStyle(singleAction === 'long', '#10b981')}>Long</button>
                        <button onClick={() => setSingleAction('short')} style={actionBtnStyle(singleAction === 'short', '#ef4444')}>Short</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Select Market</label>
                        <MarketSelect value={singleCoin} onChange={setSingleCoin} markets={markets} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Position Size ($)</label>
                        <input type="number" placeholder="1000" value={singleSize} onChange={(e) => setSingleSize(e.target.value)} style={inputStyle} />
                    </div>
                </div>
            )}

            {/* КОНТЕНТ ДЛЯ HEDGE РЕЖИМА */}
            {mode === 'hedge' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>Long Leg</label>
                            <MarketSelect value={hedgeLongCoin} onChange={setHedgeLongCoin} markets={markets} />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '14px', color: '#ef4444', fontWeight: 'bold' }}>Short Leg</label>
                            <MarketSelect value={hedgeShortCoin} onChange={setHedgeShortCoin} markets={markets} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Size for EACH side ($)</label>
                        <input type="number" placeholder="1000" value={hedgeSize} onChange={(e) => setHedgeSize(e.target.value)} style={inputStyle} />
                    </div>
                </div>
            )}

            {/* РЕЗЮМЕ ОПЕРАЦИИ (В самом низу перед кнопкой) */}
            <div style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', fontSize: '14px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Summary:</span><br/>
                {mode === 'single'
                    ? `Open ${singleAction.toUpperCase()} on ${singleCoin} for $${singleSize || '0'}`
                    : `HEDGE: Long ${hedgeLongCoin} and Short ${hedgeShortCoin} for $${hedgeSize || '0'} each.`
                }
            </div>

            {/* КНОПКА ОТПРАВКИ */}
            <button
                onClick={handleExecute}
                style={{
                    padding: '16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer',
                    background: mode === 'single' ? (singleAction === 'long' ? '#10b981' : '#ef4444') : '#3b82f6',
                    color: 'white',
                    transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.8'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
            >
                Execute Order
            </button>
        </div>
    );
}

// Вспомогательный компонент для селектора (чтобы не дублировать код)
function MarketSelect({ value, onChange, markets }) {
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
            {!markets || markets.length === 0 ? <option value="BTC">Loading...</option> : markets.map(coin => <option key={coin} value={coin} style={{ background: '#0f2324' }}>{coin}</option>)}
        </select>
    );
}

// Вспомогательные стили
const inputStyle = {
    padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', outline: 'none', width: '100%', boxSizing: 'border-box'
};

const actionBtnStyle = (isActive, color) => ({
    flex: 1, padding: '12px', borderRadius: '8px', border: isActive ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
    background: isActive ? `${color}20` : 'transparent', color: isActive ? color : 'white', cursor: 'pointer', fontWeight: 'bold'
});