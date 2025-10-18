'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import SuperJumpQuest from '@/components/SuperJumpQuest';
import ClaimTokenButton from '@/components/claimTokenButton';

export default function GamePage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [gameScore, setGameScore] = useState(0);
  const [showClaimSection, setShowClaimSection] = useState(false);

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
          console.log('✅ Wallet connected:', address);
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
      console.log('✅ Wallet connected:', address);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleGameEnd = (score: number) => {
    console.log('🎮 handleGameEnd called with score:', score);
    setGameScore(score);
    setShowClaimSection(true);
    console.log('✅ State updated - showClaimSection set to true');
  };

  const handleClaimSuccess = (txHash: string) => {
    console.log('✅ Claim successful! TX:', txHash);
    alert(`🎉 Success! Tokens claimed!\n\nTransaction: ${txHash.slice(0, 10)}...`);
    setTimeout(() => {
      setShowClaimSection(false);
      setGameScore(0);
    }, 3000);
  };

  const handleClaimError = (error: string) => {
    console.error('❌ Claim error:', error);
    alert(`❌ Claim failed: ${error}`);
  };

  // Log state changes
  useEffect(() => {
    console.log('📊 State changed:');
    console.log('  - showClaimSection:', showClaimSection);
    console.log('  - gameScore:', gameScore);
    console.log('  - walletAddress:', walletAddress);
  }, [showClaimSection, gameScore, walletAddress]);

  return (
    <>
      {/* Game Component - Full screen */}
      <SuperJumpQuest
        onGameEnd={handleGameEnd}
        walletAddress={walletAddress}
        onConnectWallet={connectWallet}
        showWalletButton={true}
      />

      {/* Claim Section - OUTSIDE SuperJumpQuest, fixed position */}
      {showClaimSection && gameScore > 0 && (
        <div 
          className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent border-t-4 border-yellow-500 p-8 shadow-2xl"
          style={{ 
            zIndex: 9999,
            minHeight: '200px'
          }}
        >
          
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              
              {/* Left - Score */}
              <div className="text-center md:text-left bg-gray-800/50 p-6 rounded-lg">
                <h2 
                  className="text-4xl font-bold text-white mb-3" 
                  style={{ fontFamily: '"Press Start 2P", cursive' }}
                >
                  🎮 Game Over!
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 justify-center md:justify-start">
                    <span className="text-xl text-gray-300">Score:</span>
                    <span className="text-4xl font-bold text-yellow-400">{gameScore}</span>
                  </div>
                  <p className="text-2xl text-green-400">
                    🪙 <span className="font-bold">{gameScore / 100}</span> coins
                  </p>
                  <p className="text-lg text-gray-400">
                    = {gameScore / 100} MARIO tokens
                  </p>
                </div>
              </div>

              {/* Right - Claim Button */}
              <div className="flex flex-col items-center gap-4 bg-gray-800/50 p-6 rounded-lg min-w-[300px]">
                {walletAddress ? (
                  <>
                    <ClaimTokenButton
                      score={gameScore / 100}
                      walletAddress={walletAddress}
                      onClaimSuccess={handleClaimSuccess}
                      onClaimError={handleClaimError}
                    />
                    <button
                      onClick={() => {
                        console.log('🔽 Close button clicked');
                        setShowClaimSection(false);
                      }}
                      className="text-sm text-gray-400 hover:text-white transition underline"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-white text-lg mb-4">
                      Connect wallet to claim tokens
                    </p>
                    <button
                      onClick={connectWallet}
                      className="px-10 py-5 bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
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

      {/* Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-24 right-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono z-[10000] border-2 border-green-500 max-w-[250px]">
          <h3 className="font-bold text-green-400 mb-2 text-sm">🐛 DEBUG</h3>
          <div className="space-y-1">
            <div>Wallet: {walletAddress ? '✅' : '❌'}</div>
            <div>Addr: {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'None'}</div>
            <div>Score: {gameScore}</div>
            <div>Coins: {gameScore / 100}</div>
            <div className="font-bold text-yellow-300">
              Show Claim: {showClaimSection ? '✅ YES' : '❌ NO'}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-600">
              <button 
                onClick={() => {
                  console.log('🔧 Manual trigger');
                  setGameScore(500);
                  setShowClaimSection(true);
                }}
                className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 text-xs rounded text-white"
              >
                Force Show (500)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes slideUp {
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
          animation: slideUp 0.3s ease-out;
        }

        /* Ensure claim section is above everything */
        body {
          overflow-x: hidden;
        }
      `}</style>
    </>
  );
}