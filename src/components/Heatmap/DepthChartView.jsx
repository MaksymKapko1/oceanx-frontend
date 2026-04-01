// src/components/Heatmap/DepthChartView.jsx
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DepthChartView({ orderbook }) {
    // Переносим математику сюда
    const data = useMemo(() => {
        if (!orderbook.bids.length || !orderbook.asks.length) return [];

        let totalBid = 0;
        const bidsData = [...orderbook.bids].map(b => {
            totalBid += parseFloat(b.a);
            return { price: parseFloat(b.p), bidSize: totalBid, askSize: 0 };
        }).reverse();

        let totalAsk = 0;
        const asksData = [...orderbook.asks].map(a => {
            totalAsk += parseFloat(a.a);
            return { price: parseFloat(a.p), bidSize: 0, askSize: totalAsk };
        });

        return [...bidsData, ...asksData];
    }, [orderbook]);

    if (data.length === 0) return null;

    return (
        <div style={{ height: '100%', width: '100%', minHeight: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorBid" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAsk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="price" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickFormatter={(val) => val.toFixed(2)} minTickGap={50} />
                    <YAxis orientation="right" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: 'white' }} labelFormatter={(val) => `Price: ${val}`} />
                    <Area type="step" dataKey="bidSize" stroke="#10b981" fillOpacity={1} fill="url(#colorBid)" />
                    <Area type="step" dataKey="askSize" stroke="#ef4444" fillOpacity={1} fill="url(#colorAsk)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}