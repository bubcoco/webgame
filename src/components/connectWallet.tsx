'use client';
import React, { useState } from 'react';
import { ethers } from 'ethers';

const ConnectWallet: React.FC = () => {
    const [account, setAccount] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const connectWallet = async () => {
        setError(null);
        if (typeof window.ethereum === 'undefined') {
            setError('MetaMask is not installed');
            return;
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setAccount(address);
        } catch (err: any) {
            setError(err.message || 'Failed to connect wallet');
        }
    };

    return (
        <div>
            <button onClick={connectWallet}>
                {account ? 'Connected' : 'Connect MetaMask Wallet'}
            </button>
            {account && <div>Account: {account}</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
    );
};

export default ConnectWallet;