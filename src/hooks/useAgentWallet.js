import { useWallets, useSignMessage } from '@privy-io/react-auth/solana';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { prepareMessage } from '../utils/pacificaUtils';

export function useAgentWallet() {
    const { wallets } = useWallets();
    const { signMessage } = useSignMessage();

    const bindAndSaveAgent = async () => {
        const solanaWallet = wallets[0];
        if (!solanaWallet) throw new Error("Solana wallet not found");

        try {
            const agentKeypair = Keypair.generate();
            const agentPublicKeyStr = agentKeypair.publicKey.toBase58();
            const agentPrivateKeyStr = bs58.encode(agentKeypair.secretKey);

            const timestamp = Date.now();
            const messageObj = {
                data: { agent_wallet: agentPublicKeyStr },
                expiry_window: 5000,
                timestamp: timestamp,
                type: "bind_agent_wallet"
            };

            const messageString = prepareMessage(messageObj.type === undefined ? messageObj : messageObj.header, messageObj.data);
            const messageBytes = new TextEncoder().encode(prepareMessage(
                { timestamp, expiry_window: 5000, type: "bind_agent_wallet" },
                { agent_wallet: agentPublicKeyStr }
            ));

            const { signature } = await signMessage({
                message: messageBytes,
                wallet: solanaWallet,
            });

            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
            const response = await fetch(`${baseUrl}/api/auth/save-agent`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_wallet: solanaWallet.address,
                    agent_public_key: agentPublicKeyStr,
                    agent_private_key: agentPrivateKeyStr,
                    signature: bs58.encode(signature),
                    timestamp: timestamp
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Ошибка на бэкенде");
            }

            console.log("✅ Агент привязан через бэкенд!");
            return solanaWallet.address;

        } catch (error) {
            console.error("❌ Ошибка:", error);
            throw error;
        }
    };

    return { bindAndSaveAgent };
}