import React from 'react';
import {ArrowRight, Copy, Wallet, TrendingUp, Map, BarChart2, FlameIcon} from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import './MainPage.css';
;


import heroTerminalImg from '../assets/hero-terminal.png';
import LiveTicker from "../components/LiveTicker.jsx";
import Footer from "../components/Footer.jsx";

export default function MainPage() {
    const features = [
        {
            title: "Real-Time Analytics",
            icon: <BarChart2 size={32} className="feature-icon text-cyan" />,
            desc: "Dive deep into market dynamics with live trading volume, Open Interest, and liquidation data. Total transparency for every asset.",
            path: "/stats",
            actionText: "View Stats"
        },
        {
            title: "One Click Copy Trading",
            icon: <Copy size={32} className="feature-icon text-blue" />,
            desc: "Mirror the moves of elite traders in real-time. Automate your portfolio growth with seamless, one-click execution and follow the smart money.",
            path: "/copytrading",
            actionText: "Copy Traders"
        },
        {
            title: "Heatmaps",
            icon: <Map size={32} className="feature-icon text-green" />,
            desc: "Gain a bird's-eye view of the market. Visualize liquidity clusters, whale activity, and price intensity across all 60+ Pacifica trading pairs.",
            path: "/heatmaps",
            actionText: "Open Heatmaps"
        },
        {
            title: "Liquidations",
            icon: <FlameIcon size={32} className="feature-icon text-orange" />,
            desc: "Monitor the market's pressure points. Track real-time forced liquidations and leverage wipeouts across all pairs to spot volatility spikes and potential reversals.",
            path: "/liquidations",
            actionText: "Open Liquidations"
        },
        {
            title: "Hedge Farm Funding",
            icon: <Wallet size={32} className="feature-icon text-red" />,
            desc: "Maximize your capital efficiency through automated yield strategies and diversified hedge protocols. Institutional-grade fund management, decentralized.",
            path: "#",
            actionText: "Coming Soon"
        },
        {
            title: "Predictions via Pacifica",
            icon: <TrendingUp size={32} className="feature-icon text-purple" />,
            desc: "Anticipate the market's next move. Participate in high-stakes prediction markets and turn your technical insights into measurable rewards.",
            path: "#",
            actionText: "Coming Soon"
        }
    ];

    return (
        <main className="main-page-container">
            <LiveTicker/>

            <section className="hero-section">
                <div className="hero-split-layout">

                    <div className="hero-text-content">
                        <h1 className="hero-title">
                            Dive into <span className="text-gradient">OceanX</span>
                        </h1>
                        <p className="hero-subtitle">
                            Your unfair advantage in the Pacifica markets. Explore real-time stats, automated copy trading, and professional-grade heatmaps. OceanX simplifies complex blockchain data into actionable insights, helping you stay ahead of the curve.
                        </p>

                        <div className="hero-actions">
                            <NavLink to="/stats" className="btn-primary">
                                Explore Stats <ArrowRight size={20} />
                            </NavLink>
                            <a
                                href="https://oceanx-1.gitbook.io/oceanx-docs"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary"
                                style={{ textDecoration: 'none' }}
                            >
                                Read Docs
                            </a>
                        </div>
                    </div>

                    <div className="hero-visualizer glass-frame-wrapper">
                        <img
                            src={heroTerminalImg}
                            alt="OceanX Trading Interface with Paci"
                            className="hero-terminal-image"
                        />
                    </div>

                </div>
            </section>

            <section className="features-section">
                <div className="carousel-container">
                    {features.map((item, index) => {
                        const isComingSoon = item.path === "#";

                        return isComingSoon ? (
                            <div key={index} className="feature-link-wrapper" style={{ cursor: 'not-allowed', opacity: 0.8 }}>
                                <div className="feature-card">
                                    <div className="card-glass-bg"></div>
                                    <div className="card-content">
                                        {item.icon}
                                        <h3>{item.title}</h3>
                                        <p>{item.desc}</p>
                                        <div className="feature-action" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                            <span>{item.actionText}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link to={item.path} key={index} className="feature-link-wrapper">
                                <div className="feature-card">
                                    <div className="card-glass-bg"></div>
                                    <div className="card-content">
                                        {item.icon}
                                        <h3>{item.title}</h3>
                                        <p>{item.desc}</p>
                                        <div className="feature-action">
                                            <span>{item.actionText}</span>
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>
            <Footer />
        </main>
    );
}