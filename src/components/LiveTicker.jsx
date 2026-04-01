// src/components/LiveTicker/LiveTicker.jsx
import { useEffect, useRef, useState } from 'react';
import './LiveTicker.css';

export default function LiveTicker() {
    const [items, setItems] = useState([]);
    const prevPrices = useRef({});
    const [flashes, setFlashes] = useState({});

    const fetchTicker = async () => {
        try {
            const res = await fetch('/api/stats/overview');
            const json = await res.json();
            if (!json.success) return;

            const topVolume = json.data.top_volume;

            const newFlashes = {};
            topVolume.forEach(item => {
                const prev = prevPrices.current[item.symbol];
                if (prev !== undefined && prev !== item.mark_price) {
                    newFlashes[item.symbol] = item.mark_price > prev ? 'up' : 'down';
                }
                prevPrices.current[item.symbol] = item.mark_price;
            });

            setItems(topVolume);

            if (Object.keys(newFlashes).length > 0) {
                setFlashes(newFlashes);
                setTimeout(() => setFlashes({}), 800);
            }
        } catch (e) {
            console.warn('LiveTicker fetch error:', e);
        }
    };

    useEffect(() => {
        fetchTicker();
        const id = setInterval(fetchTicker, 10_000);
        return () => clearInterval(id);
    }, []);

    if (items.length === 0) return null;

    const doubled = [...items, ...items];

    return (
        <div className="live-ticker">
            <div className="ticker-live-label">
                <span className="ticker-pulse" />
                LIVE
            </div>

            <div className="ticker-overflow">
                <div className="ticker-track">
                    {doubled.map((item, i) => {
                        const flash = flashes[item.symbol];
                        return (
                            <div
                                key={`${item.symbol}-${i}`}
                                className={`ticker-item ${flash ? `flash-${flash}` : ''}`}
                            >
                                <span className="ticker-symbol">{item.symbol}</span>
                                <span className="ticker-price">${formatPrice(item.mark_price)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function formatPrice(p) {
    const n = parseFloat(p);
    if (n >= 1000) return n.toLocaleString('en', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (n >= 1)    return n.toFixed(3);
    return n.toFixed(5);
}