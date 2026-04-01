import React, { useState } from 'react';
import { Bell, Menu, X, BookOpen } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import WalletConnectButton from './WalletConnectButton';
import './AppHeader.css';

export default function AppHeader() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const getLinkClass = ({ isActive }) => isActive ? 'nav-link active' : 'nav-link';
    const getMobileLinkClass = ({ isActive }) => isActive ? "mobile-link active" : "mobile-link";

    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <header className="app-header">
            <div className="header-container">
                <div className="header-left">
                    {/* Логотип */}
                    <div className="logo-group">
                    </div>

                    {/* Десктопная навигация */}
                    <nav className="glass-btn desktop-nav">
                        <NavLink to="/" className={getLinkClass}>Main Page</NavLink>
                    </nav>

                    <nav className="glass-btn desktop-nav" style={{ marginLeft: '20px' }}>
                        <NavLink to="/copytrading" id="step-copy-trading" className={getLinkClass}>Copy Trading</NavLink>
                        <NavLink to="/stats" id="step-market-stats" className={getLinkClass}>Stats</NavLink>
                        <NavLink to="/heatmaps" id="step-heatmaps" className={getLinkClass}>Heatmaps</NavLink>
                    </nav>
                </div>

                {/* Единый блок действий (Кнопки + Бургер) */}
                <div className="header-actions">
                    {/* Кнопка туториала (Видна везде) */}
                    <button
                        className="glass-btn icon-btn"
                        title="Show Tutorial"
                        onClick={() => window.dispatchEvent(new Event('open-guide'))}
                    >
                        <BookOpen size={20} />
                    </button>

                    {/* Колокольчик (Скрываем на мобилках) */}
                    <button className="glass-btn icon-btn desktop-only">
                        <Bell size={20} />
                        <span className="notification-dot"></span>
                    </button>

                    {/* Кошелек (Виден везде, на мобилках адаптируем стилями) */}
                    <div className="wallet-wrapper">
                        <WalletConnectButton />
                    </div>

                    {/* Бургер (Скрыт на десктопе) */}
                    <button
                        className="glass-btn mobile-menu-btn"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Выпадающее мобильное меню (Только навигация) */}
            {isMobileMenuOpen && (
                <div className="mobile-dropdown">
                    <NavLink to="/" className={getMobileLinkClass} onClick={closeMenu}>Main Page</NavLink>
                    <NavLink to="/copytrading" className={getMobileLinkClass} onClick={closeMenu}>Copy Trading</NavLink>
                    <NavLink to="/stats" className={getMobileLinkClass} onClick={closeMenu}>Stats</NavLink>
                    <NavLink to="/heatmaps" className={getMobileLinkClass} onClick={closeMenu}>Heatmaps</NavLink>
                </div>
            )}
        </header>
    );
}