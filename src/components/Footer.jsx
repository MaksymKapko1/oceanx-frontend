import React from 'react';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="app-footer">
            <div className="footer-content">

                {/* Левая часть: Бренд */}
                <div className="footer-brand">
                    <h3 className="footer-logo">Ocean<span>X</span></h3>
                    <p className="footer-desc">
                        Your unfair advantage in the Pacifica markets.
                        Trade smarter, not harder.
                    </p>
                    <span className="footer-copyright">© 2026 OceanX. All rights reserved.</span>
                </div>

                {/* Правая часть: Ссылки */}
                <div className="footer-links-grid">

                    <div className="footer-column">
                        <h4>Resources</h4>
                        <a href="https://oceanx-1.gitbook.io/oceanx-docs" target="_blank" rel="noopener noreferrer">Documentation</a>
                        <a href="/stats">Market Stats</a>
                        <a href="#">API Access</a>
                    </div>

                    <div className="footer-column">
                        <h4>Community</h4>
                        <a href="https://x.com/OceanXPaci" target="_blank" rel="noopener noreferrer">X (Twitter)</a>
                        <a href="#">Discord(Not yet)</a>
                        <a href="#">Telegram(Not yet)</a>
                    </div>

                    <div className="footer-column">
                        <h4>Legal</h4>
                        <a href="#">Terms of Service</a>
                        <a href="#">Privacy Policy</a>
                    </div>

                </div>
            </div>
        </footer>
    );
}