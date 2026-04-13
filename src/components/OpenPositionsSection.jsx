import React, { useEffect, useState, useRef } from 'react';
import './OpenPositionsSection.css';
import { createPortal } from 'react-dom';
import { usePrivy } from "@privy-io/react-auth";
import { usePacificaAccount } from "../hooks/usePacificaAccount";
import { Share2, Download, X } from 'lucide-react'; // 👈 Добавили иконки
import html2canvas from 'html2canvas'; // 👈 Добавили генератор картинок

const WS_URL = "wss://ws.pacifica.fi/ws";

export default function OpenPositionsSection() {
    const { user } = usePrivy();
    const walletAddress = user?.wallet?.address;

    const [positions, setPositions] = useState([]);
    const [prices, setPrices] = useState({});
    const [accountInfo, setAccountInfo] = useState({ ae: 0, cm: 0 });
    const [loading, setLoading] = useState(true);

    // 👈 Стейт для открытой модалки PnL
    const [sharePos, setSharePos] = useState(null);

    const ws = useRef(null);
    const { accountData } = usePacificaAccount(walletAddress);

    const calculateLivePnL = (pos, currentPrice) => {
        if (!currentPrice) return 0;
        const entry = parseFloat(pos.p);
        const amount = parseFloat(pos.a);
        return pos.d === 'bid'
            ? (currentPrice - entry) * amount
            : (entry - currentPrice) * amount;
    };

    useEffect(() => {
        if (!walletAddress) return;

        const connectWS = () => {
            ws.current = new WebSocket(WS_URL);

            ws.current.onopen = () => {
                ws.current.send(JSON.stringify({ method: "subscribe", params: { source: "account_positions", account: walletAddress } }));
                ws.current.send(JSON.stringify({ method: "subscribe", params: { source: "account_info", account: walletAddress } }));
                ws.current.send(JSON.stringify({ method: "subscribe", params: { source: "prices" } }));
                setLoading(false);
            };

            ws.current.onmessage = (event) => {
                const response = JSON.parse(event.data);
                if (response.channel === "account_positions") setPositions(response.data || []);
                if (response.channel === "account_info" && response.data) {
                    setAccountInfo({ ae: parseFloat(response.data.ae || 0), cm: parseFloat(response.data.cm || 0) });
                }
                if (response.channel === "prices" && Array.isArray(response.data)) {
                    setPrices(prevPrices => {
                        const newPrices = { ...prevPrices };
                        response.data.forEach(ticker => {
                            if (ticker.symbol && ticker.mark) newPrices[ticker.symbol] = parseFloat(ticker.mark);
                        });
                        return newPrices;
                    });
                }
            };
            ws.current.onclose = () => setTimeout(connectWS, 5000);
        };

        connectWS();
        const pingInterval = setInterval(() => {
            if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify({ method: "ping" }));
        }, 30000);

        return () => { clearInterval(pingInterval); ws.current?.close(); };
    }, [walletAddress]);

    const formatNum = (val, decimals = 2) => parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const formatSize = (val) => parseFloat(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });

    // 👈 ФУНКЦИЯ ДЛЯ СКАЧИВАНИЯ КАРТИНКИ
    const downloadPnLImage = async () => {
        const element = document.getElementById('pnl-card-capture');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: null, // Прозрачный фон
                scale: 2, // Высокое качество (Retina)
                useCORS: true
            });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `OceanX_${sharePos.symbol}_PnL.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Ошибка генерации картинки:", err);
        }
    };

    return (
        <div className="user-positions-section">
            <h3 className="section-title">
                Your Open Positions
                <span className="pos-count">{positions.length}</span>
            </h3>

            <div className="user-positions-scroll-container">
                <div className="positions-header">
                    <span>Symbol</span>
                    <span>Size</span>
                    <span>Entry / Mark</span>
                    <span>Liq. Price</span>
                    <span>Est. PNL (ROI)</span>
                </div>

                {loading ? (
                    <div className="positions-loading">Connecting to exchange stream...</div>
                ) : positions.length === 0 ? (
                    <div className="positions-empty">No open positions</div>
                ) : (
                    positions.map((pos, i) => {
                        const markPrice = prices[pos.s] || 0;
                        const entryPrice = parseFloat(pos.p);
                        const amount = parseFloat(pos.a);

                        const pnl = calculateLivePnL(pos, markPrice);
                        const posMargin = parseFloat(pos.m || 0);
                        const estimatedMargin = posMargin > 0 ? posMargin : (entryPrice * amount) / 50;
                        const roi = estimatedMargin > 0 ? (pnl / estimatedMargin) * 100 : 0;

                        let liqPrice = null;
                        if (pos.l && parseFloat(pos.l) !== 0) {
                            liqPrice = Math.abs(parseFloat(pos.l));
                        } else if (accountInfo.ae > 0) {
                            const buffer = accountInfo.ae - accountInfo.cm;
                            if (buffer > 0) {
                                const MMF = 0.01;
                                liqPrice = pos.d === 'bid'
                                    ? Math.max(0, markPrice - (buffer / (amount * (1 - MMF))))
                                    : markPrice + (buffer / (amount * (1 + MMF)));
                            }
                        }

                        const isProfit = pnl >= 0;

                        return (
                            <div key={i} className="positions-row">
                                <span className="pos-symbol">
                                    {pos.s}
                                    <small className={pos.d === 'bid' ? 'tag-long' : 'tag-short'}>
                                        {pos.d === 'bid' ? 'LONG' : 'SHORT'}
                                    </small>
                                </span>

                                <span className="pos-size">{formatSize(pos.a)}</span>

                                <div className="price-stack">
                                    <span>${formatNum(pos.p, 2)}</span>
                                    <span className="mark-live">${markPrice > 0 ? formatNum(markPrice, 2) : '---'}</span>
                                </div>

                                <span className="liq-price">{liqPrice ? `$${formatNum(liqPrice, 2)}` : '---'}</span>

                                {/* 👈 ДОБАВЛЕНА КНОПКА ПОДЕЛИТЬСЯ */}
                                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px'}}>
                                    <span className={`pnl-cell ${isProfit ? 'profit' : 'loss'}`} style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                                        <span>{isProfit ? '+' : ''}${formatNum(pnl, 2)}</span>
                                        <small style={{fontSize: '10px', opacity: 0.8}}>({isProfit ? '+' : ''}{formatNum(roi, 2)}%)</small>
                                    </span>
                                    <button
                                        className="pnl-share-btn"
                                        onClick={() => setSharePos({ symbol: pos.s, side: pos.d, roi, pnl, entry: pos.p, mark: markPrice, isProfit })}
                                        title="Share PnL"
                                    >
                                        <Share2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="section-footer">
                <button className="panic-close-btn" onClick={() => {}}>Close ALL Positions</button>
            </div>

            {/* 👈 МОДАЛКА С КАРТОЧКОЙ ДЛЯ СКАЧИВАНИЯ */}
            {sharePos && createPortal (
                <div className="pnl-modal-overlay" onClick={() => setSharePos(null)}>
                    <div className="pnl-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="pnl-modal-close" onClick={() => setSharePos(null)}><X size={20}/></button>

                        {/* КАРТОЧКА, КОТОРАЯ БУДЕТ СКРИНИТЬСЯ */}
                        <div id="pnl-card-capture" className={`pnl-share-card ${sharePos.isProfit ? 'profit-bg' : 'loss-bg'}`}>
                            <div className="pnl-card-header">
                                <div className="pnl-logo">OceanX</div>
                                <div className="pnl-pair">
                                    {sharePos.symbol} <span className={sharePos.side === 'bid' ? 'tag-long' : 'tag-short'}>{sharePos.side === 'bid' ? 'LONG' : 'SHORT'}</span>
                                </div>
                            </div>

                            <div className="pnl-card-body">
                                <div className={`pnl-roi-big ${sharePos.isProfit ? 'text-green' : 'text-red'}`}>
                                    {sharePos.isProfit ? '+' : ''}{formatNum(sharePos.roi, 2)}%
                                </div>
                                <div className="pnl-usd-val">
                                    {sharePos.isProfit ? '+' : ''}${formatNum(sharePos.pnl, 2)}
                                </div>
                            </div>

                            <div className="pnl-card-footer">
                                <div className="pnl-stat">
                                    <span>Entry Price</span>
                                    <strong>${formatNum(sharePos.entry, 4)}</strong>
                                </div>
                                <div className="pnl-stat">
                                    <span>Mark Price</span>
                                    <strong>${formatNum(sharePos.mark, 4)}</strong>
                                </div>
                                <div className="pnl-qr-placeholder">
                                    {/* Сюда можно вставить мини QR код на твой сайт */}
                                    oceanx.finance
                                </div>
                            </div>
                        </div>

                        <button className="pnl-download-btn" onClick={downloadPnLImage}>
                            <Download size={18}/> Download Image
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}