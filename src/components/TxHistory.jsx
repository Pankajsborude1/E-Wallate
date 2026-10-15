// src/components/TxHistory.jsx
import React, { useEffect, useState, useCallback } from "react";
import { formatEther } from "ethers";

export default function TxHistory({ address }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY;

  // Helper to shorten long 0x addresses and hashes for the table
  const shortenHex = (hex) => {
    if (!hex) return "Contract Creation";
    return `${hex.slice(0, 6)}...${hex.slice(-4)}`;
  };

  const fetchHistory = useCallback(async () => {
    setError("");

    if (!apiKey || apiKey.includes("YOUR_ETHERSCAN_API_KEY")) {
      setError(
        "Missing VITE_ETHERSCAN_API_KEY in .env file. Add your free Etherscan API key to view transaction history."
      );
      return;
    }

    try {
      setIsLoading(true);

      // Etherscan API V2 endpoint for Sepolia (chainid = 11155111), fetching the last 10 transactions
      const url = `https://api.etherscan.io/v2/api?chainid=11155111&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "1" && Array.isArray(data.result)) {
        setTransactions(data.result);
      } else if (data.message === "No transactions found") {
        setTransactions([]);
      } else {
        setError(data.result || data.message || "Could not fetch transactions from Etherscan.");
      }
    } catch {
      setError("Network error while connecting to Etherscan API.");
    } finally {
      setIsLoading(false);
    }
  }, [address, apiKey]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="card">
      <div className="card-header-row">
        <h2>Last 10 Transactions</h2>
        <button
          id="refresh-history-btn"
          className="btn btn-outline btn-sm"
          onClick={fetchHistory}
          disabled={isLoading}
          type="button"
        >
          ↻ Refresh
        </button>
      </div>

      {isLoading && (
        <div className="spinner-box">
          <div className="spinner"></div>
          <p>Loading transaction history from Etherscan...</p>
        </div>
      )}

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {!isLoading && !error && transactions.length === 0 && (
        <p className="empty-state">No transactions found for this address on Sepolia yet.</p>
      )}

      {!isLoading && transactions.length > 0 && (
        <div className="table-responsive">
          <table className="tx-table">
            <thead>
              <tr>
                <th scope="col">Tx Hash</th>
                <th scope="col">From</th>
                <th scope="col">To</th>
                <th scope="col">Value (ETH)</th>
                <th scope="col">Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
                const dateStr = new Date(Number(tx.timeStamp) * 1000).toLocaleString();

                return (
                  <tr key={tx.hash}>
                    <td>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hash-link"
                      >
                        {shortenHex(tx.hash)} ↗
                      </a>
                    </td>
                    <td>
                      <code>{shortenHex(tx.from)}</code>
                    </td>
                    <td>
                      <code>{shortenHex(tx.to)}</code>
                    </td>
                    <td>
                      <span className={isOutgoing ? "tx-out" : "tx-in"}>
                        {isOutgoing ? "-" : "+"} {Number(formatEther(tx.value)).toFixed(5)} ETH
                      </span>
                    </td>
                    <td>{dateStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
