'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ethers } from 'ethers';
import ClaimTokenButton from '@/components/claimTokenButton';

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const ROAD_WIDTH = 400;
const LANE_COUNT = 3;
const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;
const CAR_WIDTH = 60;
const CAR_HEIGHT = 100;

interface Obstacle {
  x: number;
  y: number;
  lane: number;
  type: 'car' | 'barrier';
  color: string;
}

interface Coin {
  x: number;
  y: number;
  lane: number;
  collected: boolean;
}

export default function RacingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [showClaimSection, setShowClaimSection] = useState(false);
  const [playerLane, setPlayerLane] = useState(1); // 0, 1, 2 (left, center, right)
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [distance, setDistance] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const gameLoopRef = useRef<number>(0);
  const hasCalledOnGameEnd = useRef(false);
  const keysRef = useRef({ left: false, right: false, up: false, down: false });

  // Detect mobile
  useEffect(() => {
    setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check wallet connection
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
    }
  };

  const resetGame = useCallback(() => {
    setScore(0);
    setFinalScore(0);
    setSpeed(5);
    setDistance(0);
    setPlayerLane(1);
    setObstacles([]);
    setCoins([]);
    setGameOver(false);
    setShowClaimSection(false);
    hasCalledOnGameEnd.current = false;
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        keysRef.current.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        keysRef.current.right = true;
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        keysRef.current.up = true;
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        keysRef.current.down = true;
      }
      if (e.code === 'Space' && gameOver) {
        resetGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keysRef.current.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keysRef.current.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') keysRef.current.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') keysRef.current.down = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameOver, resetGame]);

  // Spawn obstacles and coins
  const spawnObjects = useCallback(() => {
    // Spawn obstacle
    if (Math.random() < 0.02) {
      const lane = Math.floor(Math.random() * LANE_COUNT);
      const colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12'];
      setObstacles(prev => [...prev, {
        x: (GAME_WIDTH - ROAD_WIDTH) / 2 + lane * LANE_WIDTH + LANE_WIDTH / 2,
        y: -CAR_HEIGHT,
        lane,
        type: Math.random() > 0.3 ? 'car' : 'barrier',
        color: colors[Math.floor(Math.random() * colors.length)]
      }]);
    }

    // Spawn coin
    if (Math.random() < 0.03) {
      const lane = Math.floor(Math.random() * LANE_COUNT);
      setCoins(prev => [...prev, {
        x: (GAME_WIDTH - ROAD_WIDTH) / 2 + lane * LANE_WIDTH + LANE_WIDTH / 2,
        y: -30,
        lane,
        collected: false
      }]);
    }
  }, []);

  // Game loop
  useEffect(() => {
    if (gameOver) return;

    const gameLoop = () => {
      // Handle lane changes
      if (keysRef.current.left) {
        setPlayerLane(prev => Math.max(0, prev - 0.1));
      }
      if (keysRef.current.right) {
        setPlayerLane(prev => Math.min(2, prev + 0.1));
      }

      // Handle speed
      if (keysRef.current.up) {
        setSpeed(prev => Math.min(15, prev + 0.1));
      }
      if (keysRef.current.down) {
        setSpeed(prev => Math.max(2, prev - 0.1));
      }

      // Update distance and score
      setDistance(prev => prev + speed);

      // Increase speed gradually
      setSpeed(prev => Math.min(15, prev + 0.001));

      // Spawn objects
      spawnObjects();

      // Move obstacles
      setObstacles(prev => {
        const playerX = (GAME_WIDTH - ROAD_WIDTH) / 2 + Math.round(playerLane) * LANE_WIDTH + LANE_WIDTH / 2;
        const playerY = GAME_HEIGHT - 150;

        return prev.filter(obs => {
          // Check collision
          const obsX = obs.x;
          const obsY = obs.y;

          if (
            Math.abs(obsX - playerX) < CAR_WIDTH * 0.8 &&
            obsY > playerY - CAR_HEIGHT / 2 &&
            obsY < playerY + CAR_HEIGHT / 2
          ) {
            // Collision!
            setFinalScore(score);
            setGameOver(true);
            setShowClaimSection(true);
            return false;
          }

          return obs.y < GAME_HEIGHT + 100;
        }).map(obs => ({
          ...obs,
          y: obs.y + speed * 1.5
        }));
      });

      // Move and collect coins
      setCoins(prev => {
        const playerX = (GAME_WIDTH - ROAD_WIDTH) / 2 + Math.round(playerLane) * LANE_WIDTH + LANE_WIDTH / 2;
        const playerY = GAME_HEIGHT - 150;

        return prev.filter(coin => {
          if (coin.collected) return false;

          // Check collection
          if (
            Math.abs(coin.x - playerX) < LANE_WIDTH * 0.7 &&
            Math.abs(coin.y - playerY) < 60
          ) {
            setScore(s => s + 100);
            return false;
          }

          return coin.y < GAME_HEIGHT + 50;
        }).map(coin => ({
          ...coin,
          y: coin.y + speed * 1.5
        }));
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameOver, playerLane, speed, spawnObjects]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Clear
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Draw grass
      ctx.fillStyle = '#228B22';
      ctx.fillRect(0, 0, (GAME_WIDTH - ROAD_WIDTH) / 2, GAME_HEIGHT);
      ctx.fillRect((GAME_WIDTH + ROAD_WIDTH) / 2, 0, (GAME_WIDTH - ROAD_WIDTH) / 2, GAME_HEIGHT);

      // Draw road
      const roadX = (GAME_WIDTH - ROAD_WIDTH) / 2;
      ctx.fillStyle = '#333';
      ctx.fillRect(roadX, 0, ROAD_WIDTH, GAME_HEIGHT);

      // Draw lane markers (animated)
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.setLineDash([40, 30]);
      const offset = (distance % 70);

      for (let i = 1; i < LANE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(roadX + i * LANE_WIDTH, -offset);
        ctx.lineTo(roadX + i * LANE_WIDTH, GAME_HEIGHT);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw road edges
      ctx.strokeStyle = '#ff0';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(roadX, 0);
      ctx.lineTo(roadX, GAME_HEIGHT);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(roadX + ROAD_WIDTH, 0);
      ctx.lineTo(roadX + ROAD_WIDTH, GAME_HEIGHT);
      ctx.stroke();

      // Draw obstacles
      obstacles.forEach(obs => {
        if (obs.type === 'car') {
          // Car body
          ctx.fillStyle = obs.color;
          ctx.fillRect(obs.x - CAR_WIDTH / 2, obs.y, CAR_WIDTH, CAR_HEIGHT);
          // Windows
          ctx.fillStyle = '#87CEEB';
          ctx.fillRect(obs.x - CAR_WIDTH / 2 + 8, obs.y + 15, CAR_WIDTH - 16, 25);
          // Wheels
          ctx.fillStyle = '#222';
          ctx.fillRect(obs.x - CAR_WIDTH / 2 - 5, obs.y + 10, 8, 20);
          ctx.fillRect(obs.x + CAR_WIDTH / 2 - 3, obs.y + 10, 8, 20);
          ctx.fillRect(obs.x - CAR_WIDTH / 2 - 5, obs.y + CAR_HEIGHT - 30, 8, 20);
          ctx.fillRect(obs.x + CAR_WIDTH / 2 - 3, obs.y + CAR_HEIGHT - 30, 8, 20);
        } else {
          // Barrier
          ctx.fillStyle = '#ff6b35';
          ctx.fillRect(obs.x - 40, obs.y, 80, 30);
          ctx.fillStyle = '#fff';
          ctx.fillRect(obs.x - 35, obs.y + 5, 20, 20);
          ctx.fillRect(obs.x + 15, obs.y + 5, 20, 20);
        }
      });

      // Draw coins
      coins.forEach(coin => {
        if (!coin.collected) {
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffec8b';
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffd700';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('$', coin.x, coin.y + 5);
        }
      });

      // Draw player car
      const playerX = (GAME_WIDTH - ROAD_WIDTH) / 2 + playerLane * LANE_WIDTH + LANE_WIDTH / 2;
      const playerY = GAME_HEIGHT - 150;

      // Car body
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(playerX - CAR_WIDTH / 2, playerY, CAR_WIDTH, CAR_HEIGHT);

      // Car details
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(playerX - CAR_WIDTH / 2 + 5, playerY + 5, CAR_WIDTH - 10, 30);

      // Windshield
      ctx.fillStyle = '#3498db';
      ctx.fillRect(playerX - CAR_WIDTH / 2 + 8, playerY + CAR_HEIGHT - 45, CAR_WIDTH - 16, 25);

      // Wheels
      ctx.fillStyle = '#222';
      ctx.fillRect(playerX - CAR_WIDTH / 2 - 5, playerY + 10, 8, 25);
      ctx.fillRect(playerX + CAR_WIDTH / 2 - 3, playerY + 10, 8, 25);
      ctx.fillRect(playerX - CAR_WIDTH / 2 - 5, playerY + CAR_HEIGHT - 35, 8, 25);
      ctx.fillRect(playerX + CAR_WIDTH / 2 - 3, playerY + CAR_HEIGHT - 35, 8, 25);

      // HUD
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 200, 90);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`🪙 Score: ${score}`, 20, 40);
      ctx.fillText(`🚗 Speed: ${Math.round(speed * 10)} km/h`, 20, 65);
      ctx.fillText(`📏 ${Math.round(distance / 100)}m`, 20, 90);

      // Game over overlay
      if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);

        ctx.font = '28px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.fillText(`Distance: ${Math.round(distance / 100)}m`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);

        ctx.font = '20px Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Press SPACE to play again', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);

        if (score > 0) {
          ctx.fillStyle = '#4ade80';
          ctx.fillText('Claim your tokens below! 👇', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140);
        }
      }

      if (!gameOver) {
        requestAnimationFrame(draw);
      }
    };

    draw();
  }, [obstacles, coins, playerLane, score, speed, distance, gameOver]);

  const handleClaimSuccess = (txHash: string) => {
    alert(`🎉 Success! You claimed ${score / 100} tokens!\n\nTX: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`);
  };

  const handleClaimError = (error: string) => {
    console.error('Claim error:', error);
  };

  const handleMobileControl = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setPlayerLane(prev => Math.max(0, prev - 1));
    } else {
      setPlayerLane(prev => Math.min(2, prev + 1));
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#0f0f23',
      padding: '1rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <a href="/" style={{
          color: '#fff',
          backgroundColor: '#374151',
          borderRadius: '50%',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </a>

        <h1 style={{
          color: '#fff',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          textAlign: 'center',
          background: 'linear-gradient(90deg, #f39c12, #e74c3c)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🏎️ Racing 3D
        </h1>

        {walletAddress ? (
          <div style={{
            backgroundColor: '#374151',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}>
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </div>
        ) : (
          <button onClick={connectWallet} style={{
            backgroundColor: '#7c3aed',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            Connect
          </button>
        )}
      </div>

      {/* Game Canvas */}
      <div style={{
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 0 30px rgba(231, 76, 60, 0.3)'
      }}>
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          style={{
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </div>

      {/* Mobile Controls */}
      {isMobile && !gameOver && (
        <div style={{
          display: 'flex',
          gap: '2rem',
          marginTop: '1rem'
        }}>
          <button
            onTouchStart={() => handleMobileControl('left')}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(231, 76, 60, 0.8)',
              border: 'none',
              color: '#fff',
              fontSize: '2rem',
              fontWeight: 'bold'
            }}
          >
            ←
          </button>
          <button
            onTouchStart={() => resetGame()}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(46, 204, 113, 0.8)',
              border: 'none',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {gameOver ? 'PLAY' : 'GO!'}
          </button>
          <button
            onTouchStart={() => handleMobileControl('right')}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(231, 76, 60, 0.8)',
              border: 'none',
              color: '#fff',
              fontSize: '2rem',
              fontWeight: 'bold'
            }}
          >
            →
          </button>
        </div>
      )}

      {/* Instructions */}
      <p style={{
        color: '#9ca3af',
        marginTop: '1rem',
        textAlign: 'center',
        fontSize: '0.875rem'
      }}>
        {isMobile ? 'Tap buttons to steer' : '⬅️ ➡️ Steer | ⬆️ ⬇️ Speed | Collect coins, avoid cars!'}
      </p>

      {/* Claim Popup - Mario style */}
      {showClaimSection && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(15, 15, 35, 0.98), rgba(31, 41, 55, 0.95))',
          padding: isMobile ? '1.5rem' : '2rem',
          borderTop: '3px solid #f39c12',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 0.3s ease-out',
          zIndex: 1000
        }}>
          <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
            {/* Score Display */}
            <h2 style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '1rem'
            }}>
              🏎️ Race Complete!
            </h2>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1rem', color: '#d1d5db' }}>Score: </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{finalScore}</span>
            </div>
            <p style={{ fontSize: '1rem', color: '#4ade80', margin: '0.5rem 0 1.5rem' }}>
              = <strong>{Math.floor(finalScore / 100)}</strong> GEMS tokens
            </p>

            {/* Claim Button Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: 'rgba(31, 41, 55, 0.5)',
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              {walletAddress && finalScore >= 100 ? (
                <>
                  <ClaimTokenButton
                    score={finalScore}
                    walletAddress={walletAddress}
                    onClaimSuccess={handleClaimSuccess}
                    onClaimError={handleClaimError}
                  />
                </>
              ) : !walletAddress ? (
                <button onClick={connectWallet} style={{
                  backgroundColor: '#7c3aed',
                  color: '#fff',
                  padding: '1rem 2rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>
                  🔗 Connect Wallet to Claim
                </button>
              ) : (
                <p style={{ color: '#9ca3af' }}>Collect more coins to claim tokens!</p>
              )}

              {/* Restart Button */}
              <button
                onClick={() => { setShowClaimSection(false); resetGame(); }}
                style={{
                  background: 'linear-gradient(90deg, #f39c12, #e74c3c)',
                  color: '#fff',
                  padding: '0.75rem 2rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  marginTop: '0.5rem'
                }}
              >
                🔄 Play Again
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
