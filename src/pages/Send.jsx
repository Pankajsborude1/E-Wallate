// src/pages/Send.jsx
import React from "react";
import SendForm from "../components/SendForm";

export default function Send({ wallet, balance, onTxSuccess }) {
  return (
    <div className="page-container">
      <SendForm
        wallet={wallet}
        currentBalance={balance}
        onTxSuccess={onTxSuccess}
      />
    </div>
  );
}
