'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import SuperJumpQuest from '@/components/SuperJumpQuest';
import ClaimTokenButton from '@/components/claimTokenButton';

export default function GamePage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [gameScore, setGameScore] = useState(0);
  const [showClaimSection, setShowClaimSection] = useState(false);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setWalletAddress(address);
        }
      } catch (error) {
        console.error('Check connection error:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed. Please install it to use this feature.');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      console.log('Wallet connected:', address);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  const handleGameEnd = (score: number) => {
    console.log('Game ended with score:', score);
    setGameScore(score);
    setShowClaimSection(true);
  };

  const handleClaimSuccess = (txHash: string) => {
    console.log('Claim successful! TX:', txHash);
    alert(`🎉 Success! Tokens claimed!\n\nTransaction: ${txHash.slice(0, 10)}...`);
    // Reset after successful claim
    setTimeout(() => {
      setShowClaimSection(false);
      setGameScore(0);
    }, 3000);
  };

  const handleClaimError = (error: string) => {
    console.error('Claim error:', error);
    alert(`❌ Claim failed: ${error}`);
  };

  return (
    <div className="min-h-screen bg-gray-800 relative">
      {/* Game Component */}
      <SuperJumpQuest
        onGameEnd={handleGameEnd}
        walletAddress={walletAddress}
        onConnectWallet={connectWallet}
        showWalletButton={true}
      />

      {/* Claim Section - Floating at bottom */}
      {showClaimSection && gameScore > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent backdrop-blur-sm border-t-4 border-yellow-500 p-6 shadow-2xl z-50 animate-slide-up">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Left Side - Score Display */}
              <div className="text-center md:text-left">
                <h2 
                  className="text-3xl md:text-4xl font-bold text-white mb-2" 
                  style={{ fontFamily: '"Press Start 2P", cursive' }}
                >
                  🎮 Game Over!
                </h2>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="text-xl text-gray-300">Final Score:</span>
                  <span className="text-3xl font-bold text-yellow-400">{gameScore}</span>
                </div>
                <p className="text-lg text-green-400 mt-2">
                  🪙 Earned: <span className="font-bold">{gameScore / 100}</span> coins
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  = {gameScore / 100} MARIO tokens
                </p>
              </div>

              {/* Right Side - Claim Button */}
              <div className="flex flex-col items-center gap-4">
                {walletAddress ? (
                  <>
                    <ClaimTokenButton
                      score={gameScore / 100} // Convert score to coins
                      walletAddress={walletAddress}
                      onClaimSuccess={handleClaimSuccess}
                      onClaimError={handleClaimError}
                    />
                    <button
                      onClick={() => setShowClaimSection(false)}
                      className="text-sm text-gray-400 hover:text-white transition underline"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-white text-sm mb-3">
                      Connect your wallet to claim tokens
                    </p>
                    <button
                      onClick={connectWallet}
                      className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      🔗 Connect Wallet
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-20 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50">
          <div>Wallet: {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}</div>
          <div>Score: {gameScore}</div>
          <div>Show Claim: {showClaimSection ? 'Yes' : 'No'}</div>
          <div>Coins: {gameScore / 100}</div>
        </div>
      )}

      {/* Add slide-up animation */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}