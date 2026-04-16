import { useWallets, useSignMessage } from '@privy-io/react-auth/solana';
import { useIdentityToken, getIdentityToken } from "@privy-io/react-auth";
import { Keypair } from '@solana/web3.js';
import { prepareMessage, privateFetch } from '../utils/pacificaUtils';
import bs58 from 'bs58';

export function useAgentWallet() {
    const EXPIRY_WINDOW = 5000
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
            const header = { timestamp, expiry_window: EXPIRY_WINDOW, type: "bind_agent_wallet" };
            const payload = { agent_wallet: agentPublicKeyStr };

            const messageString = prepareMessage(header, payload);
            const messageBytes = new TextEncoder().encode(messageString);

            const { signature } = await signMessage({
                message: messageBytes,
                wallet: solanaWallet,
            });

            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
            const response = await privateFetch(`${baseUrl}/api/auth/save-agent`,
                {
                method: "POST",
                body: JSON.stringify({
                    agent_public_key: agentPublicKeyStr,
                    agent_private_key: agentPrivateKeyStr,
                    signature: bs58.encode(signature),
                    timestamp: timestamp,
                    expiry_window: EXPIRY_WINDOW
                })
            }, getIdentityToken
            );

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Backend error");
            }

            console.log("✅ The agent is linked via the backend!");
            return solanaWallet.address;

        } catch (error) {
            console.error("❌ Error:", error);
            throw error;
        }
    };

    return { bindAndSaveAgent };
}