import React from 'react';

export default function OrderbookView({ orderbook }) {
    if (!orderbook.bids.length && !orderbook.asks.length) return null;

    const allSizes = [
        ...orderbook.bids.slice(0, 20).map(b => parseFloat(b.a)),
        ...orderbook.asks.slice(0, 20).map(a => parseFloat(a.a))
    ];
    const maxAbsSize = Math.max(...allSizes);

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '60px',
            width: '100%',
            maxWidth: '1000px'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.4, fontSize: '0.7rem', padding: '0 10px' }}>
                    <span>SIZE</span><span>PRICE</span>
                </div>
                {orderbook.bids.slice(0, 20).map((b, i) => {
                    const fill = (parseFloat(b.a) / maxAbsSize) * 100;
                    return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 10px', fontSize: '0.9rem', position: 'relative', fontFamily: 'monospace' }}>
                            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${fill}%`, backgroundColor: 'rgba(16, 185, 129, 0.1)', zIndex: 0 }} />
                            <span style={{ zIndex: 1, color: 'rgba(255,255,255,0.8)' }}>{parseFloat(b.a).toFixed(4)}</span>
                            <span style={{ zIndex: 1, color: '#10b981', fontWeight: '600' }}>{parseFloat(b.p).toFixed(2)}</span>
                        </div>
                    )
                })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.4, fontSize: '0.7rem', padding: '0 10px' }}>
                    <span>PRICE</span><span>SIZE</span>
                </div>
                {orderbook.asks.slice(0, 20).map((a, i) => {
                    const fill = (parseFloat(a.a) / maxAbsSize) * 100;
                    return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 10px', fontSize: '0.9rem', position: 'relative', fontFamily: 'monospace' }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fill}%`, backgroundColor: 'rgba(255, 107, 107, 0.1)', zIndex: 0 }} />
                            <span style={{ zIndex: 1, color: '#ff6b6b', fontWeight: '600' }}>{parseFloat(a.p).toFixed(2)}</span>
                            <span style={{ zIndex: 1, color: 'rgba(255,255,255,0.8)' }}>{parseFloat(a.a).toFixed(4)}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}