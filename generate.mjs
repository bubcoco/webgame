import { ethers } from 'ethers';

// Copied from your file
function generateSessionId(playerAddress, score, timestamp) {
  const data = ethers.solidityPacked(
    ['address', 'uint256', 'uint256'],
    [playerAddress, score, timestamp]
  );
  return ethers.keccak256(data);
}

// --- CONFIGURE YOUR TEST DATA HERE ---
const PLAYER_ADDRESS = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"; // Use any test address
const SCORE = 150; // Use any test score
const TIMESTAMP = Date.now(); // Use a fresh timestamp for each test

// --- GENERATE VALUES ---
const SESSION_ID = generateSessionId(PLAYER_ADDRESS, SCORE, TIMESTAMP);

console.log("--- Copy this JSON into your Postman Body ---");
console.log(JSON.stringify({
  playerAddress: PLAYER_ADDRESS,
  score: SCORE,
  sessionId: SESSION_ID,
  timestamp: TIMESTAMP
}, null, 2));