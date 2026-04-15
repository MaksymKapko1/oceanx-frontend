import { Routes, Route } from "react-router-dom";
import AppHeader from "./components/AppHeader.jsx";
import StatsPage from "./pages/StatsPage.jsx";
import MainPage from "./pages/MainPage.jsx";
import CopyTradingPage from "./pages/CopyTradingPage.jsx";
import HeatmapPage from "./pages/HeatmapPage.jsx";
import OnboardingGuide from "./components/OnboardGuide/OnboardingGuide.jsx";
import LiquidationsPage from "./pages/LiquidationsPage.jsx";
import React from "react";
import {useAuthSync} from "./hooks/useAuthSync.js";

function App() {
    useAuthSync();

    return (
            <>
                <AppHeader />
                <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/stats" element={<StatsPage />} />
                    <Route path="/heatmaps" element={<HeatmapPage />} />
                    <Route path="/copytrading" element={<CopyTradingPage />} />
                    <Route path="/liquidations" element={<LiquidationsPage />} />
                </Routes>
                <OnboardingGuide/>
            </>
    )
}

export default App;