import { useMarketStats } from '../hooks/useMarketStats';
import SummaryCards from './SummaryCards';
import VolumeTreemap from './VolumeTreemap';
import OpenInterestBars from './OpenInterestBars';
import HistoricalVolumeChart from './HistoricalVolumeChart';
import HistoricalLiquidationsChart from "./HistoricalLiquidationsChart.jsx";

import './MarketOverview.css';

export default function MarketOverview() {
    const { stats, historicalVolume, historicalLiquidations, loading } = useMarketStats();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <SummaryCards stats={stats} loading={loading} />

            <div className="charts-grid">
                <VolumeTreemap topVolume={stats?.top_volume} />
                <OpenInterestBars topOI={stats?.top_oi} />
                <HistoricalVolumeChart data={historicalVolume} loading={loading} />
                <HistoricalLiquidationsChart data={historicalLiquidations} loading={loading} />
            </div>
        </div>
    );
}