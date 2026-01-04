use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("GameRwrdPrgm11111111111111111111111111111111");

#[program]
pub mod game_rewards {
    use super::*;

    /// Initialize the reward token and game config
    pub fn initialize_game(
        ctx: Context<InitializeGame>,
        game_name: String,
        reward_symbol: String,
        decimals: u8,
    ) -> Result<()> {
        let game_config = &mut ctx.accounts.game_config;
        game_config.authority = ctx.accounts.authority.key();
        game_config.mint = ctx.accounts.mint.key();
        game_config.game_name = game_name.clone();
        game_config.reward_symbol = reward_symbol.clone();
        game_config.decimals = decimals;
        game_config.total_rewards_distributed = 0;
        game_config.total_claims = 0;
        game_config.bump = ctx.bumps.game_config;

        msg!("Game initialized: {}", game_name);
        msg!("Reward token: {} ({})", game_name, reward_symbol);
        msg!("Mint address: {}", ctx.accounts.mint.key());

        Ok(())
    }

    /// Claim game rewards - mints tokens to player based on score
    pub fn claim_reward(
        ctx: Context<ClaimReward>,
        score: u64,
        session_id: [u8; 32],
    ) -> Result<()> {
        let game_config = &ctx.accounts.game_config;
        let claim_record = &mut ctx.accounts.claim_record;

        // Verify authority
        require!(
            game_config.authority == ctx.accounts.authority.key(),
            GameError::UnauthorizedClaim
        );

        // Verify session not already claimed
        require!(
            !claim_record.is_claimed,
            GameError::SessionAlreadyClaimed
        );

        // Calculate tokens: score / 100 (same as EVM contract)
        let tokens_to_mint = score / 100;
        require!(tokens_to_mint > 0, GameError::InvalidScore);

        // Mint with decimals
        let mint_amount = tokens_to_mint
            .checked_mul(10u64.pow(game_config.decimals as u32))
            .ok_or(GameError::Overflow)?;

        // Create PDA signer seeds
        let mint_key = ctx.accounts.mint.key();
        let seeds = &[
            b"game-config",
            mint_key.as_ref(),
            &[game_config.bump],
        ];
        let signer = &[&seeds[..]];

        // Mint tokens to player
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.player_token_account.to_account_info(),
            authority: ctx.accounts.game_config.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::mint_to(cpi_ctx, mint_amount)?;

        // Record claim
        claim_record.player = ctx.accounts.player.key();
        claim_record.session_id = session_id;
        claim_record.score = score;
        claim_record.tokens_claimed = tokens_to_mint;
        claim_record.timestamp = Clock::get()?.unix_timestamp;
        claim_record.is_claimed = true;

        // Update game stats
        let game_config = &mut ctx.accounts.game_config;
        game_config.total_rewards_distributed += tokens_to_mint;
        game_config.total_claims += 1;

        msg!("Claimed {} tokens for score {}", tokens_to_mint, score);
        msg!("Player: {}", ctx.accounts.player.key());

        Ok(())
    }

    /// Add a new game admin (authority that can call claim_reward)
    pub fn add_admin(
        ctx: Context<ManageAdmin>,
        new_admin: Pubkey,
    ) -> Result<()> {
        let game_config = &mut ctx.accounts.game_config;
        
        require!(
            game_config.authority == ctx.accounts.authority.key(),
            GameError::UnauthorizedAdmin
        );

        // Store admin (simplified - in production use a list)
        game_config.authority = new_admin;
        
        msg!("Admin updated to: {}", new_admin);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(game_name: String)]
pub struct InitializeGame<'info> {
    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = game_config,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        space = 8 + GameConfig::SPACE,
        seeds = [b"game-config", mint.key().as_ref()],
        bump
    )]
    pub game_config: Account<'info, GameConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(score: u64, session_id: [u8; 32])]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"game-config", mint.key().as_ref()],
        bump = game_config.bump,
    )]
    pub game_config: Account<'info, GameConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + ClaimRecord::SPACE,
        seeds = [b"claim", session_id.as_ref()],
        bump
    )]
    pub claim_record: Account<'info, ClaimRecord>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = player,
    )]
    pub player_token_account: Account<'info, TokenAccount>,

    /// CHECK: The player receiving tokens
    pub player: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManageAdmin<'info> {
    #[account(
        mut,
        seeds = [b"game-config", mint.key().as_ref()],
        bump = game_config.bump,
    )]
    pub game_config: Account<'info, GameConfig>,

    pub mint: Account<'info, Mint>,

    pub authority: Signer<'info>,
}

#[account]
pub struct GameConfig {
    pub authority: Pubkey,           // 32
    pub mint: Pubkey,                // 32
    pub game_name: String,           // 4 + 32
    pub reward_symbol: String,       // 4 + 10
    pub decimals: u8,                // 1
    pub total_rewards_distributed: u64, // 8
    pub total_claims: u64,           // 8
    pub bump: u8,                    // 1
}

impl GameConfig {
    pub const SPACE: usize = 32 + 32 + (4 + 32) + (4 + 10) + 1 + 8 + 8 + 1;
}

#[account]
pub struct ClaimRecord {
    pub player: Pubkey,              // 32
    pub session_id: [u8; 32],        // 32
    pub score: u64,                  // 8
    pub tokens_claimed: u64,         // 8
    pub timestamp: i64,              // 8
    pub is_claimed: bool,            // 1
}

impl ClaimRecord {
    pub const SPACE: usize = 32 + 32 + 8 + 8 + 8 + 1;
}

#[error_code]
pub enum GameError {
    #[msg("Unauthorized: Only game authority can claim rewards")]
    UnauthorizedClaim,
    #[msg("This game session has already been claimed")]
    SessionAlreadyClaimed,
    #[msg("Invalid score: must result in at least 1 token")]
    InvalidScore,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Unauthorized: Only owner can manage admins")]
    UnauthorizedAdmin,
}
