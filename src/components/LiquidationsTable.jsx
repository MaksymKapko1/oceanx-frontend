import React, { useEffect, useState, useRef } from 'react';
import './LiquidationsTable.css';

export default function LiquidationsTable() {
    const [liquidations, setLiquidations] = useState([]);
    const [loading, setLoading] = useState(true);
    const socket = useRef(null);

    const totalVolume = liquidations.reduce((sum, item) => sum + item.usd_amount, 0);
    const lastPrice = liquidations[0]?.price || 0;
    const topAsset = liquidations[0]?.coin || '---';

    // 1. Первичная загрузка через REST
    useEffect(() => {
        fetch('http://localhost:8001/api/liquidations/?limit=5')
            .then(res => res.json())
            .then(data => {
                setLiquidations(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("REST Error:", err);
                setLoading(false);
            });

        // 2. Подключение к WebSocket
        socket.current = new WebSocket('ws://localhost:8001/ws');

        socket.current.onopen = () => console.log('✅ Connected to Liq WebSocket');

        socket.current.onmessage = (event) => {
            const message = JSON.parse(event.data);

            // Проверяем, что это именно ликвидации
            if (message.type === 'liquidations') {
                const newLiqs = message.data;

                setLiquidations(prev => {
                    // Берем новые данные, добавляем их в начало и ограничиваем список 5-7 строками
                    const updatedList = [...newLiqs, ...prev];
                    return updatedList.slice(0, 7);
                });
            }
        };

        socket.current.onclose = () => console.log('❌ WebSocket Disconnected');

        // Чистим соединение при уходе со страницы
        return () => {
            if (socket.current) socket.current.close();
        };
    }, []);

    const shortenHash = (hash) => {
        if (!hash) return '---';
        const str = String(hash);
        return `${str.slice(0, 4)}...${str.slice(-4)}`;
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="table-wrapper">


            {/* ГЛАВНАЯ ПОДКЛАДКА */}
            <div className="glass-main-container">
                <div className="table-header-main">
                    <h2>Latest Liquidations</h2>
                    {/*<div className="live-indicator">*/}
                    {/*    <div className="dot"></div> REAL-TIME feed*/}
                    {/*</div>*/}
                </div>

                {/* ЗАГОЛОВКИ ПОЛЕЙ */}
                <div className="column-labels">
                    <span>ASSET</span>
                    <span>SIDE</span>
                    <span>PRICE</span>
                    <span>LIQ VALUE</span>
                    <span>HASH</span>
                </div>

                <div className="liq-list">
                    {loading ? (
                        <div className="loading">Syncing with Pacifica...</div>
                    ) : (
                        liquidations.map((liq) => (
                            <div key={liq.trade_id} className="liq-item-card row-animation">
                                <div className="cell asset">
                                    <div className="asset-icon">{liq.coin[0]}</div>
                                    {liq.coin}
                                </div>
                                <div className="cell">
                                    <span className={`side-tag ${liq.side.includes('long') ? 'long' : 'short'}`}>
                                        {liq.side.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="cell price">{formatMoney(liq.price)}</div>
                                <div className="cell value">{formatMoney(liq.usd_amount)}</div>
                                <div className="cell">
                                    <a href="#" className="hash-pill">{String(liq.trade_id).slice(-6)}</a>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}