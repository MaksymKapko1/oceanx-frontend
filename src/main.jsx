import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './main.css'
import App from './app.jsx'
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter } from "react-router-dom";
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';

const solanaConnectors = toSolanaWalletConnectors();

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <PrivyProvider
            appId="cmn8qodb2051f0cjohsom9wd9"
            config={{
                loginMethods: ['wallet'],
                appearance: {
                    theme: 'dark',
                    accentColor: '#00ffff',
                    showWalletLoginFirst: true,
                    walletList: ['phantom', 'solflare'],
                    walletChainType: 'solana-only'
                },
                externalWallets: {
                    solana: {
                        connectors: solanaConnectors
                    }
                }
            }}
        >
            <BrowserRouter>
                <App />
                <Analytics />
            </BrowserRouter>
        </PrivyProvider>
    </StrictMode>
)