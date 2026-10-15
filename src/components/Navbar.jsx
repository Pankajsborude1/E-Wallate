// src/components/Navbar.jsx
import React from "react";

export default function Navbar({ currentPage, setCurrentPage, onLogout, isUnlocked }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "send", label: "Send" },
    { id: "receive", label: "Receive" },
    { id: "history", label: "History" },
  ];

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="logo-icon">◈</span>
        <span className="brand-title">SepoliaPay Vault</span>
        {/* Mandatory Sepolia Testnet Badge displayed on every screen */}
        <span className="network-badge">● Sepolia Testnet</span>
      </div>

      {/* Show navigation links only when the wallet is unlocked */}
      {isUnlocked && (
        <nav className="navbar-links" aria-label="Main Navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-btn ${currentPage === item.id ? "active" : ""}`}
              onClick={() => setCurrentPage(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button id="nav-logout-btn" className="nav-btn logout-btn" onClick={onLogout}>
            Logout
          </button>
        </nav>
      )}
    </header>
  );
}
