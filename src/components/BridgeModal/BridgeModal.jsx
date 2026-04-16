import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './BridgeModal.css';

const RHINO_API_KEY = import.meta.env.VITE_RHINO_API_KEY;

const RHINO_THEME = encodeURIComponent(JSON.stringify({
    colors: {
        primary: '#2dd4bf',
        primaryLight: '#5eead4',
        widgetBackground: '#0a1628',
        select: '#0f1f3a',
        textPrimary: '#ffffff',
        textSecondary: 'rgba(255,255,255,0.6)',
        textPrimaryCta: '#0f172a',
        stroke: 'rgba(255,255,255,0.1)',
    },
    radius: {
        widget: '20px',
        actionElements: '12px',
        tokenSelect: '10px',
    }
}));

export default function BridgeModal({ onClose, recipientAddress }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const iframeSrc = [
        `https://widget.rhino.fi/?apiKey=${RHINO_API_KEY}`,
        `mode=dark`,
        `theme=${RHINO_THEME}`,
        `chainOut=SOLANA`,
        `token=USDC`,
        recipientAddress ? `recipient=${recipientAddress}` : '',
    ].filter(Boolean).join('&');

    // Оборачиваем в createPortal
    return createPortal(
        <div className="bridge-overlay" onClick={onClose}>
            <div className="bridge-modal" onClick={(e) => e.stopPropagation()}>
                <div className="bridge-modal-header">
                    <span className="bridge-modal-title">Bridge & Deposit</span>
                    <button className="bridge-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="bridge-iframe-wrapper">
                    <iframe
                        src={iframeSrc}
                        style={{ width: '100%', height: '581px', border: 'none' }}
                        scrolling="no"
                        title="Rhino Bridge"
                    />
                </div>
            </div>
        </div>,
        document.body
    );
}