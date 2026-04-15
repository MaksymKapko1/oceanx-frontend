import React from 'react';
import LiquidationsTable from '../components/LiquidationsTable'; // Убедись, что путь правильный
import './MainPage.css'; // Используем общие стили для отступов

export default function LiquidationsPage() {
    return (
        <main className="page-container" style={{ padding: '20px', marginTop: '40px' }}>
            <div className="content-wrapper">
                <LiquidationsTable />
            </div>
        </main>
    );
}