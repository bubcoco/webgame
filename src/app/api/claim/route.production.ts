// import { NextRequest, NextResponse } from "next/server";
// import { ethers } from "ethers";
// import { prisma } from "@/lib/db";
// import { checkRateLimit } from "@/lib/rateLimit";
// import { validateClaimRequest } from "@/lib/validators";
// import { logClaim } from "@/lib/logger";
// import * as Sentry from "@sentry/nextjs";

// const PRIVATE_KEY = process.env.GAME_ADMIN_PRIVATE_KEY!;
// const RPC_URL = process.env.RPC_URL!;
// const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;

// const contractABI = [
//   "function mintReward(address player, uint256 coinsCollected, bytes32 sessionId) external",
//   "function claimedSessions(bytes32) view returns (bool)"
// ];

// export async function POST(req: NextRequest) {
//   const startTime = Date.now();
  
//   try {
//     // Parse and validate request
//     const body = await req.json();
//     const validation = validateClaimRequest(body);
    
//     if (!validation.success) {
//       return NextResponse.json(
//         { error: 'Invalid input', details: validation.error.errors },
//         { status: 400 }
//       );
//     }
    
//     const { playerAddress, score, sessionId, timestamp } = validation.data;
    
//     // Check rate limit (Redis)
//     const rateLimit = await checkRateLimit(playerAddress);
//     if (!rateLimit.allowed) {
//       await logClaim({ playerAddress, score, success: false, error: 'Rate limit exceeded' });
//       return NextResponse.json(
//         { error: 'Rate limit exceeded', retryAfter: rateLimit.resetTime },
//         { status: 429 }
//       );
//     }
    
//     // Check if session already claimed (Database)
//     const existingClaim = await prisma.claim.findUnique({
//       where: { sessionId }
//     });
    
//     if (existingClaim) {
//       return NextResponse.json(
//         { error: 'Session already claimed' },
//         { status: 400 }
//       );
//     }
    
//     // Verify timestamp (prevent replay attacks)
//     const timeDiff = Date.now() - timestamp;
//     if (timeDiff > 5 * 60 * 1000) {
//       return NextResponse.json(
//         { error: 'Session expired' },
//         { status: 400 }
//       );
//     }
    
//     // Get or create user
//     let user = await prisma.user.findUnique({
//       where: { walletAddress: playerAddress }
//     });
    
//     if (!user) {
//       user = await prisma.user.create({
//         data: { walletAddress: playerAddress }
//       });
//     }
    
//     // Connect to blockchain
//     const provider = new ethers.JsonRpcProvider(RPC_URL);
//     const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
//     const