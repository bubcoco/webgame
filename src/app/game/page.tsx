'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import SuperJumpQuest from '@/components/SuperJumpQuest';
import ClaimTokenButton from '@/components/claimTokenButton';

export default function GamePage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [gameScore, setGameScore] = useState(0);
  const [showClaimSection, setShowClaimSection] = useState(false);
  const [isEthersReady, setIsEthersReady] = useState(false);

  // --- Load Ethers.js from CDN (matching your pattern) ---
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.umd.min.js';
    script.async = true;
    script.onload = () => {
      console.log('ethers.js loaded');
      setIsEthersReady(true);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // --- Check if wallet is already connected ---
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum && isEthersReady) {
      checkConnection();
    }
  }, [isEthersReady]);

  const checkConnection = async () => {
    try {
      const provider = new (window as any).ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
      }
    } catch (error) {
      console.error('Check connection error:', error);
    }
  };

  // --- Connect Wallet ---
  const connectWallet = async () => {
    if (!isEthersReady) {
      alert('Web3 provider is not ready yet. Please try again in a moment.');
      return;
    }

    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed. Please install it to use this feature.');
      return;
    }

    try {
      const provider = new (window as any).ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please ensure MetaMask is installed and unlocked.');
    }
  };

  // --- Handle game end ---
  const handleGameEnd = (score: number) => {
    setGameScore(score);
    setShowClaimSection(true);
  };

  // --- Handle claim success ---
  const handleClaimSuccess = (txHash: string) => {
    console.log('Claim successful:', txHash);
    setShowClaimSection(false);
    setGameScore(0);
  };

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Game Component */}
      <SuperJumpQuest
        onGameEnd={handleGameEnd}
        walletAddress={walletAddress}
        onConnectWallet={connectWallet}
        showWalletButton={true}
      />

      {/* Claim Section - Shows when game ends */}
      {showClaimSection && gameScore > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t-4 border-yellow-500 p-6 shadow-2xl">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Score Display */}
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: '"Press Start 2P", cursive' }}>
                  🎮 Game Over!
                </h2>
                <p className="text-xl text-yellow-400">
                  You collected <span className="text-3xl font-bold">{gameScore / 100}</span> coins
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  = {gameScore / 100} MARIO tokens
                </p>
              </div>
              

              {/* Claim Button */}
              <div className="flex flex-col items-center gap-3">
                {walletAddress ? (
                  <>
                    <ClaimTokenButton
                      score={gameScore / 100} // Convert score to coins
                      walletAddress={walletAddress}
                      onClaimSuccess={handleClaimSuccess}
                    />
                    <button
                      onClick={() => setShowClaimSection(false)}
                      className="text-sm text-gray-400 hover:text-white transition"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-white text-sm mb-2">Connect wallet to claim tokens</p>
                    <button
                      onClick={connectWallet}
                      className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105"
                    >
                      Connect Wallet
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}