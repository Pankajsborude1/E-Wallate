// src/components/SendForm.jsx
import React, { useState } from "react";
import { isAddress, parseEther, formatEther } from "ethers";
import { getProvider } from "../utils/provider";

export default function SendForm({ wallet, currentBalance, onTxSuccess }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  // Gas estimation & confirmation states
  const [estimatedFeeEth, setEstimatedFeeEth] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Loading & feedback states
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  /**
   * Step 1: Validate inputs, check sufficient balance, and estimate gas fee.
   */
  const handlePrepareTransaction = async (e) => {
    e.preventDefault();
    setError("");
    setTxHash("");

    // 1. Validate recipient Ethereum address using ethers.isAddress()
    if (!isAddress(recipient.trim())) {
      setError("Invalid recipient Ethereum address. Please enter a valid 0x address.");
      return;
    }

    // 2. Validate amount is positive number
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError("Please enter a valid ETH amount greater than 0.");
      return;
    }

    try {
      setIsEstimating(true);
      const provider = getProvider();

      // Convert user input ETH string to Wei (BigInt)
      const amountInWei = parseEther(amount.toString());

      // Fetch current wallet balance in Wei directly from blockchain
      const balanceInWei = await provider.getBalance(wallet.address);

      // Fetch current network gas price from Sepolia RPC
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas ?? 1000000000n;
      const gasLimit = 21000n; // Standard ETH transfer always uses 21,000 gas units
      const totalGasFeeWei = gasLimit * gasPrice;

      // Check if user has enough ETH to cover (Amount + Gas Fee)
      if (amountInWei + totalGasFeeWei > balanceInWei) {
        setError(
          `Insufficient balance. You need ${formatEther(
            amountInWei + totalGasFeeWei
          )} ETH (including gas fee), but you have ${formatEther(balanceInWei)} ETH.`
        );
        return;
      }

      // Save human-readable gas fee and show confirmation prompt
      setEstimatedFeeEth(formatEther(totalGasFeeWei));
      setShowConfirm(true);
    } catch (err) {
      setError(err.message || "Failed to estimate gas fee. Check your RPC connection.");
    } finally {
      setIsEstimating(false);
    }
  };

  /**
   * Step 2: Sign and broadcast the transaction after user confirms.
   */
  const handleConfirmAndSend = async () => {
    setError("");
    setIsSending(true);

    try {
      const provider = getProvider();

      // Connect the in-memory decrypted wallet to the Sepolia provider
      const connectedWallet = wallet.connect(provider);

      // Broadcast the signed transaction to Sepolia
      const txResponse = await connectedWallet.sendTransaction({
        to: recipient.trim(),
        value: parseEther(amount.toString()),
      });

      // Wait for 1 block confirmation on the blockchain
      await txResponse.wait(1);

      // Store the transaction hash to show the Etherscan link
      setTxHash(txResponse.hash);
      setShowConfirm(false);
      setRecipient("");
      setAmount("");

      // Trigger balance refresh in parent component
      if (onTxSuccess) {
        onTxSuccess();
      }
    } catch (err) {
      setError(err.reason || err.message || "Transaction failed during broadcast.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="card">
      <h2>Send Sepolia ETH</h2>
      <p className="subtitle">
        Available Balance: <strong>{Number(currentBalance).toFixed(6)} ETH</strong>
      </p>

      {/* Form for entering recipient address and amount */}
      <form onSubmit={handlePrepareTransaction} className="form-stack">
        <div className="form-group">
          <label className="field-label" htmlFor="send-recipient-input">Recipient Address</label>
          <input
            id="send-recipient-input"
            type="text"
            className="input-field"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
              setShowConfirm(false);
            }}
            disabled={isSending}
            required
          />
        </div>

        <div className="form-group">
          <label className="field-label" htmlFor="send-amount-input">Amount (Sepolia ETH)</label>
          <input
            id="send-amount-input"
            type="number"
            step="any"
            min="0"
            className="input-field"
            placeholder="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setShowConfirm(false);
            }}
            disabled={isSending}
            required
          />
        </div>

        {!showConfirm && (
          <button
            id="review-tx-btn"
            type="submit"
            className="btn btn-primary"
            disabled={isEstimating || isSending}
          >
            {isEstimating ? "Estimating Gas Fee..." : "Review Transaction"}
          </button>
        )}
      </form>

      {/* Confirmation Box with Estimated Gas Fee */}
      {showConfirm && (
        <div className="confirm-box" role="region" aria-label="Transaction Confirmation">
          <h3>Confirm Transaction Details</h3>
          <div className="confirm-row">
            <span>To Address:</span>
            <code>{recipient}</code>
          </div>
          <div className="confirm-row">
            <span>Amount to Send:</span>
            <strong>{amount} ETH</strong>
          </div>
          <div className="confirm-row">
            <span>Estimated Network Gas Fee:</span>
            <strong>~{Number(estimatedFeeEth).toFixed(8)} ETH</strong>
          </div>
          <div className="confirm-row total-row">
            <span>Total Deduction:</span>
            <strong>
              {(Number(amount) + Number(estimatedFeeEth)).toFixed(6)} ETH
            </strong>
          </div>

          <div className="button-group">
            <button
              id="confirm-send-btn"
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmAndSend}
              disabled={isSending}
            >
              {isSending ? "Signing & Broadcasting (Wait ~15s)..." : "Confirm & Send ETH"}
            </button>
            <button
              id="cancel-send-btn"
              type="button"
              className="btn btn-outline"
              onClick={() => setShowConfirm(false)}
              disabled={isSending}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading Spinner while waiting for block confirmation */}
      {isSending && (
        <div className="spinner-box">
          <div className="spinner"></div>
          <p>Waiting for transaction to be mined on Sepolia Testnet...</p>
        </div>
      )}

      {/* Error Message */}
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {/* Success Message with Etherscan Link */}
      {txHash && (
        <div className="alert alert-success" role="alert">
          <h4>✓ Transaction Confirmed on Blockchain!</h4>
          <p className="tx-hash-line">
            <strong>Transaction Hash:</strong> <code>{txHash}</code>
          </p>
          <a
            id="view-tx-etherscan-link"
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="etherscan-link"
          >
            View Transaction on Sepolia Etherscan ↗
          </a>
        </div>
      )}
    </div>
  );
}
