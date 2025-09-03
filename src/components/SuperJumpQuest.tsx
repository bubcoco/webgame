'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED, JUMP_FORCE, GRAVITY, TILE_SIZE } from '../lib/constants';
import { Keys, Player, Platform, Coin, Enemy } from '../lib/types';

declare global {
    interface Window {
        ethereum?: any;
        ethers?: any;
    }
}

// --- Game Resolution ---
export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 576; // 16:9 aspect ratio

// --- Button configuration for Game Over screen ---
const EARN_BUTTON = {
    width: 250,
    height: 60,
    x: GAME_WIDTH / 2 - 125,
    y: GAME_HEIGHT / 2 + 110,
};

const SuperJumpQuest = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [keys, setKeys] = useState<Keys>({
    ArrowRight: false,
    ArrowLeft: false,
    Space: false,
  });

  const [player, setPlayer] = useState<Player>({
    x: 100,
    y: 200,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    isJumping: false,
    onGround: false,
  });

  const [coins, setCoins] = useState<Coin[]>([
      { x: 200, y: 300, width: 20, height: 20, collected: false },
      { x: 450, y: 200, width: 20, height: 20, collected: false },
      { x: 700, y: 350, width: 20, height: 20, collected: false },
      { x: 950, y: 150, width: 20, height: 20, collected: false },
  ]);
  
  const [enemies, setEnemies] = useState<Enemy[]>([
      { x: 500, y: 460 - 30, width: 30, height: 30, vx: 1, direction: 1, isDefeated: false },
      { x: 1000, y: 360 - 30, width: 30, height: 30, vx: 1, direction: -1, isDefeated: false },
  ]);

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [cameraX, setCameraX] = useState(0);
  const gameFrameRef = useRef<number>(0);
  const [playerImage, setPlayerImage] = useState<HTMLImageElement | null>(null);

  // --- Ethers.js State ---
  const [provider, setProvider] = useState<any | null>(null); // Use 'any' for provider
  const [signer, setSigner] = useState<any | null>(null); // Use 'any' for signer
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isEthersReady, setIsEthersReady] = useState(false);

  // --- Load Ethers.js from CDN ---
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.umd.min.js';
    script.async = true;
    script.onload = () => {
        console.log('ethers.js has been loaded from CDN.');
        setIsEthersReady(true);
    };
    document.body.appendChild(script);

    return () => {
      // Clean up the script when the component unmounts
      document.body.removeChild(script);
    };
  }, []);


  // --- Wallet Connection Logic ---
  const connectWallet = async () => {
    if (!isEthersReady) {
        alert('Web3 provider is not ready yet. Please try again in a moment.');
        return;
    }
    if (typeof window.ethereum !== 'undefined') {
      try {
        const ethProvider = new window.ethers.BrowserProvider(window.ethereum);
        const ethSigner = await ethProvider.getSigner();
        const address = await ethSigner.getAddress();
        

        setProvider(ethProvider);
        setSigner(ethSigner);
        setWalletAddress(address);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
        alert("Failed to connect wallet. Please ensure MetaMask is installed and unlocked.");
      }
    } else {
      alert("MetaMask is not installed. Please install it to use this feature.");
    }
  };

  // --- Smart Contract Interaction ---
  const handleEarnTokens = useCallback(async () => {
    if (!signer || score <= 0 || isClaiming) {
        alert("Please connect your wallet. You can only earn tokens if your score is above zero.");
        return;
    }

    setIsClaiming(true);
    alert(`This is a simulation.\nIn a real app, this would trigger a smart contract transaction to mint you ${score} GameTokens.`);

    
   
    // For simulation purposes:
    setTimeout(() => {
        setIsClaiming(false);
        alert("Simulated transaction complete!");
    }, 2000);

  }, [signer, score, isClaiming]);

  // --- Load Player Image ---
  useEffect(() => {
    const img = new Image();
    img.src = '/images/player.png';
    img.onload = () => setPlayerImage(img);
    img.onerror = () => console.error("Failed to load player image. Make sure it's in the public folder.");
  }, []);

  const level: Platform[] = [
    // Ground
    { x: 0, y: 500, width: 1600, height: 100 },
    // Platforms
    { x: 150, y: 400, width: 150, height: TILE_SIZE },
    { x: 400, y: 300, width: 200, height: TILE_SIZE },
    { x: 700, y: 400, width: 100, height: TILE_SIZE },
    { x: 900, y: 250, width: 150, height: TILE_SIZE },
    { x: 1200, y: 350, width: 200, height: TILE_SIZE },
  ];

  const resetGame = useCallback(() => {
    setPlayer({
      x: 100,
      y: 200,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      vx: 0,
      vy: 0,
      isJumping: false,
      onGround: false,
    });
    setCoins(coins.map(c => ({ ...c, collected: false })));
    setEnemies(enemies.map(e => ({ ...e, isDefeated: false, x: e.x < 800 ? 500 : 1000, direction: e.direction })));
    setScore(0);
    setCameraX(0);
    setGameOver(false);
  }, [coins, enemies]);

  // --- Keyboard & Mouse Handlers ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
            e.preventDefault();
        }
      setKeys((prev) => ({ ...prev, [e.code]: true }));
      if (e.code === 'Space' && gameOver) {
        resetGame();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.code]: false }));
    };
    
    const handleCanvasClick = (event: MouseEvent) => {
        if (!gameOver || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // --- Calculate scale and offsets for accurate click detection ---
        const scale = Math.min(rect.width / GAME_WIDTH, rect.height / GAME_HEIGHT);
        const offsetX = (rect.width - GAME_WIDTH * scale) / 2;
        const offsetY = (rect.height - GAME_HEIGHT * scale) / 2;

        const clickX = (event.clientX - rect.left - offsetX) / scale;
        const clickY = (event.clientY - rect.top - offsetY) / scale;

        // Check if the click is within the button bounds
        if (
            clickX >= EARN_BUTTON.x &&
            clickX <= EARN_BUTTON.x + EARN_BUTTON.width &&
            clickY >= EARN_BUTTON.y &&
            clickY <= EARN_BUTTON.y + EARN_BUTTON.height
        ) {
            handleEarnTokens();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvasRef.current?.addEventListener('click', handleCanvasClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvasRef.current?.removeEventListener('click', handleCanvasClick);
    };
  }, [gameOver, resetGame, handleEarnTokens]);


  // --- Game Loop ---
  const gameLoop = useCallback(() => {
    // We only update state in the game loop. All drawing is now in the draw() function.
    if (!gameOver) {
        setPlayer(p => {
            let newVx = 0;
            if (keys.ArrowRight) newVx = PLAYER_SPEED;
            if (keys.ArrowLeft) newVx = -PLAYER_SPEED;

            let newVy = p.vy + GRAVITY;
            let newIsJumping = p.isJumping;

            if (keys.Space && p.onGround && !p.isJumping) {
                newVy = -JUMP_FORCE;
                newIsJumping = true;
            }

            let newX = p.x + newVx;
            let newY = p.y + newVy;
            let newOnGround = false;

            // Collision with platforms
            level.forEach(platform => {
                if (p.x < platform.x + platform.width &&
                    p.x + p.width > platform.x &&
                    p.y + p.height <= platform.y &&
                    newY + p.height >= platform.y) 
                {
                    newY = platform.y - p.height;
                    newVy = 0;
                    newOnGround = true;
                    newIsJumping = false;
                }
            });
            
            // --- Enemy Logic ---
            setEnemies(prevEnemies => prevEnemies.map(enemy => {
                if (enemy.isDefeated) return enemy;
                
                if (p.x < enemy.x + enemy.width &&
                    p.x + p.width > enemy.x &&
                    p.y + p.height <= enemy.y &&
                    newY + p.height >= enemy.y)
                {
                    setScore(s => s + 200);
                    newVy = -JUMP_FORCE / 2;
                    return { ...enemy, isDefeated: true };
                } 
                else if (newX < enemy.x + enemy.width &&
                    newX + p.width > enemy.x &&
                    newY < enemy.y + enemy.height &&
                    newY + p.height > enemy.y)
                {
                    setGameOver(true);
                }

                let newEnemyX = enemy.x + enemy.vx * enemy.direction;
                let newDirection = enemy.direction;
                
                let onPlatform = false;
                level.forEach(platform => {
                    const nextFootX = newDirection > 0 ? newEnemyX + enemy.width : newEnemyX;
                    if(nextFootX > platform.x && nextFootX < platform.x + platform.width && enemy.y + enemy.height === platform.y){
                        onPlatform = true;
                    }
                });
                if(!onPlatform) {
                    newDirection *= -1;
                    newEnemyX = enemy.x + enemy.vx * newDirection;
                }

                return { ...enemy, x: newEnemyX, direction: newDirection };
            }));

            // --- Coin Collection ---
            setCoins(prevCoins => prevCoins.map(coin => {
              if (!coin.collected &&
                  newX < coin.x + coin.width &&
                  newX + PLAYER_WIDTH > coin.x &&
                  newY < coin.y + coin.height &&
                  newY + PLAYER_HEIGHT > coin.y) {
                setScore(s => s + 100);
                return { ...coin, collected: true };
              }
              return coin;
            }));

            if (newX < cameraX) {
                newX = cameraX;
            }

            if (p.y > GAME_HEIGHT + 100) { // Use game height for fall check
                setGameOver(true);
            }

            return { ...p, x: newX, y: newY, vx: newVx, vy: newVy, isJumping: newIsJumping, onGround: newOnGround };
        });
        
        // Update Camera
        setCameraX(prevCamX => {
            const targetCamX = player.x - 300;
            const newCamX = prevCamX + (targetCamX - prevCamX) * 0.1;
            return Math.max(0, newCamX);
        });
    }

    draw(); // Call draw regardless of game state
    gameFrameRef.current = requestAnimationFrame(gameLoop);
  }, [player, keys, gameOver, score, cameraX, resetGame]);
  
  // --- Drawing ---
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // --- Responsive Scaling & Letterboxing ---
    const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
    if (canvas.width !== cssWidth || canvas.height !== cssHeight) {
        canvas.width = cssWidth;
        canvas.height = cssHeight;
    }

    const scale = Math.min(canvas.width / GAME_WIDTH, canvas.height / GAME_HEIGHT);
    const offsetX = (canvas.width - GAME_WIDTH * scale) / 2;
    const offsetY = (canvas.height - GAME_HEIGHT * scale) / 2;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // --- Clear and draw game background ---
    ctx.fillStyle = '#70c5ce'; // Sky blue
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // --- Draw game elements or game over screen ---
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.font = '48px "Press Start 2P", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Game Over', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);
      ctx.font = '24px "Press Start 2P", sans-serif';
      ctx.fillText(`Final Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10);
      ctx.fillText('Press Space to Restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);

      // --- Draw "Earn Token" Button ---
      if (walletAddress) {
        ctx.fillStyle = isClaiming ? '#4a5568' : '#2d8540'; // Gray when claiming, green otherwise
        ctx.fillRect(EARN_BUTTON.x, EARN_BUTTON.y, EARN_BUTTON.width, EARN_BUTTON.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '22px "Press Start 2P", sans-serif';
        ctx.fillText(
          isClaiming ? 'Claiming...' : 'Earn Tokens',
          GAME_WIDTH / 2,
          GAME_HEIGHT / 2 + 145
        );
      } else {
          ctx.font = '16px "Press Start 2P", sans-serif';
          ctx.fillStyle = '#cbd5e0';
          ctx.fillText('Connect Wallet to Earn Tokens', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 145);
      }

    } else {
      ctx.save();
      ctx.translate(-cameraX, 0);

      // --- Draw platforms ---
      level.forEach(platform => {
        ctx.fillStyle = '#e69500';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.fillStyle = '#a16600';
        ctx.fillRect(platform.x, platform.y + 10, platform.width, platform.height - 10);
      });

      // --- Draw coins ---
      coins.forEach(coin => {
          if (!coin.collected) {
              ctx.fillStyle = '#ffd700';
              ctx.beginPath();
              ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 2, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#e6c300';
              ctx.beginPath();
              ctx.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, coin.width / 3, 0, Math.PI * 2);
              ctx.fill();
          }
      });
      
      // --- Draw enemies ---
      enemies.forEach(enemy => {
          if(!enemy.isDefeated) {
              ctx.fillStyle = '#c0392b';
              ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
              ctx.fillStyle = 'white';
              const eyeX1 = enemy.direction > 0 ? enemy.x + enemy.width * 0.6 : enemy.x + enemy.width * 0.2;
              const eyeX2 = enemy.direction > 0 ? enemy.x + enemy.width * 0.8 : enemy.x + enemy.width * 0.4;
              ctx.fillRect(eyeX1 - 2, enemy.y + 8, 4, 4);
              ctx.fillRect(eyeX2 - 2, enemy.y + 8, 4, 4);
          }
      });

      // --- Draw player ---
      if (playerImage) {
          ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
      } else {
          ctx.fillStyle = '#e74c3c';
          ctx.fillRect(player.x, player.y, player.width, player.height);
          ctx.fillStyle = '#3498db';
          ctx.fillRect(player.x + 4, player.y + player.height / 2, player.width - 8, player.height / 2 - 4);
      }
      
      ctx.restore(); // Restore from camera translation
      
      // --- Draw HUD ---
      ctx.fillStyle = 'white';
      ctx.font = '24px "Press Start 2P", sans-serif';
      ctx.fillText(`Score: ${score}`, 20, 40);
    }
    
      ctx.restore(); // Restore from responsive scaling
  };
  
  useEffect(() => {
    gameFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(gameFrameRef.current);
  }, [gameLoop]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 p-4 font-mono">
      <div className="w-full max-w-4xl flex justify-between items-center mb-4">
        <a
            href="/"
            title="Back to Resume"
            className="text-white bg-gray-700 hover:bg-gray-600 rounded-full p-2 transition-colors flex items-center"
          >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="ml-2">Back</span>
        </a>

        <h1
          className="text-2xl md:text-4xl text-white font-bold text-center flex-1"
          style={{ fontFamily: '"Press Start 2P", cursive' }}
        >
          Mario test
        </h1>
        
        <div className="w-48 text-right">
            {walletAddress ? (
                <div className="bg-gray-700 text-white text-sm p-2 rounded-lg shadow-md truncate">
                    {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
                </div>
            ) : (
                <button onClick={connectWallet} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300">
                    Connect
                </button>
            )}
        </div>
      </div>

      <div className="w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      <div className="text-white mt-4 text-center">
        <p><span className="font-bold">Controls:</span> Arrow Keys to Move, Spacebar to Jump</p>
      </div>
    </div>
  );
};

export default SuperJumpQuest;

