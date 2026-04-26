import React from 'react';
import OpenPositionsSection from "../components/OpenPositionsSection.jsx";
import StrategiesTradingPanelComponent from "../components/StrategiesTradingPanel/StrategiesTradingPanelComponent.jsx";
import ChartsComponent from "../components/Charts/ChartsComponent.jsx";
import './StrategiesPage.css';
import {useMarketStats} from "../hooks/useMarketStats.js";

export default function StrategiesPage() {
    const { stats, loading } = useMarketStats();
    const availableMarkets = stats?.market_symbols || [];

    return (
        <div className="strategies-page">

            <main className="strategies-content-grid">

                <section className="strategies-main-column">
                    <ChartsComponent markets={availableMarkets} />
                </section>

                <aside className="strategies-sidebar-column">
                    <StrategiesTradingPanelComponent markets={availableMarkets} />
                </aside>

            </main>

            <section className="strategies-bottom-section">
                <OpenPositionsSection/>
            </section>

        </div>
    )
}