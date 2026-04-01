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

export default function HistoricalLiquidationsChart({ data, loading }) {
    if (loading) return <div className="chart-card">Loading chart...</div>;
    if (!data?.length) return <div className="chart-card">No data</div>;

    const formatted = data.map(d => ({
        ...d,
        label: formatDate(d.time)
    }));

    return (
        <div className="chart-card">
            <h3 className="chart-title">Total Liquidations — All Time</h3>
            <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={formatted} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="liqGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis
                        dataKey="label"
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        interval={Math.floor(formatted.length / 8)}
                    />
                    <YAxis
                        tickFormatter={formatCurrency}
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={75}
                    />

                    <Tooltip
                        contentStyle={{
                            background: 'rgba(0,0,0,0.85)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '13px'
                        }}
                        formatter={(val) => [formatCurrency(val), 'Liquidated']}
                        labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="rgba(239, 68, 68, 0.2)"
                        strokeWidth={6}
                        fill="url(#liqGrad)"
                        dot={false}
                        activeDot={false}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#ef4444"
                        strokeWidth={1.5}
                        fill="none"
                        dot={false}
                        activeDot={{ r: 4, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}