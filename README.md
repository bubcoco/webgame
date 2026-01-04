# Web3 Game Portfolio

A Next.js portfolio site featuring blockchain-integrated games where players can earn tokens.

## 🎮 Games

| Game | Description | Blockchain |
|------|-------------|------------|
| **Super Jump Quest** | Mario-style platformer with coin collection | EVM (Polygon Amoy) |
| **Racing 3D** | Pseudo-3D racing game with obstacles and coins | EVM (Polygon Amoy) |
| **Sonic Rush** | Fast-paced platformer with ring collection | EVM + Solana |
| **Rocket Launcher** | Pump.fun-style token trading simulator | Solana |

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🔧 Environment Variables

Create a `.env` file:

```env
# Blockchain (EVM)
PRIVATE_KEY=your_wallet_private_key
RPC_URL=https://rpc-amoy.polygon.technology
CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address

# Solana (optional)
SOLANA_RPC_URL=https://api.devnet.solana.com
```

## 📦 Project Structure

```
src/
├── app/
│   ├── game/        # Super Jump Quest
│   ├── racing/      # Racing 3D
│   ├── sonic/       # Sonic Rush
│   ├── pump/        # Rocket Launcher
│   └── api/claim/   # Token claim API
├── components/      # Reusable components
└── lib/             # Utilities & contracts
```

## 🌐 Deployment

### GCP Cloud Run (CI/CD)

Automatically deploys on push to `main` via GitHub Actions.

**Required GitHub Secrets:**
- `GCP_PROJECT_ID` - GCP project ID
- `GCP_SA_KEY` - Service account JSON key
- `PRIVATE_KEY` - Wallet private key
- `RPC_URL` - Polygon RPC URL
- `CONTRACT_ADDRESS` - Deployed contract address

### Manual Deploy

```bash
gcloud run deploy profile-app \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated
```

## 🛠 Tech Stack

- **Frontend:** Next.js 15, React, TypeScript, Canvas API
- **Blockchain:** Ethers.js, Solana Web3.js
- **Deployment:** Docker, GCP Cloud Run, GitHub Actions

## 📄 License

MIT
