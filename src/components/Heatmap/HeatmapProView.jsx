import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';

const MAX_HISTORY = 120;
const TARGET_ROWS = 40;

const niceStep = (rawStep) => {
    if (rawStep <= 0) return 0.01;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const n = rawStep / magnitude;
    const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return nice * magnitude;
};

const decimalsForStep = (step) => {
    if (step >= 10)    return 0;
    if (step >= 1)     return 1;
    if (step >= 0.1)   return 2;
    if (step >= 0.01)  return 3;
    return 4;
};

const HeatmapProView = ({ symbol = '?', orderbook }) => {
    const [history, setHistory] = useState([]);
    const priceStepRef          = useRef(null);
    const lastTimeRef           = useRef(null);

    useEffect(() => {
        priceStepRef.current = null;
        setHistory([]);
        lastTimeRef.current = null;
    }, [symbol]);

    useEffect(() => {
        if (!orderbook?.bids?.length && !orderbook?.asks?.length) return;
        const { bids = [], asks = [] } = orderbook;

        if (priceStepRef.current === null) {
            const prices = [...bids, ...asks].map(l => parseFloat(l.p)).filter(isFinite);
            if (prices.length > 1) {
                const raw = (Math.max(...prices) - Math.min(...prices)) / TARGET_ROWS;
                priceStepRef.current = niceStep(raw);
            } else {
                priceStepRef.current = 0.01;
            }
        }

        const step     = priceStepRef.current;
        const decimals = decimalsForStep(step);

        const now = new Date().toLocaleTimeString('en-US', {
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
        if (lastTimeRef.current === now) return;
        lastTimeRef.current = now;

        const agg = (levels) => {
            const map = {};
            levels.forEach(lvl => {
                const p = parseFloat(lvl.p), a = parseFloat(lvl.a);
                if (!isFinite(p) || !isFinite(a) || a <= 0) return;
                const key = (Math.round(p / step) * step).toFixed(decimals);
                map[key] = (map[key] || 0) + a;
            });
            return map;
        };

        setHistory(prev => {
            const next = [...prev, { time: now, bids: agg(bids), asks: agg(asks), step, decimals }];
            if (next.length > MAX_HISTORY) next.shift();
            return next;
        });
    }, [orderbook]);

    const chartOptions = useMemo(() => {
        if (history.length === 0) return {};

        const { step, decimals } = history[history.length - 1];
        const times = history.map(s => s.time);

        let minPrice = Infinity, maxPrice = -Infinity, maxVol = 0;
        history.forEach(({ bids, asks }) => {
            const check = (map) => Object.entries(map).forEach(([p, v]) => {
                const pn = +p, vn = +v;
                if (pn < minPrice) minPrice = pn;
                if (pn > maxPrice) maxPrice = pn;
                if (vn > maxVol)   maxVol   = vn;
            });
            check(bids); check(asks);
        });
        if (!isFinite(minPrice)) return {};

        const levels = [];
        let p = Math.round(minPrice / step) * step;
        while (p <= maxPrice + step) {
            levels.push((+p).toFixed(decimals));
            p = Math.round((p + step) * 1e10) / 1e10;
        }
        const levelIndex = Object.fromEntries(levels.map((l, i) => [l, i]));

        const bidPoints = [], askPoints = [];
        history.forEach(({ bids, asks }, xIdx) => {
            Object.entries(bids).forEach(([pr, v]) => {
                const yi = levelIndex[pr];
                if (yi !== undefined) bidPoints.push([xIdx, yi, +v]);
            });
            Object.entries(asks).forEach(([pr, v]) => {
                const yi = levelIndex[pr];
                if (yi !== undefined) askPoints.push([xIdx, yi, +v]);
            });
        });

        const tickInterval = Math.max(1, Math.floor(levels.length / 10));

        return {
            backgroundColor: 'transparent',
            animation: false,

            tooltip: {
                position: 'top',
                backgroundColor: 'rgba(15, 40, 50, 0.92)',
                borderColor: 'rgba(255,255,255,0.15)',
                borderWidth: 1,
                borderRadius: 10,
                textStyle: { color: '#e0f4f4', fontSize: 12, fontFamily: 'monospace' },
                formatter(params) {
                    const time  = times[params.data[0]];
                    const price = levels[params.data[1]];
                    const vol   = params.data[2];
                    const side  = params.seriesName === 'Bids' ? '🟢 Bid' : '🔴 Ask';
                    return `${side}<br/>🕒 ${time}<br/>💰 $${price}<br/>📦 ${(+vol).toFixed(decimals)}`;
                },
            },

            grid: { top: 16, bottom: 40, left: 90, right: 16 },

            xAxis: {
                type: 'category',
                data: times,
                splitArea: { show: false },
                axisLabel: {
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    interval: Math.max(0, Math.floor(history.length / 6) - 1),
                },
                axisTick: { show: false },
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
            },

            yAxis: {
                type: 'category',
                data: levels,
                splitArea: { show: false },
                axisLabel: {
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    interval: tickInterval,
                    formatter: (val) => `$${val}`,
                },
                axisTick: { show: false },
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
                splitLine: {
                    show: true,
                    interval: tickInterval,
                    lineStyle: { color: 'rgba(255,255,255,0.06)' },
                },
            },

            visualMap: [
                {
                    seriesIndex: 0,
                    min: 0,
                    max: maxVol * 0.65,
                    show: false,
                    inRange: {
                        color: [
                            'rgba(0,0,0,0)',
                            'rgba(0,80,40,0.3)',
                            'rgba(0,140,60,0.6)',
                            'rgba(0,210,90,0.8)',
                            'rgba(0,255,120,0.95)',
                            'rgba(120,255,180,1)',
                        ],
                    },
                },
                {
                    seriesIndex: 1,
                    min: 0,
                    max: maxVol * 0.65,
                    show: false,
                    inRange: {
                        color: [
                            'rgba(0,0,0,0)',
                            'rgba(100,10,10,0.3)',
                            'rgba(180,20,20,0.6)',
                            'rgba(230,40,40,0.8)',
                            'rgba(255,70,50,0.95)',
                            'rgba(255,140,80,1)',
                        ],
                    },
                },
            ],

            series: [
                {
                    name: 'Bids',
                    type: 'heatmap',
                    data: bidPoints,
                    progressive: 2000,
                    animation: false,
                    itemStyle: { borderColor: 'transparent', borderWidth: 0 },
                    emphasis: {
                        itemStyle: {
                            borderColor: 'rgba(255,255,255,0.6)',
                            borderWidth: 1,
                            shadowBlur: 8,
                            shadowColor: 'rgba(0,255,120,0.5)',
                        },
                    },
                },
                {
                    name: 'Asks',
                    type: 'heatmap',
                    data: askPoints,
                    progressive: 2000,
                    animation: false,
                    itemStyle: { borderColor: 'transparent', borderWidth: 0 },
                    emphasis: {
                        itemStyle: {
                            borderColor: 'rgba(255,255,255,0.6)',
                            borderWidth: 1,
                            shadowBlur: 8,
                            shadowColor: 'rgba(255,70,50,0.5)',
                        },
                    },
                },
            ],
        };
    }, [history, symbol]);

    return (
        <div style={{
            width: '100%',
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.12)',
            overflow: 'hidden',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
            }}>
                <div>
                    <div style={{
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: 700,
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        letterSpacing: '0.05em',
                    }}>
                        {symbol} · Orderbook Heatmap
                    </div>
                    <div style={{
                        color: 'rgba(255,255,255,0.35)',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        marginTop: '2px',
                    }}>
                        step {priceStepRef.current} · {history.length} frames
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                            width: 28, height: 10, borderRadius: 3,
                            background: 'linear-gradient(90deg, rgba(0,80,40,0.3), rgba(0,255,120,1))',
                        }} />
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'monospace' }}>Bids</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                            width: 28, height: 10, borderRadius: 3,
                            background: 'linear-gradient(90deg, rgba(100,10,10,0.3), rgba(255,140,80,1))',
                        }} />
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'monospace' }}>Asks</span>
                    </div>
                </div>
            </div>

            {history.length > 0 ? (
                <ReactECharts
                    option={chartOptions}
                    style={{ height: '540px', width: '100%' }}
                    notMerge={true}
                    lazyUpdate={false}
                />
            ) : (
                <div style={{
                    height: '540px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    color: 'rgba(255,255,255,0.3)',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                }}>
                    <div style={{ fontSize: 32 }}>📊</div>
                    Waiting for order book data...
                </div>
            )}
        </div>
    );
};

export default HeatmapProView;