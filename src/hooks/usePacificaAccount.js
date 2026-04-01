import { useState, useEffect } from 'react';

export function usePacificaAccount(walletAddress) {
    const [accountData, setAccountData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!walletAddress) {
            setAccountData(null);
            return;
        }

        const fetchAccountData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`https://api.pacifica.fi/api/v1/account?account=${walletAddress}`)
                const json = await response.json();

                if (json.success) {
                    setAccountData(json.data);
                } else {
                    setError('Failed to fetch data');
                }
            } catch (err) {
                console.error("Error fetching Pacifica data:", err);
                setError(err.message)
            } finally {
                setIsLoading(false);
            }
        };
        void fetchAccountData();
        const interval = setInterval(fetchAccountData, 15000);
        return () => clearInterval(interval);
    }, [walletAddress]);
    return {accountData, isLoading, error};
}