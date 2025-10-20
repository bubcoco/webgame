'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import SuperJumpQuest from '@/components/SuperJumpQuest';
import ClaimTokenButton from '@/components/claimTokenButton';

export default function GamePage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [gameScore, setGameScore] = useState(0);
  const [showClaimSection, setShowClaimSection] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  const handleGameEnd = (score: number) => {
    console.log('🎮 Game ended with score:', score);
    setGameScore(score);
    setShowClaimSection(true);
  };

  const handleClaimSuccess = (txHash: string) => {
    console.log('✅ Tokens claimed! TX:', txHash);
    alert(`🎉 Success! You claimed ${gameScore / 100} MARIO tokens!\n\nTX: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`);
    setTimeout(() => {
      setShowClaimSection(false);
      setGameScore(0);
    }, 3000);
  };

  const handleClaimError = (error: string) => {
    console.error('❌ Claim error:', error);
    alert(`❌ Claim failed: ${error}`);
  };

  return (
    <>
      <SuperJumpQuest
        onGameEnd={handleGameEnd}
        walletAddress={walletAddress}
        onConnectWallet={connectWallet}
        showWalletButton={true}
      />

      {/* Mobile & Desktop Responsive Claim Section */}
      {showClaimSection && gameScore > 0 && (
        <div 
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'linear-gradient(to top, rgb(17, 24, 39), rgb(17, 24, 39, 0.98), transparent)',
            borderTop: '4px solid #fbbf24',
            padding: isMobile ? '1rem' : '2rem',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)',
            animation: 'slideUp 0.3s ease-out',
            maxHeight: isMobile ? '60vh' : 'auto',
            overflowY: 'auto'
          }}
        >
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              gap: isMobile ? '1rem' : '2rem'
            }}>
              
              {/* Score Display */}
              <div style={{
                textAlign: 'center',
                backgroundColor: 'rgba(31, 41, 55, 0.5)',
                padding: isMobile ? '1rem' : '1.5rem',
                borderRadius: '0.5rem',
                width: '100%',
                maxWidth: isMobile ? '100%' : '400px'
              }}>
                <h2 style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: 'bold',
                  color: 'white',
                  marginBottom: '1rem',
                  fontFamily: '"Press Start 2P", cursive',
                  lineHeight: '1.4'
                }}>
                  🎮 Game Over!
                </h2>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: isMobile ? '1rem' : '1.25rem', color: '#d1d5db' }}>Score: </span>
                  <span style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', color: '#fbbf24' }}>{gameScore}</span>
                </div>
                <p style={{ fontSize: isMobile ? '1rem' : '1.5rem', color: '#34d399', margin: '0.5rem 0' }}>
                  🪙 <span style={{ fontWeight: 'bold' }}>{gameScore / 100}</span> coins
                </p>
                <p style={{ fontSize: isMobile ? '0.875rem' : '1rem', color: '#9ca3af' }}>
                  = {gameScore / 100} GEMS tokens
                </p>
              </div>

              {/* Claim Button Section */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                backgroundColor: 'rgba(31, 41, 55, 0.5)',
                padding: isMobile ? '1rem' : '1.5rem',
                borderRadius: '0.5rem',
                width: '100%',
                maxWidth: isMobile ? '100%' : '400px'
              }}>
                {walletAddress ? (
                  <>
                    <ClaimTokenButton
                      score={gameScore}
                      walletAddress={walletAddress}
                      onClaimSuccess={handleClaimSuccess}
                      onClaimError={handleClaimError}
                    />
                    <button
                      onClick={() => setShowClaimSection(false)}
                      style={{
                        fontSize: '0.875rem',
                        color: '#9ca3af',
                        textDecoration: 'underline',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.2s',
                        padding: '0.5rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <p style={{ color: 'white', fontSize: isMobile ? '0.875rem' : '1.125rem', marginBottom: '1rem' }}>
                      Connect wallet to claim tokens
                    </p>
                    <button
                      onClick={connectWallet}
                      style={{
                        padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
                        backgroundColor: '#7c3aed',
                        color: 'white',
                        fontSize: isMobile ? '0.875rem' : '1.125rem',
                        fontWeight: 'bold',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#6d28d9';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#7c3aed';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      🔗 Connect Wallet
                    </button>
                    <button
                      onClick={() => setShowClaimSection(false)}
                      style={{
                        fontSize: '0.875rem',
                        color: '#9ca3af',
                        textDecoration: 'underline',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.2s',
                        padding: '0.5rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

        /* Prevent body scroll when claim section is open on mobile */
        body {
          overflow-x: hidden;
        }

        /* Improve touch targets on mobile */
        @media (max-width: 768px) {
          button {
            min-height: 44px;
            min-width: 44px;
          }
        }

        /* Smooth scrolling for claim section on mobile */
        @media (max-width: 768px) {
          * {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </>
  );
}