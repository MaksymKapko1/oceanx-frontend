import React from 'react';
import LiquidationsTable from '../components/LiquidationsTable';
import './MainPage.css';

export default function LiquidationsPage() {
    return (
        <main className="page-container" style={{ padding: '20px', marginTop: '40px' }}>
            <div className="content-wrapper">
                <LiquidationsTable />
            </div>
        </main>
    );
}