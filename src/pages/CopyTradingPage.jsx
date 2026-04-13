import React from 'react';
import LeaderboardTable from "../components/LeaderboardTable.jsx";
import MySubscriptions from '../components/MySubscriptions.jsx';
import UserTradingSection from '../components/UserTradingSection.jsx';
import OpenPositionsSection from '../components/OpenPositionsSection.jsx';
import GuideCopyTrading from "../components/CopyTradeGuide/GuideCopyTrading.jsx";
import './CopyTradingPage.css';

export default function CopyTradingPage() {
    return (
        <div className="copy-trading-page">
            <GuideCopyTrading />

            <main className="copy-content-grid">
                <section className="copy-main-column" id="step-traders">
                    <LeaderboardTable />
                </section>

                <aside className="copy-sidebar-column" id="step-settings">
                    <UserTradingSection />
                    <MySubscriptions />
                </aside>
            </main>

            <header className="copy-top-header" id="step-positions">
                <OpenPositionsSection />
            </header>
        </div>
    );
}