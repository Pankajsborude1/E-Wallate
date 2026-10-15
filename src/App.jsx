// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import CreateImport from "./pages/CreateImport";
import Dashboard from "./pages/Dashboard";
import Send from "./pages/Send";
import Receive from "./pages/Receive";
import History from "./pages/History";
import { getEthBalance } from "./utils/provider";
import "./App.css";

export default function App() {
  // SECURITY RULE: Keep the decrypted wallet strictly in React state (memory only)
  const [wallet, setWallet] = useState(null);
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Live ETH balance state
  const [balance, setBalance] = useState("0.0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState("");

  // Fetch live ETH balance from Sepolia RPC whenever wallet is unlocked or refreshed
  const fetchBalance = useCallback(async () => {
    if (!wallet?.address) return;
    setBalanceError("");

    try {
      setIsLoadingBalance(true);
      const ethBalance = await getEthBalance(wallet.address);
      setBalance(ethBalance);
    } catch (err) {
      setBalanceError(err.message || "Could not fetch balance from Sepolia RPC.");
    } finally {
      setIsLoadingBalance(false);
    }
  }, [wallet]);

  useEffect(() => {
    if (wallet) {
      fetchBalance();
    }
  }, [wallet, fetchBalance]);

  // Called when user unlocks, creates, or imports a wallet
  const handleWalletUnlocked = (unlockedWallet) => {
    setWallet(unlockedWallet);
    setCurrentPage("dashboard");
  };

  // Clears the decrypted wallet session from memory (localStorage encrypted JSON remains intact)
  const handleLogout = () => {
    setWallet(null);
    setBalance("0.0");
    setCurrentPage("dashboard");
  };

  return (
    <div className="app-wrapper">
      {/* Top Navbar with Sepolia Testnet Badge */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
        isUnlocked={Boolean(wallet)}
      />

      {/* Educational Disclaimer Banner */}
      <div className="edu-banner" role="banner">
        🎓 <strong>Educational Project Notice:</strong> This wallet is for educational and
        academic purposes only. It runs exclusively on the{" "}
        <strong>Ethereum Sepolia Testnet</strong> (test ETH has no real-world monetary value).
      </div>

      {/* Main Content Area */}
      <main className="main-content" id="main-content">
        {!wallet ? (
          <CreateImport onWalletUnlocked={handleWalletUnlocked} />
        ) : (
          <>
            {currentPage === "dashboard" && (
              <Dashboard
                wallet={wallet}
                balance={balance}
                isLoadingBalance={isLoadingBalance}
                onRefreshBalance={fetchBalance}
                balanceError={balanceError}
                setCurrentPage={setCurrentPage}
              />
            )}
            {currentPage === "send" && (
              <Send wallet={wallet} balance={balance} onTxSuccess={fetchBalance} />
            )}
            {currentPage === "receive" && <Receive wallet={wallet} />}
            {currentPage === "history" && <History wallet={wallet} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <span>Sepolia Non-Custodial E-Wallet • Built with React + ethers.js v6</span>
        <span className="network-badge-sm">Sepolia Testnet (Chain ID: 11155111)</span>
      </footer>
    </div>
  );
}
