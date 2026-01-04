'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ethers } from 'ethers';
import ClaimTokenButton from '@/components/claimTokenButton';

// Game constants
const GAME_WIDTH = 1024;
const GAME_HEIGHT = 576;
const GRAVITY = 0.6;
const PLAYER_SIZE = 40;
const RING_SIZE = 25;
const MAX_SPEED = 15;

interface Ring {
    x: number;
    y: number;
    collected: boolean;
}

interface Enemy {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'badnik' | 'spike';
    defeated: boolean;
}

interface Platform {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'normal' | 'spring' | 'loop' | 'speed';
}

interface Player {
    x: number;
    y: number;
    vx: number;
    vy: number;
    isRolling: boolean;
    onGround: boolean;
    direction: number;
    rings: number;
}

type WalletNetwork = 'evm' | 'solana';

export default function SonicPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Use refs for game state to avoid re-renders during game loop
    const playerRef = useRef<Player>({
        x: 100,
        y: 300,
        vx: 0,
        vy: 0,
        isRolling: false,
        onGround: false,
        direction: 1,
        rings: 0
    });

    const platformsRef = useRef<Platform[]>([]);
    const ringsRef = useRef<Ring[]>([]);
    const enemiesRef = useRef<Enemy[]>([]);
    const cameraXRef = useRef(0);
    const scoreRef = useRef(0);

    // Only these need to be state for UI updates
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [showClaimSection, setShowClaimSection] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Wallet states
    const [selectedNetwork, setSelectedNetwork] = useState<WalletNetwork>('evm');
    const [evmAddress, setEvmAddress] = useState<string | null>(null);
    const [solanaAddress, setSolanaAddress] = useState<string | null>(null);

    const keysRef = useRef({ left: false, right: false, jump: false, down: false });
    const gameLoopRef = useRef<number>(0);
    const gameOverRef = useRef(false);

    // Initialize level
    useEffect(() => {
        generateLevel();
    }, []);

    const generateLevel = useCallback(() => {
        // Generate platforms
        platformsRef.current = [
            // Ground sections
            { x: 0, y: 500, width: 800, height: 100, type: 'normal' },
            { x: 900, y: 500, width: 600, height: 100, type: 'normal' },
            { x: 1600, y: 500, width: 800, height: 100, type: 'normal' },
            { x: 2500, y: 500, width: 1000, height: 100, type: 'normal' },
            // Floating platforms
            { x: 200, y: 380, width: 150, height: 20, type: 'normal' },
            { x: 450, y: 300, width: 200, height: 20, type: 'normal' },
            { x: 750, y: 350, width: 100, height: 20, type: 'spring' },
            { x: 1000, y: 280, width: 250, height: 20, type: 'normal' },
            { x: 1350, y: 200, width: 150, height: 20, type: 'normal' },
            { x: 1700, y: 350, width: 200, height: 20, type: 'speed' },
            { x: 2000, y: 280, width: 180, height: 20, type: 'normal' },
            { x: 2300, y: 380, width: 150, height: 20, type: 'spring' },
            { x: 2700, y: 300, width: 200, height: 20, type: 'normal' },
            { x: 3000, y: 400, width: 300, height: 20, type: 'loop' },
        ];

        // Generate rings (fewer for performance)
        ringsRef.current = [];
        for (let i = 0; i < 50; i++) {
            ringsRef.current.push({
                x: 150 + i * 120 + Math.random() * 40,
                y: 250 + Math.sin(i * 0.5) * 100,
                collected: false
            });
        }

        // Generate enemies
        enemiesRef.current = [
            { x: 600, y: 460, width: 40, height: 40, type: 'badnik', defeated: false },
            { x: 1200, y: 460, width: 40, height: 40, type: 'badnik', defeated: false },
            { x: 1850, y: 460, width: 40, height: 40, type: 'badnik', defeated: false },
            { x: 2400, y: 460, width: 40, height: 40, type: 'badnik', defeated: false },
        ];
    }, []);

    // Detect mobile
    useEffect(() => {
        setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                e.preventDefault();
                keysRef.current.jump = true;
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
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') keysRef.current.jump = false;
            if (e.code === 'ArrowDown' || e.code === 'KeyS') keysRef.current.down = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameOver]);

    const resetGame = useCallback(() => {
        playerRef.current = {
            x: 100,
            y: 300,
            vx: 0,
            vy: 0,
            isRolling: false,
            onGround: false,
            direction: 1,
            rings: 0
        };
        scoreRef.current = 0;
        cameraXRef.current = 0;
        gameOverRef.current = false;
        setScore(0);
        setGameOver(false);
        setShowClaimSection(false);
        generateLevel();
    }, [generateLevel]);

    // Wallet connections
    const connectEVM = async () => {
        if (typeof window.ethereum === 'undefined') {
            alert('MetaMask not found. Please install it.');
            return;
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setEvmAddress(address);
            setSelectedNetwork('evm');
        } catch (error) {
            console.error('EVM connection failed:', error);
        }
    };

    const connectSolana = async () => {
        const phantom = (window as any).phantom?.solana;
        if (phantom?.isPhantom) {
            try {
                const response = await phantom.connect();
                setSolanaAddress(response.publicKey.toString());
                setSelectedNetwork('solana');
            } catch (err) {
                console.error('Phantom connection failed:', err);
                // Demo mode
                setSolanaAddress('Demo' + Math.random().toString(36).substring(2, 10));
                setSelectedNetwork('solana');
            }
        } else {
            // Demo mode
            setSolanaAddress('Demo' + Math.random().toString(36).substring(2, 10));
            setSelectedNetwork('solana');
        }
    };

    // Combined game loop and render (optimized)
    useEffect(() => {
        if (gameOver) return;
        gameOverRef.current = false;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let lastTime = 0;
        const targetFPS = 60;
        const frameTime = 1000 / targetFPS;

        const gameLoop = (currentTime: number) => {
            if (gameOverRef.current) return;

            const deltaTime = currentTime - lastTime;
            if (deltaTime < frameTime) {
                gameLoopRef.current = requestAnimationFrame(gameLoop);
                return;
            }
            lastTime = currentTime;

            const p = playerRef.current;
            const platforms = platformsRef.current;
            const rings = ringsRef.current;
            const enemies = enemiesRef.current;

            // Physics update
            let newVx = p.vx;
            let newVy = p.vy + GRAVITY;
            let newIsRolling = p.isRolling;
            let newDirection = p.direction;

            if (keysRef.current.right) {
                newVx = Math.min(newVx + 0.5, MAX_SPEED);
                newDirection = 1;
            } else if (keysRef.current.left) {
                newVx = Math.max(newVx - 0.5, -MAX_SPEED);
                newDirection = -1;
            } else {
                newVx *= 0.95;
                if (Math.abs(newVx) < 0.1) newVx = 0;
            }

            if (keysRef.current.down && p.onGround && Math.abs(newVx) > 3) {
                newIsRolling = true;
            } else if (!keysRef.current.down) {
                newIsRolling = false;
            }

            if (keysRef.current.jump && p.onGround) {
                newVy = -15;
                keysRef.current.jump = false; // Prevent continuous jumping
            }

            let newX = p.x + newVx;
            let newY = p.y + newVy;
            let newOnGround = false;

            // Platform collision
            for (const plat of platforms) {
                if (
                    p.x + PLAYER_SIZE > plat.x &&
                    p.x < plat.x + plat.width &&
                    p.y + PLAYER_SIZE <= plat.y &&
                    newY + PLAYER_SIZE >= plat.y
                ) {
                    newY = plat.y - PLAYER_SIZE;
                    newVy = 0;
                    newOnGround = true;

                    if (plat.type === 'spring') {
                        newVy = -22;
                        newOnGround = false;
                    } else if (plat.type === 'speed') {
                        newVx = newDirection * MAX_SPEED;
                    }
                    break;
                }
            }

            // Collect rings
            for (const ring of rings) {
                if (!ring.collected) {
                    const dx = (newX + PLAYER_SIZE / 2) - ring.x;
                    const dy = (newY + PLAYER_SIZE / 2) - ring.y;
                    if (dx * dx + dy * dy < 900) { // ~30px radius
                        ring.collected = true;
                        scoreRef.current += 100;
                    }
                }
            }

            // Enemy collision
            for (const enemy of enemies) {
                if (enemy.defeated) continue;
                const dx = (newX + PLAYER_SIZE / 2) - (enemy.x + enemy.width / 2);
                const dy = (newY + PLAYER_SIZE / 2) - (enemy.y + enemy.height / 2);
                const distSq = dx * dx + dy * dy;
                const collisionDist = (PLAYER_SIZE / 2 + enemy.width / 2);

                if (distSq < collisionDist * collisionDist) {
                    if ((p.vy > 0 && newY < enemy.y) || newIsRolling) {
                        enemy.defeated = true;
                        newVy = -10;
                        scoreRef.current += 200;
                    } else {
                        gameOverRef.current = true;
                        setScore(scoreRef.current);
                        setGameOver(true);
                        setShowClaimSection(true);
                        return;
                    }
                }
            }

            // Fall death
            if (newY > GAME_HEIGHT + 100) {
                gameOverRef.current = true;
                setScore(scoreRef.current);
                setGameOver(true);
                setShowClaimSection(true);
                return;
            }

            // Bounds
            if (newX < cameraXRef.current) {
                newX = cameraXRef.current;
                newVx = Math.max(0, newVx);
            }

            // Update player ref
            playerRef.current = {
                x: newX,
                y: newY,
                vx: newVx,
                vy: newVy,
                isRolling: newIsRolling,
                onGround: newOnGround,
                direction: newDirection,
                rings: rings.filter(r => r.collected).length
            };

            // Update camera
            const targetCamX = newX - 300;
            cameraXRef.current += (targetCamX - cameraXRef.current) * 0.1;
            if (cameraXRef.current < 0) cameraXRef.current = 0;

            // --- RENDER ---
            const cameraX = cameraXRef.current;
            const player = playerRef.current;

            // Sky
            ctx.fillStyle = '#1a237e';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            // Simple parallax
            ctx.fillStyle = '#303f9f';
            for (let i = 0; i < 4; i++) {
                const mountainX = (i * 400 - cameraX * 0.2) % (GAME_WIDTH + 400) - 200;
                ctx.beginPath();
                ctx.moveTo(mountainX, GAME_HEIGHT);
                ctx.lineTo(mountainX + 200, GAME_HEIGHT - 180);
                ctx.lineTo(mountainX + 400, GAME_HEIGHT);
                ctx.fill();
            }

            ctx.save();
            ctx.translate(-cameraX, 0);

            // Draw platforms
            for (const plat of platforms) {
                if (plat.x + plat.width < cameraX - 50 || plat.x > cameraX + GAME_WIDTH + 50) continue;
                ctx.fillStyle = plat.type === 'speed' ? '#FF5722' : plat.type === 'spring' ? '#FFD700' : '#4CAF50';
                ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
            }

            // Draw rings
            ctx.fillStyle = '#FFD700';
            for (const ring of rings) {
                if (ring.collected || ring.x < cameraX - 50 || ring.x > cameraX + GAME_WIDTH + 50) continue;
                ctx.beginPath();
                ctx.arc(ring.x, ring.y, 12, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw enemies
            for (const enemy of enemies) {
                if (enemy.defeated || enemy.x < cameraX - 50 || enemy.x > cameraX + GAME_WIDTH + 50) continue;
                ctx.fillStyle = '#E53935';
                ctx.beginPath();
                ctx.arc(enemy.x + 20, enemy.y + 20, 20, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw player
            ctx.fillStyle = '#1565C0';
            ctx.beginPath();
            ctx.arc(player.x + PLAYER_SIZE / 2, player.y + PLAYER_SIZE / 2, PLAYER_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();

            // Face
            if (!player.isRolling) {
                ctx.fillStyle = '#FFCCBC';
                ctx.beginPath();
                ctx.arc(player.x + PLAYER_SIZE / 2 + player.direction * 5, player.y + PLAYER_SIZE / 2, 10, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();

            // HUD
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(10, 10, 180, 50);
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`💍 ${rings.filter(r => r.collected).length}  ⭐ ${scoreRef.current}`, 20, 40);

            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(gameLoopRef.current);
    }, [gameOver]);



    // Mobile controls
    const handleMobileControl = (action: 'left' | 'right' | 'jump', isPressed: boolean) => {
        if (action === 'left') keysRef.current.left = isPressed;
        if (action === 'right') keysRef.current.right = isPressed;
        if (action === 'jump') {
            keysRef.current.jump = isPressed;
            if (isPressed && gameOver) resetGame();
        }
    };

    const handleClaimSuccess = (txHash: string) => {
        alert(`🎉 Success! Claimed ${score / 100} tokens!\n\nTX: ${txHash.slice(0, 10)}...`);
    };

    const currentAddress = selectedNetwork === 'evm' ? evmAddress : solanaAddress;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#1a237e',
            padding: '1rem',
            fontFamily: 'Arial, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                width: '100%',
                maxWidth: '1024px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
            }}>
                <a href="/" style={{
                    color: '#fff',
                    backgroundColor: '#374151',
                    borderRadius: '50%',
                    padding: '0.5rem',
                    display: 'flex',
                    textDecoration: 'none'
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </a>

                <h1 style={{
                    color: '#fff',
                    fontSize: isMobile ? '1.25rem' : '1.5rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(90deg, #1565C0, #42A5F5)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    ⚡ Sonic Rush
                </h1>

                {/* Network Selector & Wallet */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Network Toggle */}
                    <div style={{
                        display: 'flex',
                        backgroundColor: '#1a1a3e',
                        borderRadius: '0.5rem',
                        overflow: 'hidden'
                    }}>
                        <button
                            onClick={() => setSelectedNetwork('evm')}
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                backgroundColor: selectedNetwork === 'evm' ? '#7c3aed' : 'transparent',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}
                        >
                            🔷 EVM
                        </button>
                        <button
                            onClick={() => setSelectedNetwork('solana')}
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                backgroundColor: selectedNetwork === 'solana' ? '#14F195' : 'transparent',
                                color: selectedNetwork === 'solana' ? '#000' : '#fff',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}
                        >
                            ◎ SOL
                        </button>
                    </div>

                    {/* Wallet Button */}
                    {currentAddress ? (
                        <div style={{
                            backgroundColor: selectedNetwork === 'evm' ? '#7c3aed' : '#14F195',
                            color: selectedNetwork === 'evm' ? '#fff' : '#000',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                        }}>
                            {currentAddress.slice(0, 6)}...{currentAddress.slice(-4)}
                        </div>
                    ) : (
                        <button
                            onClick={selectedNetwork === 'evm' ? connectEVM : connectSolana}
                            style={{
                                background: selectedNetwork === 'evm'
                                    ? 'linear-gradient(90deg, #7c3aed, #a855f7)'
                                    : 'linear-gradient(90deg, #9945FF, #14F195)',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                color: '#fff',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                            }}
                        >
                            {selectedNetwork === 'evm' ? '🦊 Connect' : '👻 Connect'}
                        </button>
                    )}
                </div>
            </div>

            {/* Game Canvas */}
            <div style={{
                borderRadius: '1rem',
                overflow: 'hidden',
                boxShadow: '0 0 30px rgba(21, 101, 192, 0.5)'
            }}>
                <canvas
                    ref={canvasRef}
                    width={GAME_WIDTH}
                    height={GAME_HEIGHT}
                    style={{ maxWidth: '100%', height: 'auto' }}
                />
            </div>

            {/* Mobile Controls */}
            {isMobile && !gameOver && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    maxWidth: '400px',
                    marginTop: '1rem'
                }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onTouchStart={() => handleMobileControl('left', true)}
                            onTouchEnd={() => handleMobileControl('left', false)}
                            style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(21, 101, 192, 0.8)',
                                border: 'none',
                                color: '#fff',
                                fontSize: '1.5rem'
                            }}
                        >
                            ←
                        </button>
                        <button
                            onTouchStart={() => handleMobileControl('right', true)}
                            onTouchEnd={() => handleMobileControl('right', false)}
                            style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(21, 101, 192, 0.8)',
                                border: 'none',
                                color: '#fff',
                                fontSize: '1.5rem'
                            }}
                        >
                            →
                        </button>
                    </div>
                    <button
                        onTouchStart={() => handleMobileControl('jump', true)}
                        onTouchEnd={() => handleMobileControl('jump', false)}
                        style={{
                            width: '90px',
                            height: '90px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 193, 7, 0.9)',
                            border: 'none',
                            color: '#000',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        JUMP
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
                {isMobile ? 'Tap to move and jump' : '← → Move | SPACE Jump | ↓ Roll | Collect rings!'}
            </p>

            {/* Claim Popup - Mario style */}
            {showClaimSection && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(26, 35, 126, 0.98), rgba(15, 15, 35, 0.95))',
                    padding: isMobile ? '1.5rem' : '2rem',
                    borderTop: `3px solid ${selectedNetwork === 'evm' ? '#7c3aed' : '#14F195'}`,
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
                            ⚡ Run Complete!
                        </h2>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
                            <div>
                                <div style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    💍 {ringsRef.current.filter((r: Ring) => r.collected).length}
                                </div>
                                <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Rings</div>
                            </div>
                            <div>
                                <div style={{ color: '#4ade80', fontSize: '1.5rem', fontWeight: 'bold' }}>{score}</div>
                                <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Score</div>
                            </div>
                        </div>

                        <p style={{ color: '#9ca3af', marginBottom: '1rem', fontSize: '0.875rem' }}>
                            = <strong style={{ color: '#4ade80' }}>{Math.floor(score / 100)}</strong> tokens on{' '}
                            <strong style={{ color: selectedNetwork === 'evm' ? '#7c3aed' : '#14F195' }}>
                                {selectedNetwork === 'evm' ? 'Polygon Amoy' : 'Solana Devnet'}
                            </strong>
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
                            {selectedNetwork === 'evm' && evmAddress && score >= 100 ? (
                                <ClaimTokenButton
                                    score={score}
                                    walletAddress={evmAddress}
                                    onClaimSuccess={handleClaimSuccess}
                                    onClaimError={(e) => console.error(e)}
                                />
                            ) : selectedNetwork === 'solana' && solanaAddress && score >= 100 ? (
                                <button
                                    onClick={() => alert('🚀 Solana claim!\nToken: SONIC\nAmount: ' + Math.floor(score / 100))}
                                    style={{
                                        background: 'linear-gradient(90deg, #9945FF, #14F195)',
                                        border: 'none',
                                        padding: '1rem 2rem',
                                        borderRadius: '0.5rem',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🪙 Claim {Math.floor(score / 100)} SONIC
                                </button>
                            ) : !evmAddress && !solanaAddress ? (
                                <button
                                    onClick={selectedNetwork === 'evm' ? connectEVM : connectSolana}
                                    style={{
                                        background: selectedNetwork === 'evm' ? '#7c3aed' : 'linear-gradient(90deg, #9945FF, #14F195)',
                                        border: 'none',
                                        padding: '1rem 2rem',
                                        borderRadius: '0.5rem',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🔗 Connect {selectedNetwork === 'evm' ? 'MetaMask' : 'Phantom'}
                                </button>
                            ) : (
                                <p style={{ color: '#9ca3af' }}>Collect more rings to claim tokens!</p>
                            )}

                            {/* Restart Button */}
                            <button
                                onClick={() => { setShowClaimSection(false); resetGame(); }}
                                style={{
                                    background: 'linear-gradient(90deg, #1565C0, #42A5F5)',
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
