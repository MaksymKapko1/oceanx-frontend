import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis,
    Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

import './MarketOverview.css';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    notation: 'compact', maximumFractionDigits: 2
}).format(val);

const formatDate = (timestamp) => new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
});

export default function HistoricalVolumeChart({ data, loading }) {
    if (loading) return <div className="chart-card">Loading chart...</div>;
    if (!data?.length) return <div className="chart-card">No data</div>;

    const formatted = data.map(d => ({
        ...d,
        label: formatDate(d.time)
    }));

    return (
        <div className="chart-card" >
            <h3 className="chart-title">Total Volume — All Time</h3>
            <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={formatted} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#ffffff" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ffffff" stopOpacity={0.03} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                    <XAxis
                        dataKey="label"
                        tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        interval={Math.floor(formatted.length / 8)}
                    />
                    <YAxis
                        tickFormatter={formatCurrency}
                        tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={75}
                    />

                    <Tooltip
                        contentStyle={{
                            background: 'rgba(0,0,0,0.85)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '13px'
                        }}
                        formatter={(val) => [formatCurrency(val), 'Volume']}
                        labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth={6}
                        fill="url(#volumeGrad)"
                        dot={false}
                        activeDot={false}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="rgba(255,255,255,0.9)"
                        strokeWidth={1.5}
                        fill="none"
                        dot={false}
                        activeDot={{ r: 4, fill: '#22d3ee' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}