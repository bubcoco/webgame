'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, Platform, Coin, Enemy, Keys } from '@/lib/types';
import { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED, JUMP_FORCE, GRAVITY, TILE_SIZE } from '@/lib/constants';

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

  // --- Load Player Image ---
  useEffect(() => {
    const img = new Image();
    // Make sure you have an image at public/images/player.png
    // img.src = '../public/images/player.png';
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

  // --- Keyboard Handlers ---
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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameOver, resetGame]);


  // --- Game Loop ---
  const gameLoop = useCallback(() => {
    if (gameOver) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '48px "Press Start 2P", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40);
      ctx.font = '24px "Press Start 2P", sans-serif';
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 60);
      return;
    }
    
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
            // Check for vertical collision (falling onto a platform)
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
            
            // Player stomps enemy
            if (p.x < enemy.x + enemy.width &&
                p.x + p.width > enemy.x &&
                p.y + p.height <= enemy.y &&
                newY + p.height >= enemy.y)
            {
                setScore(s => s + 200);
                newVy = -JUMP_FORCE / 2; // small bounce
                return { ...enemy, isDefeated: true };
            } 
            // Player gets hit by enemy
            else if (newX < enemy.x + enemy.width &&
                newX + p.width > enemy.x &&
                newY < enemy.y + enemy.height &&
                newY + p.height > enemy.y)
            {
                setGameOver(true);
            }

            let newEnemyX = enemy.x + enemy.vx * enemy.direction;
            let newDirection = enemy.direction;
            
            // Basic enemy AI: turn around at platform edges
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

        // Left boundary
        if (newX < cameraX) {
            newX = cameraX;
        }

        // Fall off screen
        if (p.y > 600) {
            setGameOver(true);
        }

        return { ...p, x: newX, y: newY, vx: newVx, vy: newVy, isJumping: newIsJumping, onGround: newOnGround };
    });
    
    // Update Camera
    setCameraX(prevCamX => {
        const targetCamX = player.x - 300;
        // Smooth camera follow
        const newCamX = prevCamX + (targetCamX - prevCamX) * 0.1;
        return Math.max(0, newCamX); // prevent camera from going left of the start
    });

    draw();
    gameFrameRef.current = requestAnimationFrame(gameLoop);
  }, [player, keys, gameOver, score, cameraX, resetGame]);
  
  // --- Drawing ---
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Responsive canvas sizing
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    }

    // --- Clear and draw background ---
    ctx.fillStyle = '#70c5ce'; // Sky blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraX, 0);

    // --- Draw platforms ---
    level.forEach(platform => {
      ctx.fillStyle = '#e69500'; // Platform top
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      ctx.fillStyle = '#a16600'; // Platform side
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
            ctx.fillStyle = '#c0392b'; // Enemy color
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            // Eyes
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
        // Fallback drawing if image is not loaded
        ctx.fillStyle = '#e74c3c'; // Player color
        ctx.fillRect(player.x, player.y, player.width, player.height);
        // Player details
        ctx.fillStyle = '#3498db'; // Overalls
        ctx.fillRect(player.x + 4, player.y + player.height / 2, player.width - 8, player.height / 2 - 4);
    }
    

    ctx.restore();
    
    // --- Draw HUD ---
    ctx.fillStyle = 'white';
    ctx.font = '24px "Press Start 2P", sans-serif';
    ctx.fillText(`Score: ${score}`, 20, 40);
  };
  
  useEffect(() => {
    gameFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(gameFrameRef.current);
  }, [gameLoop]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 p-4 font-mono">
      <h1 className="text-4xl text-white mb-4 font-bold" style={{fontFamily: '"Press Start 2P", cursive'}}>Mario test</h1>
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



