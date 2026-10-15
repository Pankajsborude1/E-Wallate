// src/utils/wallet.js
import { Wallet } from "ethers";

// Key name used to save the encrypted keystore JSON inside browser localStorage
const STORAGE_KEY = "sepolia_ewallet_encrypted_json";

/**
 * 1. Generates a brand-new random Ethereum wallet with a 12-word recovery phrase.
 * @returns {{ wallet: import("ethers").HDNodeWallet, mnemonic: string, address: string }}
 */
export function generateNewWallet() {
  // Wallet.createRandom() generates cryptographically secure entropy and derives a 12-word phrase
  const wallet = Wallet.createRandom();
  return {
    wallet,
    mnemonic: wallet.mnemonic.phrase,
    address: wallet.address,
  };
}

/**
 * 2. Restores an existing wallet from a 12-word mnemonic recovery phrase.
 * @param {string} phrase - The 12-word space-separated recovery phrase
 * @returns {import("ethers").HDNodeWallet}
 */
export function restoreWalletFromPhrase(phrase) {
  // Clean up extra spaces and normalize to lowercase
  const cleanPhrase = phrase.trim().toLowerCase().replace(/\s+/g, " ");
  const wordCount = cleanPhrase.split(" ").length;

  if (wordCount !== 12) {
    throw new Error("Recovery phrase must contain exactly 12 words.");
  }

  try {
    // Wallet.fromPhrase validates the BIP-39 checksum and derives the wallet keys
    return Wallet.fromPhrase(cleanPhrase);
  } catch {
    throw new Error(
      "Invalid recovery phrase. Please check the spelling and order of your words."
    );
  }
}

/**
 * 3. Encrypts a wallet instance with a user password and saves the encrypted JSON to localStorage.
 * Never saves the raw private key or mnemonic in plain text.
 * @param {import("ethers").HDNodeWallet | import("ethers").Wallet} wallet
 * @param {string} password
 */
export async function encryptAndSaveWallet(wallet, password) {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  // wallet.encrypt() uses standard Web3 Keystore encryption (scrypt + AES-128-CTR)
  const encryptedJson = await wallet.encrypt(password);
  localStorage.setItem(STORAGE_KEY, encryptedJson);
}

/**
 * 4. Unlocks the encrypted wallet from localStorage using the user's password.
 * @param {string} password
 * @returns {Promise<import("ethers").Wallet | import("ethers").HDNodeWallet>}
 */
export async function unlockSavedWallet(password) {
  const encryptedJson = localStorage.getItem(STORAGE_KEY);
  if (!encryptedJson) {
    throw new Error("No encrypted wallet found in this browser.");
  }

  try {
    // Decrypts the JSON keystore back into an in-memory ethers Wallet object
    const decryptedWallet = await Wallet.fromEncryptedJson(encryptedJson, password);
    return decryptedWallet;
  } catch {
    throw new Error("Incorrect password. Could not decrypt the wallet.");
  }
}

/**
 * 5. Checks if an encrypted wallet is already stored in localStorage.
 * @returns {boolean}
 */
export function hasSavedWallet() {
  return Boolean(localStorage.getItem(STORAGE_KEY));
}

/**
 * 6. Permanently removes the encrypted wallet from localStorage (used when resetting wallet).
 */
export function deleteSavedWallet() {
  localStorage.removeItem(STORAGE_KEY);
}
