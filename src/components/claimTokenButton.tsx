// src/components/ClaimTokenButton.tsx
'use client';

import { useState, useCallback } from 'react';
import { claimTokensViaBackend } from '@/lib/contracts/claimTokenBackend';
import type { ClaimStatus } from '@/lib/types';

interface ClaimTokenButtonProps {
  score: number; // Raw score from game (200, 400, etc.)
  walletAddress: string | null;
  onClaimSuccess?: (txHash: string) => void;
  onClaimError?: (error: string) => void;
}

export default function ClaimTokenButton({
  score,
  walletAddress,
  onClaimSuccess,
  onClaimError
}: ClaimTokenButtonProps) {
  const [status, setStatus] = useState<ClaimStatus>('idle');
  const [message, setMessage] = useState('');
  const [txHash, setTxHash] = useState('');

  const handleClaim = useCallback(async () => {
    if (!walletAddress) {
      setMessage('Please connect your wallet first');
      return;
    }

    if (score <= 0) {
      setMessage('You need to collect at least 1 coin!');
      return;
    }

    console.log('🔍 ClaimTokenButton - Starting claim:');
    console.log('  - Raw score:', score);
    console.log('  - Coins:', score / 100);
    console.log('  - Wallet:', walletAddress);

    setStatus('claiming');
    setMessage('Processing your claim...');
    setTxHash('');

    try {
      // Send RAW score (200, 400, etc.) to API
      const result = await claimTokensViaBackend({
        score: score, // Send raw score!
        playerAddress: walletAddress,
        setIsClaiming: (claiming) => {
          if (claiming) {
            setStatus('claiming');
          }
        }
      });

      if (result.success) {
        setStatus('success');
        setMessage(`Successfully claimed ${score / 100} tokens!`);
        setTxHash(result.txHash || '');
        onClaimSuccess?.(result.txHash ?? '');
      } else {
        throw new Error(result.error || 'Claim failed');
      }
    } catch (error: any) {
      setStatus('error');
      const errorMsg = error.message || 'Failed to claim tokens';
      setMessage(errorMsg);
      onClaimError?.(errorMsg);
      console.error('❌ Claim failed:', errorMsg);
    }
  }, [score, walletAddress, onClaimSuccess, onClaimError]);

  const getButtonText = () => {
    const coins = score / 100;
    switch (status) {
      case 'claiming':
        return '⏳ Claiming...';
      case 'success':
        return '✓ Claimed!';
      case 'error':
        return '🔄 Try Again';
      default:
        return `🪙 Claim ${coins} Token${coins !== 1 ? 's' : ''}`;
    }
  };

  const getButtonStyles = () => {
    const base = 'px-8 py-4 rounded-lg font-bold transition-all duration-200 shadow-lg';
    
    switch (status) {
      case 'claiming':
        return `${base} bg-yellow-500 text-white cursor-wait animate-pulse`;
      case 'success':
        return `${base} bg-green-500 text-white cursor-default`;
      case 'error':
        return `${base} bg-red-500 text-white hover:bg-red-600`;
      default:
        return `${base} bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105`;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <button
        onClick={handleClaim}
        disabled={status === 'claiming' || status === 'success' || !walletAddress || score <= 0}
        className={getButtonStyles()}
        style={{
          padding: '1rem 2rem',
          fontSize: '1.125rem'
        }}
      >
        {getButtonText()}
      </button>
      
      {message && (
        <p style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          textAlign: 'center',
          maxWidth: '24rem',
          color: status === 'error' ? '#fca5a5' : 
                 status === 'success' ? '#86efac' : 
                 '#d1d5db'
        }}>
          {message}
        </p>
      )}

      {status === 'success' && txHash && (
        <a
          href={`https://amoy.polygonscan.com/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.75rem',
            color: '#60a5fa',
            textDecoration: 'underline'
          }}
        >
          View on Etherscan →
        </a>
      )}

      {status === 'claiming' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '1rem',
            height: '1rem',
            border: '2px solid #fbbf24',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            Waiting for confirmation...
          </span>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}