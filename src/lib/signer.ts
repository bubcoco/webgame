import { ethers } from 'ethers';

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
    throw new Error('PRIVATE_KEY is not set in environment variables');
}

export const signer = new ethers.Wallet(privateKey);