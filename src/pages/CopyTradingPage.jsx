import LeaderboardTable from "../components/LeaderboardTable.jsx";

function CopyTradingPage() {
    console.log('CopyTradingPage рендерится')
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #065f46 0%, #0891b2 50%, #155e75 100%)',
            color: 'white',
            paddingTop: '100px',  // ← вот это
            paddingBottom: '50px'
        }}>
            <LeaderboardTable />
        </div>
    )
}

export default CopyTradingPage;