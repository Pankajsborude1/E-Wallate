// src/pages/History.jsx
import React from "react";
import TxHistory from "../components/TxHistory";

export default function History({ wallet }) {
  return (
    <div className="page-container">
      <TxHistory address={wallet.address} />
    </div>
  );
}
