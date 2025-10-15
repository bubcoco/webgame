import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// API endpoint: /api/claim?address=0x123&score=50
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  const score = searchParams.get("score");

  if (!address || !score) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  try {
    // Example: create message to sign (address + score)
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint256"],
      [address, score]
    );

    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    return NextResponse.json({
      address,
      score,
      signature,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
