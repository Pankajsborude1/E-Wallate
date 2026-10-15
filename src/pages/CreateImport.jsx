// src/pages/CreateImport.jsx
import React, { useState } from "react";
import {
  generateNewWallet,
  restoreWalletFromPhrase,
  encryptAndSaveWallet,
  unlockSavedWallet,
  hasSavedWallet,
  deleteSavedWallet,
} from "../utils/wallet";

export default function CreateImport({ onWalletUnlocked }) {
  // Determine initial mode based on whether an encrypted wallet exists in localStorage
  const [mode, setMode] = useState(hasSavedWallet() ? "unlock" : "create");

  // State for creating a new wallet
  const [generatedData, setGeneratedData] = useState(null);
  const [savedPhraseConfirmed, setSavedPhraseConfirmed] = useState(false);

  // State for importing a wallet
  const [importPhrase, setImportPhrase] = useState("");

  // Password states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 of Create Wallet: Generate random wallet and show 12-word phrase
  const handleGenerateWallet = () => {
    setError("");
    const result = generateNewWallet();
    setGeneratedData(result);
    setSavedPhraseConfirmed(false);
  };

  // Step 2 of Create Wallet: Encrypt with password and save to localStorage
  const handleSaveCreatedWallet = async (e) => {
    e.preventDefault();
    setError("");

    if (!savedPhraseConfirmed) {
      setError("Please confirm that you have written down your 12-word recovery phrase.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      await encryptAndSaveWallet(generatedData.wallet, password);

      // Pass decrypted wallet into React state in App.jsx and wipe local temporary state
      const unlockedWallet = generatedData.wallet;
      setGeneratedData(null);
      setPassword("");
      setConfirmPassword("");
      onWalletUnlocked(unlockedWallet);
    } catch (err) {
      setError(err.message || "Failed to encrypt wallet.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle importing wallet via 12-word recovery phrase + encrypting with password
  const handleImportWallet = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);

      // Validate 12-word phrase and derive wallet
      const restoredWallet = restoreWalletFromPhrase(importPhrase);

      // Encrypt and save to localStorage
      await encryptAndSaveWallet(restoredWallet, password);

      setImportPhrase("");
      setPassword("");
      setConfirmPassword("");
      onWalletUnlocked(restoredWallet);
    } catch (err) {
      setError(err.message || "Failed to import wallet.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle unlocking an already-encrypted wallet from localStorage
  const handleUnlock = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setIsLoading(true);
      const decryptedWallet = await unlockSavedWallet(password);
      setPassword("");
      onWalletUnlocked(decryptedWallet);
    } catch (err) {
      setError(err.message || "Failed to unlock wallet.");
    } finally {
      setIsLoading(false);
    }
  };

  // Allows resetting stored wallet if the user wants to import or create a different one
  const handleResetSavedWallet = () => {
    if (
      window.confirm(
        "Are you sure you want to remove the encrypted wallet from this browser? Make sure you have your 12-word recovery phrase backed up!"
      )
    ) {
      deleteSavedWallet();
      setMode("create");
      setError("");
    }
  };

  return (
    <div className="auth-container">
      {/* Mode Switcher Tabs */}
      <div className="auth-tabs" role="tablist" aria-label="Wallet Modes">
        {hasSavedWallet() && (
          <button
            id="tab-unlock"
            role="tab"
            aria-selected={mode === "unlock"}
            className={`tab-btn ${mode === "unlock" ? "active" : ""}`}
            onClick={() => {
              setMode("unlock");
              setError("");
            }}
          >
            Unlock Saved Wallet
          </button>
        )}
        <button
          id="tab-create"
          role="tab"
          aria-selected={mode === "create"}
          className={`tab-btn ${mode === "create" ? "active" : ""}`}
          onClick={() => {
            setMode("create");
            setError("");
          }}
        >
          Create New Wallet
        </button>
        <button
          id="tab-import"
          role="tab"
          aria-selected={mode === "import"}
          className={`tab-btn ${mode === "import" ? "active" : ""}`}
          onClick={() => {
            setMode("import");
            setError("");
          }}
        >
          Import Wallet
        </button>
      </div>

      {/* MODE 1: UNLOCK EXISTING WALLET */}
      {mode === "unlock" && (
        <div className="card">
          <h2>Unlock Your Wallet</h2>
          <p className="subtitle">
            Enter your password to decrypt your wallet stored in this browser.
          </p>

          <form onSubmit={handleUnlock} className="form-stack">
            <div className="form-group">
              <label className="field-label" htmlFor="unlock-password-input">Wallet Password</label>
              <input
                id="unlock-password-input"
                type="password"
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <button
              id="unlock-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Decrypting Keystore (Please wait)..." : "Unlock Wallet"}
            </button>
          </form>

          {isLoading && (
            <div className="spinner-box">
              <div className="spinner"></div>
              <p>Running scrypt key derivation to decrypt wallet...</p>
            </div>
          )}

          <div className="reset-link-box">
            <button
              id="reset-keystore-btn"
              type="button"
              className="btn-link"
              onClick={handleResetSavedWallet}
              disabled={isLoading}
            >
              Forgot password? Reset & restore using 12-word phrase
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: CREATE NEW WALLET */}
      {mode === "create" && (
        <div className="card">
          <h2>Create a New Sepolia Wallet</h2>
          <p className="subtitle">
            Generate a non-custodial Ethereum wallet with a 12-word recovery phrase.
          </p>

          {!generatedData ? (
            <button
              id="generate-wallet-btn"
              type="button"
              className="btn btn-primary"
              onClick={handleGenerateWallet}
            >
              + Generate New Wallet
            </button>
          ) : (
            <form onSubmit={handleSaveCreatedWallet} className="form-stack">
              <div className="form-group">
                <label className="field-label">Your New Wallet Address</label>
                <code className="address-display">{generatedData.address}</code>
              </div>

              <div className="alert alert-warning" role="alert">
                <strong>⚠️ IMPORTANT SECURITY WARNING:</strong> Write down these 12 words in
                exact order and keep them safe offline. Anyone with this phrase can access
                your funds. We never store this phrase on any server!
              </div>

              {/* 12-Word Grid */}
              <div className="mnemonic-grid" aria-label="12-word secret recovery phrase">
                {generatedData.mnemonic.split(" ").map((word, index) => (
                  <div key={index} className="mnemonic-word">
                    <span className="word-index">{index + 1}.</span> {word}
                  </div>
                ))}
              </div>

              <label className="checkbox-label" htmlFor="phrase-confirm-checkbox">
                <input
                  id="phrase-confirm-checkbox"
                  type="checkbox"
                  checked={savedPhraseConfirmed}
                  onChange={(e) => setSavedPhraseConfirmed(e.target.checked)}
                />
                <span>I have safely written down my 12-word recovery phrase.</span>
              </label>

              <hr className="divider" />

              <h3>Protect Wallet with a Password</h3>
              <p className="subtitle">
                Your wallet will be encrypted with this password using{" "}
                <code>wallet.encrypt()</code> before saving to browser storage.
              </p>

              <div className="form-group">
                <label className="field-label" htmlFor="create-password-input">Set Password (min 6 characters)</label>
                <input
                  id="create-password-input"
                  type="password"
                  className="input-field"
                  placeholder="Enter strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="field-label" htmlFor="create-confirm-password-input">Confirm Password</label>
                <input
                  id="create-confirm-password-input"
                  type="password"
                  className="input-field"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <button
                id="create-encrypt-save-btn"
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Encrypting Wallet (Wait ~3s)..." : "Encrypt & Open Wallet"}
              </button>
            </form>
          )}

          {isLoading && (
            <div className="spinner-box">
              <div className="spinner"></div>
              <p>Encrypting wallet using AES-128-CTR & scrypt...</p>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: IMPORT EXISTING WALLET */}
      {mode === "import" && (
        <div className="card">
          <h2>Import Wallet from Recovery Phrase</h2>
          <p className="subtitle">
            Restore your existing wallet using your 12-word secret recovery phrase.
          </p>

          <form onSubmit={handleImportWallet} className="form-stack">
            <div className="form-group">
              <label className="field-label" htmlFor="import-phrase-textarea">12-Word Recovery Phrase</label>
              <textarea
                id="import-phrase-textarea"
                rows="3"
                className="input-field"
                placeholder="Enter your 12 words separated by single spaces..."
                value={importPhrase}
                onChange={(e) => setImportPhrase(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label className="field-label" htmlFor="import-password-input">New Wallet Password (min 6 characters)</label>
              <input
                id="import-password-input"
                type="password"
                className="input-field"
                placeholder="Create a password to encrypt this wallet"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label className="field-label" htmlFor="import-confirm-password-input">Confirm Password</label>
              <input
                id="import-confirm-password-input"
                type="password"
                className="input-field"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <button
              id="import-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Restoring & Encrypting..." : "Import & Encrypt Wallet"}
            </button>
          </form>

          {isLoading && (
            <div className="spinner-box">
              <div className="spinner"></div>
              <p>Validating phrase and encrypting keystore...</p>
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && <div className="alert alert-error" role="alert">{error}</div>}
    </div>
  );
}
