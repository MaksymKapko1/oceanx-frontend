import AppHeader from "../components/AppHeader.jsx";
import MarketOverview from "../components/MarketOverview.jsx";

function StatsPage() {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #065f46 0%, #0891b2 50%, #155e75 100%)',
            color: 'white',
            paddingBottom: '50px'
        }}>
            <AppHeader />

            <main style={{ paddingTop: '140px', maxWidth: '1400px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>

                <MarketOverview />

            </main>
        </div>
    )
}

export default StatsPage;