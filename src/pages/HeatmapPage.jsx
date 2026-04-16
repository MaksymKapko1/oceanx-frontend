import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Flame, TrendingUp, Loader2 } from 'lucide-react';
import { useMarketStats } from '../hooks/useMarketStats';
import { useIdentityToken } from "@privy-io/react-auth";
import OrderbookView from '../components/Heatmap/OrderbookView';
import DepthChartView from '../components/Heatmap/DepthChartView';
import HeatmapProView from '../components/Heatmap/HeatmapProView';

import '../components/Heatmap/HeatmapPage.css';

const HOT_TOKENS = ['BTC', 'ETH', 'SOL'];

const formatVolume = (vol) => {
    if (!vol) return '0M';
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
    return `$${(vol / 1e3).toFixed(0)}K`;
};

export default function HeatmapPage() {
    const { stats, loading } = useMarketStats();
    const { identityToken } = useIdentityToken();

    const [activeSymbol, setActiveSymbol] = useState('SOL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [activeTab, setActiveTab] = useState('orderbook');

    const [orderbook, setOrderbook] = useState({ bids: [], asks: [] });
    const wsRef = useRef(null);
    const prevSymbolRef = useRef(activeSymbol);

    const realMarkets = useMemo(() => {
        if (!stats || !stats.top_volume) return [];
        return stats.top_volume.map(market => ({
            symbol: market.symbol, name: market.symbol,
            hot: HOT_TOKENS.includes(market.symbol), volume: formatVolume(market.volume_24h)
        }));
    }, [stats]);

    const filteredMarkets = realMarkets.filter(m => m.symbol.toLowerCase().includes(searchQuery.toLowerCase()));
    const hotMarkets = filteredMarkets.filter(m => m.hot);
    const regularMarkets = filteredMarkets.filter(m => !m.hot);

    useEffect(() => {
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8001/ws';
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({
                action: 'auth',
                token: identityToken || null
            }));

            setIsConnected(true);
            ws.send(JSON.stringify({ action: 'subscribe', params: { source: 'book', symbol: prevSymbolRef.current, agg_level: 1 }}));
        };
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'orderbook_update' && data.symbol === prevSymbolRef.current) {
                    setOrderbook({ bids: data.bids || [], asks: data.asks || [] });
                }
            } catch (e) {}
        };

        ws.onclose = () => setIsConnected(false);
        return () => ws.close();
    }, [identityToken]);

    useEffect(() => {
        if (!isConnected || !wsRef.current) return;
        if (prevSymbolRef.current !== activeSymbol) {
            wsRef.current.send(JSON.stringify({ action: 'unsubscribe', params: { source: 'book', symbol: prevSymbolRef.current, agg_level: 1 }}));
            setOrderbook({ bids: [], asks: [] });
            wsRef.current.send(JSON.stringify({ action: 'subscribe', params: { source: 'book', symbol: activeSymbol, agg_level: 1 }}));
            prevSymbolRef.current = activeSymbol;
        }
    }, [activeSymbol, isConnected]);

    return (
        <div className="heatmap-layout">
            <aside className="glass-panel sidebar">
                <div className="sidebar-header">
                    <h2>Markets</h2>
                    <div className="search-box"><Search size={16} /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                </div>
                <div className="market-list">
                    {loading && <div style={{padding: '20px', textAlign: 'center'}}><Loader2 className="lucide-spin text-cyan" /></div>}

                    {!loading && (
                        <>
                            <div className="market-section">
                                <div className="section-title"><Flame size={12}/> HOT</div>
                                {hotMarkets.map(m => (
                                    <button key={m.symbol} className={`market-item ${activeSymbol === m.symbol ? 'active' : ''}`} onClick={() => setActiveSymbol(m.symbol)}>
                                        <span className="symbol">{m.symbol}</span>
                                        <span className="volume">{m.volume}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="market-section">
                                <div className="section-title"><TrendingUp size={12}/> ALL</div>
                                {regularMarkets.map(m => (
                                    <button key={m.symbol} className={`market-item ${activeSymbol === m.symbol ? 'active' : ''}`} onClick={() => setActiveSymbol(m.symbol)}>
                                        <span className="symbol">{m.symbol}</span>
                                        <span className="volume">{m.volume}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </aside>

            <main className="heatmap-main">
                <div className="heatmap-header glass-panel">
                    <div className="active-market-info">
                        <h1>{activeSymbol}-PERP</h1>
                        <span className={`status-badge ${isConnected ? 'live' : 'connecting'}`}>{isConnected ? '🟢 Live' : '🟡 Connecting'}</span>
                    </div>

                    <div className="heatmap-controls">
                        <button className={activeTab === 'orderbook' ? 'active' : ''} onClick={() => setActiveTab('orderbook')}>Orderbook</button>
                        <button className={activeTab === 'depth' ? 'active' : ''} onClick={() => setActiveTab('depth')}>Depth Chart</button>
                        <button className={activeTab === 'heatmap' ? 'active' : ''} onClick={() => setActiveTab('heatmap')}>Heatmap Pro</button>
                    </div>
                </div>

                <div className="heatmap-canvas-container glass-panel" style={{ padding: '20px' }}>

                    {orderbook.bids.length === 0 && orderbook.asks.length === 0 ? (
                        <div className="placeholder-canvas" style={{ marginTop: '20%' }}><Loader2 className="lucide-spin text-cyan" size={32} /><h3>Loading...</h3></div>
                    ) : (
                        <>
                            {activeTab === 'orderbook' && <OrderbookView orderbook={orderbook} />}
                            {activeTab === 'depth' && <DepthChartView orderbook={orderbook} />}
                            {activeTab === 'heatmap' && <HeatmapProView orderbook={orderbook} symbol={activeSymbol}/>}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}