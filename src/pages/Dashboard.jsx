// src/pages/Dashboard.jsx
import React from "react";
import WalletCard from "../components/WalletCard";

export default function Dashboard({
  wallet,
  balance,
  isLoadingBalance,
  onRefreshBalance,
  balanceError,
  setCurrentPage,
}) {
  return (
    <div className="page-container">
      <WalletCard
        address={wallet.address}
        balance={balance}
        isLoadingBalance={isLoadingBalance}
        onRefresh={onRefreshBalance}
        error={balanceError}
      />

      {/* Quick Action Cards */}
      <div className="quick-actions-grid" role="region" aria-label="Quick Actions">
        <button
          id="action-send"
          type="button"
          className="action-card"
          onClick={() => setCurrentPage("send")}
        >
          <span className="action-icon">↗</span>
          <div>
            <h3>Send ETH</h3>
            <p>Transfer Sepolia ETH to another address</p>
          </div>
        </button>

        <button
          id="action-receive"
          type="button"
          className="action-card"
          onClick={() => setCurrentPage("receive")}
        >
          <span className="action-icon">↙</span>
          <div>
            <h3>Receive ETH</h3>
            <p>Show QR code & copy your wallet address</p>
          </div>
        </button>

        <button
          id="action-history"
          type="button"
          className="action-card"
          onClick={() => setCurrentPage("history")}
        >
          <span className="action-icon">☰</span>
          <div>
            <h3>Transaction History</h3>
            <p>View your last 10 Sepolia transactions</p>
          </div>
        </button>
      </div>
    </div>
  );
}
