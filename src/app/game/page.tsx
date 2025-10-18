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
    }, 30000);
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
          style={{
            position: 'fixed',
            bottom: '0px',
            left: '0px',
            right: '0px',
            backgroundImage:
              'linear-gradient(to top, rgb(17 24 39), rgba(17 24 39 / 0.95), transparent)',
            borderTopWidth: '4px',
            borderTopStyle: 'solid',
            borderTopColor: '#eab308', // yellow-500
            padding: '32px', // p-8
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', // shadow-2xl
            zIndex: 9999,
            minHeight: '200px',
          }}
        >
          <div style={{ maxWidth: '1280px', marginLeft: 'auto', marginRight: 'auto' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column', // flex-col (md:flex-row is dropped)
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '32px', // gap-8
              }}
            >
              {/* Left - Score */}
              <div
                style={{
                  textAlign: 'center', // text-center (md:text-left is dropped)
                  backgroundColor: 'rgba(31, 41, 55, 0.5)', // bg-gray-800/50
                  padding: '24px', // p-6
                  borderRadius: '8px', // rounded-lg
                }}
              >
                <h2
                  style={{
                    fontFamily: '"Press Start 2P", cursive',
                    fontSize: '36px', // text-4xl
                    fontWeight: '700', // font-bold
                    color: '#ffffff', // text-white
                    marginBottom: '12px', // mb-3
                  }}
                >
                  🎮 Game Over!
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}> {/* space-y-2 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px', // gap-3
                      justifyContent: 'center', // justify-center (md:justify-start is dropped)
                    }}
                  >
                    <span style={{ fontSize: '20px', color: '#d1d5db' }}> {/* text-xl text-gray-300 */}
                      Score:
                    </span>
                    <span style={{ fontSize: '36px', fontWeight: '700', color: '#facc15' }}> {/* text-4xl font-bold text-yellow-400 */}
                      {gameScore}
                    </span>
                  </div>
                  <p style={{ fontSize: '24px', color: '#4ade80' }}> {/* text-2xl text-green-400 */}
                    🪙 <span style={{ fontWeight: '700' }}>{gameScore / 100}</span> coins
                  </p>
                  <p style={{ fontSize: '18px', color: '#9ca3af' }}> {/* text-lg text-gray-400 */}
                    = {gameScore /100} MARIO tokens
                  </p>
                </div>
              </div>

              {/* Right - Claim Button */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px', // gap-4
                  backgroundColor: 'rgba(31, 41, 55, 0.5)', // bg-gray-800/50
                  padding: '24px', // p-6
                  borderRadius: '8px', // rounded-lg
                  minWidth: '300px',
                }}
              >
                {walletAddress ? (
                  <>
                    <ClaimTokenButton
                      score={gameScore}
                      walletAddress={walletAddress}
                      onClaimSuccess={handleClaimSuccess}
                      onClaimError={handleClaimError}
                    />
                    <button
                      onClick={() => {
                        console.log('🔽 Close button clicked');
                        setShowClaimSection(false);
                      }}
                      style={{
                        fontSize: '14px', // text-sm
                        color: '#9ca3af', // text-gray-400
                        textDecoration: 'underline',
                        transition: 'color 0.15s ease-in-out', // transition
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#ffffff', fontSize: '18px', marginBottom: '16px' }}> {/* text-white text-lg mb-4 */}
                      Connect wallet to claim tokens
                    </p>
                    <button
                      onClick={connectWallet}
                      style={{
                        paddingLeft: '40px', // px-10
                        paddingRight: '40px',
                        paddingTop: '20px', // py-5
                        paddingBottom: '20px',
                        backgroundColor: '#9333ea', // bg-purple-600
                        color: '#ffffff', // text-white
                        fontSize: '20px', // text-xl
                        fontWeight: '700', // font-bold
                        borderRadius: '8px', // rounded-lg
                        transitionProperty: 'all', // transition-all
                        transitionDuration: '300ms', // duration-300
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', // shadow-lg
                        border: 'none',
                        cursor: 'pointer',
                      }}
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
        <div
          style={{
            position: 'fixed',
            top: '96px', // top-24
            right: '16px', // right-4
            backgroundColor: 'rgba(0, 0, 0, 0.9)', // bg-black/90
            color: '#ffffff', // text-white
            padding: '16px', // p-4
            borderRadius: '8px', // rounded-lg
            fontSize: '12px', // text-xs
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', // font-mono
            zIndex: 10000,
            borderWidth: '2px', // border-2
            borderStyle: 'solid',
            borderColor: '#22c55e', // border-green-500
            maxWidth: '250px',
          }}
        >
          <h3
            style={{
              fontWeight: '700', // font-bold
              color: '#4ade80', // text-green-400
              marginBottom: '8px', // mb-2
              fontSize: '14px', // text-sm
            }}
          >
            🐛 DEBUG
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}> {/* space-y-1 */}
            <div>Wallet: {walletAddress ? '✅' : '❌'}</div>
            <div>Addr: {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'None'}</div>
            <div>Score: {gameScore}</div>
            <div>Coins: {gameScore / 100}</div>
            <div style={{ fontWeight: '700', color: '#fde047' }}> {/* font-bold text-yellow-300 */}
              Show Claim: {showClaimSection ? '✅ YES' : '❌ NO'}
            </div>
            <div
              style={{
                marginTop: '8px', // mt-2
                paddingTop: '8px', // pt-2
                borderTopWidth: '1px', // border-t
                borderTopStyle: 'solid',
                borderTopColor: '#4b5563', // border-gray-600
              }}
            >
              <button
                onClick={() => {
                  console.log('🔧 Manual trigger');
                  setGameScore(500);
                  setShowClaimSection(true);
                }}
                style={{
                  width: '100%', // w-full
                  paddingLeft: '8px', // px-2
                  paddingRight: '8px',
                  paddingTop: '4px', // py-1
                  paddingBottom: '4px',
                  backgroundColor: '#16a34a', // bg-green-600
                  fontSize: '12px', // text-xs
                  borderRadius: '4px', // rounded
                  color: '#ffffff', // text-white
                  border: 'none',
                  cursor: 'pointer',
                }}
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