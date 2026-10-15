// src/pages/Receive.jsx
import React from "react";
import ReceiveQR from "../components/ReceiveQR";

export default function Receive({ wallet }) {
  return (
    <div className="page-container">
      <ReceiveQR address={wallet.address} />
    </div>
  );
}
