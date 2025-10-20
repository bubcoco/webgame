// src/components/SuperJumpQuest.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  JUMP_FORCE,
  GRAVITY,
  TILE_SIZE,
} from '@/lib/constants';
import { Keys, Player, Platform, Coin, Enemy } from '@/lib/types';
import { generateRandomLevel } from '@/lib/gameUtils';

export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 576;

interface SuperJumpQuestProps {
  onGameEnd?: (score: number) => void;
  walletAddress?: string | null;
  onConnectWallet?: () => void;
  showWalletButton?: boolean;
}

const SuperJumpQuest: React.FC<SuperJumpQuestProps> = ({
  onGameEnd,
  walletAddress,
  onConnectWallet,
  showWalletButton = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasCalledOnGameEnd = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

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

  const [level, setLevel] = useState<Platform[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [cameraX, setCameraX] = useState(0);
  const gameFrameRef = useRef<number>(0);
  const [playerImage, setPlayerImage] = useState<HTMLImageElement | null>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const { platforms, coins: newCoins, enemies: newEnemies } =
      generateRandomLevel();
    setLevel(platforms);
    setCoins(newCoins);
    setEnemies(newEnemies);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = '/images/player.png';
    img.onload = () => setPlayerImage(img);
    img.onerror = () => console.error('Failed to load player image.');
  }, []);

  const resetGame = useCallback(() => {
    const {
      platforms,
      coins: newCoins,
      enemies: newEnemies,
    } = generateRandomLevel();

    setLevel(platforms);
    setCoins(newCoins);
    setEnemies(newEnemies);

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

    setScore(0);
    setCameraX(0);
    setGameOver(false);
    hasCalledOnGameEnd.current = false;
  }, []);

  useEffect(() => {
    if (gameOver && score > 0 && onGameEnd && !hasCalledOnGameEnd.current) {
      hasCalledOnGameEnd.current = true;
      onGameEnd(score);
    }
  }, [gameOver, score, onGameEnd]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight'
      ) {
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

  // Mobile touch controls
  const handleTouchButton = useCallback(
    (button: 'left' | 'right' | 'jump', isPressed: boolean) => {
      if (button === 'left') {
        setKeys((prev) => ({ ...prev, ArrowLeft: isPressed }));
      } else if (button === 'right') {
        setKeys((prev) => ({ ...prev, ArrowRight: isPressed }));
      } else if (button === 'jump') {
        setKeys((prev) => ({ ...prev, Space: isPressed }));
        if (isPressed && gameOver) {
          resetGame();
        }
      }
    },
    [gameOver, resetGame]
  );

  const gameLoop = useCallback(() => {
    if (!gameOver && level.length > 0) {
      setPlayer((p) => {
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

        level.forEach((platform) => {
          if (
            p.x < platform.x + platform.width &&
            p.x + p.width > platform.x &&
            p.y + p.height <= platform.y &&
            newY + p.height >= platform.y
          ) {
            newY = platform.y - p.height;
            newVy = 0;
            newOnGround = true;
            newIsJumping = false;
          }
        });

        setEnemies((prevEnemies) =>
          prevEnemies.map((enemy) => {
            if (enemy.isDefeated) return enemy;

            if (
              p.x < enemy.x + enemy.width &&
              p.x + p.width > enemy.x &&
              p.y + p.height <= enemy.y &&
              newY + p.height >= enemy.y
            ) {
              setScore((s) => s + 200);
              newVy = -JUMP_FORCE / 2;
              return { ...enemy, isDefeated: true };
            } else if (
              newX < enemy.x + enemy.width &&
              newX + p.width > enemy.x &&
              newY < enemy.y + enemy.height &&
              newY + p.height > enemy.y
            ) {
              setGameOver(true);
            }

            let newEnemyX = enemy.x + enemy.vx * enemy.direction;
            let newDirection = enemy.direction;

            let onPlatform = false;
            level.forEach((platform) => {
              const nextFootX =
                newDirection > 0 ? newEnemyX + enemy.width : newEnemyX;
              if (
                nextFootX > platform.x &&
                nextFootX < platform.x + platform.width &&
                enemy.y + enemy.height === platform.y
              ) {
                onPlatform = true;
              }
            });

            if (!onPlatform) {
              newDirection *= -1;
              newEnemyX = enemy.x + enemy.vx * newDirection;
            }

            return { ...enemy, x: newEnemyX, direction: newDirection };
          })
        );

        setCoins((prevCoins) =>
          prevCoins.map((coin) => {
            if (
              !coin.collected &&
              newX < coin.x + coin.width &&
              newX + PLAYER_WIDTH > coin.x &&
              newY < coin.y + coin.height &&
              newY + PLAYER_HEIGHT > coin.y
            ) {
              setScore((s) => s + 100);
              return { ...coin, collected: true };
            }
            return coin;
          })
        );

        if (newX < cameraX) {
          newX = cameraX;
        }

        if (p.y > GAME_HEIGHT + 100) {
          setGameOver(true);
        }

        return {
          ...p,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          isJumping: newIsJumping,
          onGround: newOnGround,
        };
      });

      setCameraX((prevCamX) => {
        const targetCamX = player.x - 300;
        const newCamX = prevCamX + (targetCamX - prevCamX) * 0.1;
        return Math.max(0, newCamX);
      });
    }

    draw();
    gameFrameRef.current = requestAnimationFrame(gameLoop);
  }, [player, keys, gameOver, score, cameraX, level]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: cssWidth, height: cssHeight } =
      canvas.getBoundingClientRect();
    if (canvas.width !== cssWidth || canvas.height !== cssHeight) {
      canvas.width = cssWidth;
      canvas.height = cssHeight;
    }

    const scale = Math.min(
      canvas.width / GAME_WIDTH,
      canvas.height / GAME_HEIGHT
    );
    const offsetX = (canvas.width - GAME_WIDTH * scale) / 2;
    const offsetY = (canvas.height - GAME_HEIGHT * scale) / 2;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = 'white';
      ctx.font = isMobile
        ? '32px "Press Start 2P", sans-serif'
        : '48px "Press Start 2P", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Game Over', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);
      ctx.font = isMobile
        ? '16px "Press Start 2P", sans-serif'
        : '24px "Press Start 2P", sans-serif';
      ctx.fillText(`Score: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10);
      ctx.font = isMobile
        ? '12px "Press Start 2P", sans-serif'
        : '16px "Press Start 2P", sans-serif';
      ctx.fillText(
        isMobile ? 'Tap Jump for New Level' : 'Press Space for New Level',
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 40
      );

      if (score > 0) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText(
          'Claim tokens below!',
          GAME_WIDTH / 2,
          GAME_HEIGHT / 2 + 100
        );
      }
    } else {
      ctx.save();
      ctx.translate(-cameraX, 0);

      level.forEach((platform) => {
        ctx.fillStyle = '#e69500';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.fillStyle = '#a16600';
        ctx.fillRect(
          platform.x,
          platform.y + 10,
          platform.width,
          platform.height - 10
        );
      });

      coins.forEach((coin) => {
        if (!coin.collected) {
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(
            coin.x + coin.width / 2,
            coin.y + coin.height / 2,
            coin.width / 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.fillStyle = '#e6c300';
          ctx.beginPath();
          ctx.arc(
            coin.x + coin.width / 2,
            coin.y + coin.height / 2,
            coin.width / 3,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });

      enemies.forEach((enemy) => {
        if (!enemy.isDefeated) {
          ctx.fillStyle = '#c0392b';
          ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
          ctx.fillStyle = 'white';
          const eyeX1 =
            enemy.direction > 0
              ? enemy.x + enemy.width * 0.6
              : enemy.x + enemy.width * 0.2;
          const eyeX2 =
            enemy.direction > 0
              ? enemy.x + enemy.width * 0.8
              : enemy.x + enemy.width * 0.4;
          ctx.fillRect(eyeX1 - 2, enemy.y + 8, 4, 4);
          ctx.fillRect(eyeX2 - 2, enemy.y + 8, 4, 4);
        }
      });

      if (playerImage) {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
      } else {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillStyle = '#3498db';
        ctx.fillRect(
          player.x + 4,
          player.y + player.height / 2,
          player.width - 8,
          player.height / 2 - 4
        );
      }

      ctx.restore();

      ctx.fillStyle = 'white';
      ctx.font = isMobile
        ? '14px "Press Start 2P", sans-serif'
        : '24px "Press Start 2P", sans-serif';
      ctx.fillText(`Score: ${score}`, 20, isMobile ? 30 : 40);

      const collectedCoins = coins.filter((c) => c.collected).length;
      const totalCoins = coins.length;
      ctx.font = isMobile
        ? '10px "Press Start 2P", sans-serif'
        : '16px "Press Start 2P", sans-serif';
      ctx.fillText(
        `Coins: ${collectedCoins}/${totalCoins}`,
        20,
        isMobile ? 50 : 70
      );
    }

    ctx.restore();
  };

  useEffect(() => {
    gameFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(gameFrameRef.current);
  }, [gameLoop]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#1f2937', // bg-gray-800
        padding: '8px', // p-2
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', // font-mono
      }}
    >
      {/* Header */}
      <div
        style={{
          width: '100%',
          maxWidth: '896px', // max-w-4xl
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px', // mb-2
          paddingLeft: '8px', // px-2
          paddingRight: '8px', // px-2
        }}
      >
        <a
          href="/"
          style={{
            color: '#ffffff', // text-white
            backgroundColor: '#374151', // bg-gray-700
            borderRadius: '9999px', // rounded-full
            padding: '4px', // p-1
            transitionProperty: 'background-color',
            transitionDuration: '150ms', // transition-colors
            display: 'flex',
            alignItems: 'center',
            fontSize: '12px', // text-xs
            textDecoration: 'none',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            style={{
              height: '16px', // h-4
              width: '16px', // w-4
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span
            style={{
              marginLeft: '4px', // ml-1
              display: 'none', // hidden
            }}
          >
            Back
          </span>
        </a>

        <h1
          style={{
            fontFamily: '"Press Start 2P", cursive',
            fontSize: '14px', // text-sm
            color: '#ffffff', // text-white
            fontWeight: '700', // font-bold
            textAlign: 'center',
            flex: '1 1 0%', // flex-1
            marginLeft: '8px', // mx-2
            marginRight: '8px', // mx-2
          }}
        >
          Game Test
        </h1>

        {showWalletButton && (
          <div
            style={{
              width: '96px', // w-24
              textAlign: 'right',
            }}
          >
            {walletAddress ? (
              <div
                style={{
                  backgroundColor: '#374151', // bg-gray-700
                  color: '#ffffff', // text-white
                  fontSize: '12px', // text-xs
                  padding: '4px', // p-1
                  borderRadius: '8px', // rounded-lg
                  boxShadow:
                    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // shadow-md
                  overflow: 'hidden', // truncate
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {`${walletAddress.substring(
                  0,
                  4
                )}...${walletAddress.substring(walletAddress.length - 3)}`}
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                style={{
                  backgroundColor: '#9333ea', // bg-purple-600
                  color: '#ffffff', // text-white
                  fontWeight: '700', // font-bold
                  paddingTop: '4px', // py-1
                  paddingBottom: '4px',
                  paddingLeft: '8px', // px-2
                  paddingRight: '8px',
                  borderRadius: '8px', // rounded-lg
                  transitionProperty: 'background-color',
                  transitionDuration: '300ms',
                  fontSize: '12px', // text-xs
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Connect
              </button>
            )}
          </div>
        )}
      </div>

      {/* Game Canvas */}
      <div
        style={{
          width: '100%',
          maxWidth: '896px', // max-w-4xl
          aspectRatio: '16 / 9',
          backgroundColor: '#000000', // bg-black
          borderRadius: '8px', // rounded-lg
          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', // shadow-2xl
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Mobile Controls */}
      {isMobile && (
        <div
          style={{
            zIndex: 1000,
            position: 'fixed',
            bottom: '80px', // bottom-20
            left: '0px',
            right: '0px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingLeft: '16px', // px-4
            paddingRight: '16px',
            pointerEvents: 'none',
          }}
        >
          {/* Left/Right Controls */}
          <div
            style={{
              display: 'flex',
              gap: '8px', // gap-2
              pointerEvents: 'auto',
            }}
          >
            <button
              onTouchStart={() => handleTouchButton('left', true)}
              onTouchEnd={() => handleTouchButton('left', false)}
              style={{
                width: '64px', // w-16
                height: '64px', // h-16
                backgroundColor: 'rgba(55, 65, 81, 0.8)', // bg-gray-700/80
                borderRadius: '9999px', // rounded-full
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff', // text-white
                fontSize: '24px', // text-2xl
                fontWeight: '700', // font-bold
                transition: 'all 150ms', // transition-all
                boxShadow:
                  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', // shadow-lg
                border: 'none',
                cursor: 'pointer',
              }}
            >
              ←
            </button>
            <button
              onTouchStart={() => handleTouchButton('right', true)}
              onTouchEnd={() => handleTouchButton('right', false)}
              style={{
                width: '64px', // w-16
                height: '64px', // h-16
                backgroundColor: 'rgba(55, 65, 81, 0.8)', // bg-gray-700/80
                borderRadius: '9999px', // rounded-full
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff', // text-white
                fontSize: '24px', // text-2xl
                fontWeight: '700', // font-bold
                transition: 'all 150ms', // transition-all
                boxShadow:
                  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', // shadow-lg
                border: 'none',
                cursor: 'pointer',
              }}
            >
              →
            </button>
          </div>

          {/* Jump Button */}
          <button
            onTouchStart={() => handleTouchButton('jump', true)}
            onTouchEnd={() => handleTouchButton('jump', false)}
            style={{
              fontFamily: '"Press Start 2P", cursive',
              width: '80px', // w-20
              height: '80px', // h-20
              backgroundColor: 'rgba(220, 38, 38, 0.8)', // bg-red-600/80
              borderRadius: '9999px', // rounded-full
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff', // text-white
              fontSize: '20px', // text-xl
              fontWeight: '700', // font-bold
              transition: 'all 150ms', // transition-all
              boxShadow:
                '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', // shadow-lg
              pointerEvents: 'auto',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            JUMP
          </button>
        </div>
      )}

      {/* Instructions */}
      <div
        style={{
          color: '#ffffff', // text-white
          marginTop: '8px', // mt-2
          textAlign: 'center',
          paddingLeft: '16px', // px-4
          paddingRight: '16px',
        }}
      >
        <p
          style={{
            fontSize: '12px', // text-xs
          }}
        >
          <span style={{ fontWeight: '700' }}>Controls:</span>{' '}
          {isMobile ? 'Touch buttons below' : 'Arrow Keys + Spacebar'}
        </p>
        <p
          style={{
            fontSize: '12px', // text-xs
            color: '#9ca3af', // text-gray-400
            marginTop: '4px', // mt-1
          }}
        >
          🎲 Random levels! {isMobile ? 'Tap Jump' : 'Press Space'} to restart
        </p>
      </div>
    </div>
  );
};

export default SuperJumpQuest;