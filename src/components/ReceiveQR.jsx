// src/components/ReceiveQR.jsx
import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function ReceiveQR({ address }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Could not copy address.");
    }
  };

  return (
    <div className="card receive-card">
      <h2>Receive Sepolia ETH</h2>
      <p className="subtitle">
        Scan this QR code or copy the address below to receive test ETH on the Sepolia network.
      </p>

      {/* QR Code Container */}
      <div className="qr-wrapper">
        <QRCodeSVG
          value={address}
          size={200}
          bgColor="#ffffff"
          fgColor="#0f172a"
          level="M"
          includeMargin={true}
        />
      </div>

      <div className="address-section">
        <label className="field-label" htmlFor="receive-address-display">Your Sepolia Address</label>
        <div className="address-box" id="receive-address-display">
          <code className="address-text">{address}</code>
          <button
            id="copy-receive-address-btn"
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
            type="button"
          >
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="alert alert-warning" role="alert">
        <strong>Note:</strong> Only send <strong>Sepolia Testnet ETH</strong> to this address. Do not send real Mainnet ETH.
      </div>
    </div>
  );
}
