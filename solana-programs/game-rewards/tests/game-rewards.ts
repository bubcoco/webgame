import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GameRewards } from "../target/types/game_rewards";
import { 
  Keypair, 
  PublicKey, 
  SystemProgram, 
  SYSVAR_RENT_PUBKEY 
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress 
} from "@solana/spl-token";
import { expect } from "chai";
import crypto from "crypto";

describe("game-rewards", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GameRewards as Program<GameRewards>;
  
  let mint: Keypair;
  let gameConfigPda: PublicKey;
  let gameConfigBump: number;
  
  const gameName = "Sonic Rush";
  const rewardSymbol = "SONIC";

  before(async () => {
    mint = Keypair.generate();
    
    [gameConfigPda, gameConfigBump] = await PublicKey.findProgramAddress(
      [Buffer.from("game-config"), mint.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Initializes the game reward system", async () => {
    await program.methods
      .initializeGame(gameName, rewardSymbol, 9)
      .accounts({
        mint: mint.publicKey,
        gameConfig: gameConfigPda,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([mint])
      .rpc();

    const gameConfig = await program.account.gameConfig.fetch(gameConfigPda);
    
    expect(gameConfig.gameName).to.equal(gameName);
    expect(gameConfig.rewardSymbol).to.equal(rewardSymbol);
    expect(gameConfig.decimals).to.equal(9);
    expect(gameConfig.totalRewardsDistributed.toNumber()).to.equal(0);
    expect(gameConfig.totalClaims.toNumber()).to.equal(0);
  });

  it("Claims rewards for a game score", async () => {
    const player = Keypair.generate();
    const score = 500; // Should give 5 tokens (500/100)
    
    // Generate session ID
    const sessionId = crypto.randomBytes(32);
    
    // Find claim record PDA
    const [claimRecordPda] = await PublicKey.findProgramAddress(
      [Buffer.from("claim"), sessionId],
      program.programId
    );
    
    // Get player's associated token account
    const playerTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      player.publicKey
    );

    await program.methods
      .claimReward(new anchor.BN(score), Array.from(sessionId))
      .accounts({
        mint: mint.publicKey,
        gameConfig: gameConfigPda,
        claimRecord: claimRecordPda,
        playerTokenAccount: playerTokenAccount,
        player: player.publicKey,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Verify claim record
    const claimRecord = await program.account.claimRecord.fetch(claimRecordPda);
    expect(claimRecord.isClaimed).to.be.true;
    expect(claimRecord.score.toNumber()).to.equal(score);
    expect(claimRecord.tokensClaimed.toNumber()).to.equal(5);

    // Verify game config updated
    const gameConfig = await program.account.gameConfig.fetch(gameConfigPda);
    expect(gameConfig.totalRewardsDistributed.toNumber()).to.equal(5);
    expect(gameConfig.totalClaims.toNumber()).to.equal(1);
  });

  it("Prevents double claiming the same session", async () => {
    const player = Keypair.generate();
    const score = 300;
    
    const sessionId = crypto.randomBytes(32);
    
    const [claimRecordPda] = await PublicKey.findProgramAddress(
      [Buffer.from("claim"), sessionId],
      program.programId
    );
    
    const playerTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      player.publicKey
    );

    // First claim
    await program.methods
      .claimReward(new anchor.BN(score), Array.from(sessionId))
      .accounts({
        mint: mint.publicKey,
        gameConfig: gameConfigPda,
        claimRecord: claimRecordPda,
        playerTokenAccount: playerTokenAccount,
        player: player.publicKey,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Second claim should fail (PDA already initialized)
    try {
      await program.methods
        .claimReward(new anchor.BN(score), Array.from(sessionId))
        .accounts({
          mint: mint.publicKey,
          gameConfig: gameConfigPda,
          claimRecord: claimRecordPda,
          playerTokenAccount: playerTokenAccount,
          player: player.publicKey,
          authority: provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      expect.fail("Should have thrown error for double claim");
    } catch (error) {
      expect(error.message).to.include("already in use");
    }
  });

  it("Rejects claims with zero tokens", async () => {
    const player = Keypair.generate();
    const score = 50; // Only 0.5 tokens, should be rejected
    
    const sessionId = crypto.randomBytes(32);
    
    const [claimRecordPda] = await PublicKey.findProgramAddress(
      [Buffer.from("claim"), sessionId],
      program.programId
    );
    
    const playerTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      player.publicKey
    );

    try {
      await program.methods
        .claimReward(new anchor.BN(score), Array.from(sessionId))
        .accounts({
          mint: mint.publicKey,
          gameConfig: gameConfigPda,
          claimRecord: claimRecordPda,
          playerTokenAccount: playerTokenAccount,
          player: player.publicKey,
          authority: provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      expect.fail("Should have rejected score resulting in 0 tokens");
    } catch (error) {
      expect(error.message).to.include("Invalid score");
    }
  });
});
