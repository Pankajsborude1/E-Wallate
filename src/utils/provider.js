// src/utils/provider.js
import { JsonRpcProvider, formatEther } from "ethers";

// Read the RPC URL from the Vite environment variable (.env file)
const RPC_URL = import.meta.env.VITE_RPC_URL;

/**
 * Returns an ethers v6 JsonRpcProvider connected to the Sepolia testnet.
 */
export function getProvider() {
  if (!RPC_URL || RPC_URL.includes("YOUR_ALCHEMY_API_KEY")) {
    throw new Error(
      "Missing or invalid VITE_RPC_URL in .env file. Please add your Alchemy Sepolia RPC URL."
    );
  }
  // Create and return the connection object to the blockchain node
  return new JsonRpcProvider(RPC_URL);
}

/**
 * Fetches the live ETH balance for a given wallet address.
 * @param {string} address - The Ethereum wallet address (0x...)
 * @returns {Promise<string>} - The balance converted from Wei to ETH
 */
export async function getEthBalance(address) {
  const provider = getProvider();
  // getBalance returns the balance in Wei as a BigInt (1 ETH = 10^18 Wei)
  const balanceInWei = await provider.getBalance(address);
  // formatEther converts Wei (BigInt) into a human-readable ETH string
  return formatEther(balanceInWei);
}
