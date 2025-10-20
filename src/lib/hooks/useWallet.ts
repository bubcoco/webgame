// src/lib/hooks/useWallet.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import type { WalletState } from '@/lib/types';
import { AMOY_NETWORK_CONFIG } from '@/lib/contracts/contractConfig';

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    balance: '0'
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is already connected
  useEffect(() => {
    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setWallet(prev => ({
          ...prev,
          address: accounts[0]
        }));
        updateBalance(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const checkConnection = async () => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();
        const balance = await provider.getBalance(address);

        setWallet({
          address,
          chainId: Number(network.chainId),
          isConnected: true,
          balance: ethers.formatEther(balance)
        });
      }
    } catch (err) {
      console.error('Check connection error:', err);
    }
  };

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      await provider.send('eth_requestAccounts', []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      // Check if on correct network
      if (Number(network.chainId) !== AMOY_NETWORK_CONFIG.chainId) {
        await switchNetwork();
      }

      setWallet({
        address,
        chainId: Number(network.chainId),
        isConnected: true,
        balance: ethers.formatEther(balance)
      });

    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      address: null,
      chainId: null,
      isConnected: false,
      balance: '0'
    });
  }, []);

  const switchNetwork = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${AMOY_NETWORK_CONFIG.chainId.toString(16)}` }],
      });
    } catch (err: any) {
      // If chain doesn't exist, add it
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${AMOY_NETWORK_CONFIG.chainId.toString(16)}`,
            chainName: AMOY_NETWORK_CONFIG.chainName,
            rpcUrls: [AMOY_NETWORK_CONFIG.rpcUrl],
            blockExplorerUrls: [AMOY_NETWORK_CONFIG.blockExplorer]
          }],
        });
      }
    }
  };

  const updateBalance = async (address: string) => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(address);
      
      setWallet(prev => ({
        ...prev,
        balance: ethers.formatEther(balance)
      }));
    } catch (err) {
      console.error('Balance update error:', err);
    }
  };

  return {
    wallet,
    isConnecting,
    error,
    connect,
    disconnect,
    switchNetwork,
    updateBalance
  };
}