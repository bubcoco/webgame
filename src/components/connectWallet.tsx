"use client";
import React, { useState } from "react";
import { ethers } from "ethers";

const ConnectWallet: React.FC = () => {
    const [account, setAccount] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const connectWallet = async () => {
        setError(null);
        if (typeof window.ethereum === "undefined") {
            setError("MetaMask is not installed");
            return;
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setAccount(address);
        } catch (err: any) {
            setError(err.message || "Failed to connect wallet");
        }
    };

    return (
        <div style={{ marginTop: "1.5rem" }}>
            <button
                onClick={connectWallet}
                style={{
                    
                    background: "linear-gradient(to right, #06b6d4, #a855f7)",
                    color: "white",
                    fontWeight: "600",
                    padding: "0.75rem 2rem",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 0 30px rgba(6, 182, 212, 0.5)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                }}
            >
                {" "}
                {account ? "Connected" : "Connect MetaMask Wallet"}
            </button>
            {account && <div style={{
            color: '#22d3ee'}}>Account: {account}</div>}
            {error && <div style={{ color: "red" }}>{error}</div>}
        </div>
    );
};

export default ConnectWallet;
