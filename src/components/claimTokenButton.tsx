// src/components/ClaimTokenButton.tsx
'use client';

import { useState, useCallback } from 'react';
import { claimTokensViaBackend } from '@/lib/contracts/claimTokenBackend';
import type { ClaimStatus } from '@/lib/types';

interface ClaimTokenButtonProps {
  score: number;
  walletAddress: string | null;
  onClaimSuccess?: (txHash: string) => void;
  onClaimError?: (error: string) => void;
  useBackend?: boolean; // Toggle between backend and direct claim
}

export default function ClaimTokenButton({
  score,
  walletAddress,
  onClaimSuccess,
  onClaimError,
  useBackend = true // Default to backend (more secure)
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

    setStatus('claiming');
    setMessage('Processing your claim...');
    setTxHash('');

    try {
      // Use backend API (recommended)
      const result = await claimTokensViaBackend({
        score,
        playerAddress: walletAddress,
        setIsClaiming: (claiming) => {
          if (claiming) {
            setStatus('claiming');
          }
        }
      });

      if (result.success) {
        setStatus('success');
        setMessage(`Successfully claimed ${score} tokens!`);
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
    }
  }, [score, walletAddress, onClaimSuccess, onClaimError]);

  const getButtonText = () => {
    switch (status) {
      case 'claiming':
        return '⏳ Claiming...';
      case 'success':
        return '✓ Claimed!';
      case 'error':
        return '🔄 Try Again';
      default:
        return `🪙 Claim ${score} Tokens`;
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
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleClaim}
        disabled={status === 'claiming' || status === 'success' || !walletAddress || score <= 0}
        className={getButtonStyles()}
      >
        {getButtonText()}
      </button>
      
      {message && (
        <p className={`text-sm font-medium text-center max-w-md ${
          status === 'error' ? 'text-red-400' : 
          status === 'success' ? 'text-green-400' : 
          'text-gray-300'
        }`}>
          {message}
        </p>
      )}

      {status === 'success' && txHash && (
        <a
          href={`https://amoy.polygonscan.com/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 underline"
        >
          View on Etherscan →
        </a>
      )}

      {status === 'claiming' && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
          <span>Waiting for confirmation...</span>
        </div>
      )}
    </div>
  );
}