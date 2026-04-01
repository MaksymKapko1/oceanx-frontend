import { useState, useEffect } from 'react';

export function useMarketStats() {
    const [stats, setStats] = useState(null);
    const [historicalVolume, setHistoricalVolume] = useState([]);
    const [historicalLiquidations, setHistoricalLiquidations] = useState([]); // 👈 стейт для ликвидаций
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [overviewRes, histRes] = await Promise.all([
                    fetch('http://localhost:8001/api/stats/overview').then(r => r.json()),
                    fetch('http://localhost:8001/api/stats/historical').then(r => r.json()),
                ]);

                if (overviewRes.success) setStats(overviewRes.data);
                if (histRes.success) {
                    setHistoricalVolume(histRes.data.volume);
                    setHistoricalLiquidations(histRes.data.liquidations)
                }
            } catch (e) {
                console.error('Failed to fetch market stats:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
        const interval = setInterval(fetchAll, 10000); // синхронно с бэком
        return () => clearInterval(interval);
    }, []);

    return { stats, historicalVolume, historicalLiquidations,loading };
}