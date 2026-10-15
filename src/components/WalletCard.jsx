// src/components/WalletCard.jsx
import React, { useState } from "react";

export default function WalletCard({ address, balance, isLoadingBalance, onRefresh, error }) {
  const [copied, setCopied] = useState(false);

  // Copies the wallet address to the user's clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to copy address.");
    }
  };

  return (
    <div className="card wallet-card">
      <div className="card-header-row">
        <h2>Wallet Overview</h2>
        <span className="network-pill">Sepolia ETH</span>
      </div>

      {/* Wallet Address Box */}
      <div className="address-section">
        <label className="field-label" htmlFor="wallet-address-display">Your Public Wallet Address</label>
        <div className="address-box" id="wallet-address-display">
          <code className="address-text">{address}</code>
          <button
            id="copy-address-btn"
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
            type="button"
          >
            {copied ? "✓ Copied!" : "Copy Address"}
          </button>
        </div>
      </div>

      {/* Live ETH Balance Box */}
      <div className="balance-section">
        <label className="field-label">Available Balance</label>
        <div className="balance-row">
          {isLoadingBalance ? (
            <div className="spinner-inline">
              <div className="spinner"></div>
              <span>Fetching live balance...</span>
            </div>
          ) : (
            <div className="balance-amount" id="eth-balance-display">
              {Number(balance).toFixed(6)} <span className="currency">SepoliaETH</span>
            </div>
          )}

          <button
            id="refresh-balance-btn"
            className="btn btn-outline btn-sm"
            onClick={onRefresh}
            disabled={isLoadingBalance}
            type="button"
          >
            ↻ Refresh Balance
          </button>
        </div>
      </div>

      {/* Error Message if RPC fails */}
      {error && <div className="alert alert-error" role="alert">{error}</div>}
    </div>
  );
}
