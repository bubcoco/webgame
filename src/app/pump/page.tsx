'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Types
interface TokenData {
    name: string;
    symbol: string;
    price: number;
    marketCap: number;
    supply: number;
    holders: number;
    priceHistory: number[];
    volume24h: number;
    change24h: number;
    creator: string;
    createdAt: number;
    image: string;
}

interface TradeHistory {
    type: 'buy' | 'sell';
    amount: number;
    price: number;
    timestamp: number;
    user: string;
}

// Mock token data generator
const generateMockToken = (index: number): TokenData => {
    const names = ['BONK', 'WIF', 'POPCAT', 'MOODENG', 'PNUT', 'FWOG', 'GOAT', 'TREMP', 'RETARDIO', 'SLERF'];
    const emojis = ['🐕', '🐶', '🐱', '🦛', '🥜', '🐸', '🐐', '🎺', '🤪', '🦥'];
    const basePrice = Math.random() * 0.001 + 0.00001;
    const priceHistory = Array.from({ length: 50 }, (_, i) =>
        basePrice * (1 + Math.sin(i * 0.3) * 0.5 + Math.random() * 0.3)
    );

    return {
        name: names[index % names.length],
        symbol: names[index % names.length],
        price: priceHistory[priceHistory.length - 1],
        marketCap: Math.random() * 10000000 + 100000,
        supply: 1000000000,
        holders: Math.floor(Math.random() * 10000 + 100),
        priceHistory,
        volume24h: Math.random() * 1000000,
        change24h: (Math.random() - 0.5) * 100,
        creator: `${Math.random().toString(36).substring(2, 6)}...${Math.random().toString(36).substring(2, 6)}`,
        createdAt: Date.now() - Math.random() * 86400000 * 7,
        image: emojis[index % emojis.length]
    };
};

export default function PumpPage() {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [walletBalance, setWalletBalance] = useState(10.5);
    const [tokens, setTokens] = useState<TokenData[]>([]);
    const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
    const [tradeAmount, setTradeAmount] = useState('');
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    const [portfolio, setPortfolio] = useState<{ [key: string]: number }>({});
    const [score, setScore] = useState(0);
    const [trades, setTrades] = useState<TradeHistory[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTokenName, setNewTokenName] = useState('');
    const [newTokenSymbol, setNewTokenSymbol] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initialize tokens
    useEffect(() => {
        const initialTokens = Array.from({ length: 12 }, (_, i) => generateMockToken(i));
        setTokens(initialTokens);
        setSelectedToken(initialTokens[0]);
    }, []);

    // Connect wallet
    const connectWallet = async () => {
        // Check for Phantom
        const phantom = (window as any).phantom?.solana;
        if (phantom?.isPhantom) {
            try {
                const response = await phantom.connect();
                setWalletAddress(response.publicKey.toString());
            } catch (err) {
                console.error('Phantom connection failed:', err);
                // Simulate connection for demo
                setWalletAddress('Demo' + Math.random().toString(36).substring(2, 10));
            }
        } else {
            // Simulate for demo
            setWalletAddress('Demo' + Math.random().toString(36).substring(2, 10));
        }
    };

    // Draw bonding curve chart
    useEffect(() => {
        if (!selectedToken || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const prices = selectedToken.priceHistory;
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const range = maxPrice - minPrice || 1;

        // Clear
        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(0, 0, width, height);

        // Grid
        ctx.strokeStyle = '#1a1a3e';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = (height / 5) * i + 20;
            ctx.beginPath();
            ctx.moveTo(50, y);
            ctx.lineTo(width - 10, y);
            ctx.stroke();
        }

        // Draw bonding curve (exponential)
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 100; i++) {
            const x = 50 + (i / 100) * (width - 60);
            const y = height - 30 - Math.pow(i / 100, 2) * (height - 60);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw price line
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#22c55e');
        gradient.addColorStop(1, selectedToken.change24h >= 0 ? '#22c55e' : '#ef4444');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.beginPath();

        prices.forEach((price, i) => {
            const x = 50 + (i / (prices.length - 1)) * (width - 60);
            const y = height - 30 - ((price - minPrice) / range) * (height - 60);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Fill area under curve
        ctx.lineTo(width - 10, height - 30);
        ctx.lineTo(50, height - 30);
        ctx.closePath();
        const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
        fillGradient.addColorStop(0, selectedToken.change24h >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)');
        fillGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = fillGradient;
        ctx.fill();

        // Current price indicator
        const lastX = width - 10;
        const lastY = height - 30 - ((prices[prices.length - 1] - minPrice) / range) * (height - 60);
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(lastX - 5, lastY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Labels
        ctx.fillStyle = '#9ca3af';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`$${maxPrice.toFixed(8)}`, 45, 30);
        ctx.fillText(`$${minPrice.toFixed(8)}`, 45, height - 35);

    }, [selectedToken]);

    // Simulate price updates
    useEffect(() => {
        const interval = setInterval(() => {
            setTokens(prev => prev.map(token => {
                const change = (Math.random() - 0.5) * 0.1;
                const newPrice = token.price * (1 + change);
                const newHistory = [...token.priceHistory.slice(1), newPrice];
                return {
                    ...token,
                    price: newPrice,
                    priceHistory: newHistory,
                    change24h: token.change24h + change * 10,
                    volume24h: token.volume24h + Math.random() * 1000
                };
            }));

            if (selectedToken) {
                setSelectedToken(prev => {
                    if (!prev) return null;
                    const updated = tokens.find(t => t.symbol === prev.symbol);
                    return updated || prev;
                });
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [tokens, selectedToken]);

    // Handle trade
    const handleTrade = useCallback(() => {
        if (!selectedToken || !tradeAmount || !walletAddress) return;

        const amount = parseFloat(tradeAmount);
        if (isNaN(amount) || amount <= 0) return;

        const totalCost = amount * selectedToken.price;

        if (tradeType === 'buy') {
            if (totalCost > walletBalance) {
                alert('Insufficient SOL balance!');
                return;
            }
            setWalletBalance(prev => prev - totalCost);
            setPortfolio(prev => ({
                ...prev,
                [selectedToken.symbol]: (prev[selectedToken.symbol] || 0) + amount
            }));
            setScore(prev => prev + Math.floor(amount / 1000));
        } else {
            const held = portfolio[selectedToken.symbol] || 0;
            if (amount > held) {
                alert('Insufficient token balance!');
                return;
            }
            setWalletBalance(prev => prev + totalCost);
            setPortfolio(prev => ({
                ...prev,
                [selectedToken.symbol]: prev[selectedToken.symbol] - amount
            }));
            setScore(prev => prev + Math.floor(totalCost * 100));
        }

        // Add to trade history
        setTrades(prev => [{
            type: tradeType,
            amount,
            price: selectedToken.price,
            timestamp: Date.now(),
            user: walletAddress.slice(0, 6) + '...'
        }, ...prev.slice(0, 19)]);

        setTradeAmount('');
    }, [selectedToken, tradeAmount, tradeType, walletBalance, portfolio, walletAddress]);

    // Create new token
    const handleCreateToken = () => {
        if (!newTokenName || !newTokenSymbol) return;

        const newToken: TokenData = {
            name: newTokenName,
            symbol: newTokenSymbol.toUpperCase(),
            price: 0.00001,
            marketCap: 10000,
            supply: 1000000000,
            holders: 1,
            priceHistory: Array.from({ length: 50 }, () => 0.00001 * (1 + Math.random() * 0.1)),
            volume24h: 0,
            change24h: 0,
            creator: walletAddress?.slice(0, 8) || 'anon',
            createdAt: Date.now(),
            image: '🚀'
        };

        setTokens(prev => [newToken, ...prev]);
        setScore(prev => prev + 500);
        setShowCreateModal(false);
        setNewTokenName('');
        setNewTokenSymbol('');
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num.toFixed(2);
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0a0a1a',
            color: '#fff',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 2rem',
                borderBottom: '1px solid #1a1a3e',
                background: 'linear-gradient(180deg, #0f0f23 0%, #0a0a1a 100%)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <a href="/" style={{ color: '#fff', textDecoration: 'none' }}>
                        <span style={{ fontSize: '1.5rem' }}>←</span>
                    </a>
                    <h1 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        background: 'linear-gradient(90deg, #22c55e, #10b981)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        🚀 Rocket Launcher
                    </h1>
                    <span style={{
                        backgroundColor: '#7c3aed',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem'
                    }}>
                        SOLANA DEVNET
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        backgroundColor: '#1a1a3e',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                    }}>
                        🎮 Score: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{score}</span>
                    </div>

                    {walletAddress ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: '#1a1a3e',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem'
                        }}>
                            <span style={{ color: '#9ca3af' }}>◎ {walletBalance.toFixed(4)} SOL</span>
                            <span style={{
                                backgroundColor: '#7c3aed',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem'
                            }}>
                                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                            </span>
                        </div>
                    ) : (
                        <button onClick={connectWallet} style={{
                            background: 'linear-gradient(90deg, #9945FF, #14F195)',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            color: '#fff',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}>
                            👻 Connect Phantom
                        </button>
                    )}
                </div>
            </header>

            <main style={{ display: 'flex', padding: '1rem', gap: '1rem', maxWidth: '1600px', margin: '0 auto' }}>
                {/* Token List */}
                <div style={{
                    width: '300px',
                    backgroundColor: '#0f0f23',
                    borderRadius: '1rem',
                    padding: '1rem',
                    maxHeight: 'calc(100vh - 150px)',
                    overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 'bold' }}>🔥 Trending</h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            style={{
                                backgroundColor: '#22c55e',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                color: '#fff',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            + Create
                        </button>
                    </div>

                    {tokens.map((token, i) => (
                        <div
                            key={token.symbol + i}
                            onClick={() => setSelectedToken(token)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                marginBottom: '0.5rem',
                                backgroundColor: selectedToken?.symbol === token.symbol ? '#1a1a3e' : 'transparent',
                                border: selectedToken?.symbol === token.symbol ? '1px solid #7c3aed' : '1px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>{token.image}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold' }}>${token.symbol}</div>
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                    MC: ${formatNumber(token.marketCap)}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.875rem' }}>${token.price.toFixed(8)}</div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: token.change24h >= 0 ? '#22c55e' : '#ef4444'
                                }}>
                                    {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chart and Trade */}
                <div style={{ flex: 1 }}>
                    {selectedToken && (
                        <>
                            {/* Token Header */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                marginBottom: '1rem',
                                padding: '1rem',
                                backgroundColor: '#0f0f23',
                                borderRadius: '1rem'
                            }}>
                                <span style={{ fontSize: '3rem' }}>{selectedToken.image}</span>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                        {selectedToken.name} <span style={{ color: '#9ca3af' }}>${selectedToken.symbol}</span>
                                    </h2>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                        <span style={{ color: '#9ca3af' }}>
                                            Price: <span style={{ color: '#fff' }}>${selectedToken.price.toFixed(8)}</span>
                                        </span>
                                        <span style={{ color: '#9ca3af' }}>
                                            MC: <span style={{ color: '#fff' }}>${formatNumber(selectedToken.marketCap)}</span>
                                        </span>
                                        <span style={{
                                            color: selectedToken.change24h >= 0 ? '#22c55e' : '#ef4444'
                                        }}>
                                            {selectedToken.change24h >= 0 ? '↗' : '↘'} {Math.abs(selectedToken.change24h).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                    <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Your Holdings</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                        {formatNumber(portfolio[selectedToken.symbol] || 0)} {selectedToken.symbol}
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div style={{
                                backgroundColor: '#0f0f23',
                                borderRadius: '1rem',
                                padding: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <h3 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                                    📈 Bonding Curve & Price Chart
                                </h3>
                                <canvas ref={canvasRef} width={600} height={300} style={{ width: '100%', height: 'auto' }} />
                            </div>

                            {/* Trade Panel */}
                            <div style={{
                                display: 'flex',
                                gap: '1rem',
                                backgroundColor: '#0f0f23',
                                borderRadius: '1rem',
                                padding: '1rem'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', marginBottom: '1rem' }}>
                                        <button
                                            onClick={() => setTradeType('buy')}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                border: 'none',
                                                borderRadius: '0.5rem 0 0 0.5rem',
                                                backgroundColor: tradeType === 'buy' ? '#22c55e' : '#1a1a3e',
                                                color: '#fff',
                                                fontWeight: 'bold',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            BUY
                                        </button>
                                        <button
                                            onClick={() => setTradeType('sell')}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                border: 'none',
                                                borderRadius: '0 0.5rem 0.5rem 0',
                                                backgroundColor: tradeType === 'sell' ? '#ef4444' : '#1a1a3e',
                                                color: '#fff',
                                                fontWeight: 'bold',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            SELL
                                        </button>
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
                                            Amount ({selectedToken.symbol})
                                        </label>
                                        <input
                                            type="number"
                                            value={tradeAmount}
                                            onChange={(e) => setTradeAmount(e.target.value)}
                                            placeholder="Enter amount..."
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                backgroundColor: '#1a1a3e',
                                                border: '1px solid #2a2a4e',
                                                borderRadius: '0.5rem',
                                                color: '#fff',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                        {[100000, 500000, 1000000, 5000000].map(amount => (
                                            <button
                                                key={amount}
                                                onClick={() => setTradeAmount(amount.toString())}
                                                style={{
                                                    flex: 1,
                                                    padding: '0.5rem',
                                                    backgroundColor: '#1a1a3e',
                                                    border: 'none',
                                                    borderRadius: '0.25rem',
                                                    color: '#9ca3af',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                {formatNumber(amount)}
                                            </button>
                                        ))}
                                    </div>

                                    {tradeAmount && (
                                        <div style={{
                                            padding: '0.75rem',
                                            backgroundColor: '#1a1a3e',
                                            borderRadius: '0.5rem',
                                            marginBottom: '1rem'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#9ca3af' }}>Total Cost:</span>
                                                <span>◎ {(parseFloat(tradeAmount) * selectedToken.price).toFixed(6)} SOL</span>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleTrade}
                                        disabled={!walletAddress || !tradeAmount}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            backgroundColor: walletAddress ? (tradeType === 'buy' ? '#22c55e' : '#ef4444') : '#4b5563',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            fontSize: '1rem',
                                            cursor: walletAddress ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        {walletAddress ? `${tradeType === 'buy' ? '🛒 Buy' : '💰 Sell'} ${selectedToken.symbol}` : 'Connect Wallet'}
                                    </button>
                                </div>

                                {/* Trade History */}
                                <div style={{ width: '250px' }}>
                                    <h3 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                                        📜 Recent Trades
                                    </h3>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {trades.length === 0 ? (
                                            <div style={{ color: '#4b5563', textAlign: 'center', padding: '2rem' }}>
                                                No trades yet
                                            </div>
                                        ) : (
                                            trades.map((trade, i) => (
                                                <div key={i} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    padding: '0.5rem',
                                                    borderBottom: '1px solid #1a1a3e',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    <span style={{ color: trade.type === 'buy' ? '#22c55e' : '#ef4444' }}>
                                                        {trade.type === 'buy' ? '🟢' : '🔴'} {trade.user}
                                                    </span>
                                                    <span>{formatNumber(trade.amount)}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Create Token Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#0f0f23',
                        borderRadius: '1rem',
                        padding: '2rem',
                        width: '400px',
                        border: '1px solid #7c3aed'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>🚀 Create New Token</h2>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>Token Name</label>
                            <input
                                type="text"
                                value={newTokenName}
                                onChange={(e) => setNewTokenName(e.target.value)}
                                placeholder="e.g., DogeCoin"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: '#1a1a3e',
                                    border: '1px solid #2a2a4e',
                                    borderRadius: '0.5rem',
                                    color: '#fff'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>Symbol</label>
                            <input
                                type="text"
                                value={newTokenSymbol}
                                onChange={(e) => setNewTokenSymbol(e.target.value.toUpperCase())}
                                placeholder="e.g., DOGE"
                                maxLength={10}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: '#1a1a3e',
                                    border: '1px solid #2a2a4e',
                                    borderRadius: '0.5rem',
                                    color: '#fff'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: '#1a1a3e',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    color: '#fff',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateToken}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: 'linear-gradient(90deg, #9945FF, #14F195)',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Create Token
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
