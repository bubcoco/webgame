// src/components/ClaimTokenButton.tsx
'use client';

import { useState, useCallback } from 'react';
import { claimTokens } from '@/lib/contracts/claimToken';
import type { ClaimStatus } from '@/lib/types';

interface ClaimTokenButtonProps {
  score: number;
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

    try {
      const result = await claimTokens({
        score,
        playerAddress: walletAddress,
        signer: (window as any).ethers ? new (window as any).ethers.BrowserProvider((window as any).ethereum).getSigner() : null,
        setIsClaiming: (isClaiming: boolean) => {
          if (!isClaiming) {
            setStatus('idle');
            return;
          }

        }
      });

      if (result.success) {
        setStatus('success');
        setMessage(`Successfully claimed ${score} tokens!`);
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
        return 'Claiming...';
      case 'success':
        return '✓ Claimed!';
      case 'error':
        return 'Try Again';
      default:
        return `Claim ${score} Tokens`;
    }
  };

  const getButtonStyles = () => {
    const base = 'px-6 py-3 rounded-lg font-bold transition-all duration-200';
    
    switch (status) {
      case 'claiming':
        return `${base} bg-yellow-500 cursor-wait`;
      case 'success':
        return `${base} bg-green-500 text-white`;
      case 'error':
        return `${base} bg-red-500 text-white hover:bg-red-600`;
      default:
        return `${base} bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed`;
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
        <p className={`text-sm ${
          status === 'error' ? 'text-red-500' : 
          status === 'success' ? 'text-green-500' : 
          'text-gray-600'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}