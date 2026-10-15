# Design System & Aesthetics Guide: SepoliaPay Vault

## 1. Aesthetic Vision & Design Philosophy

**SepoliaPay Vault** embodies a **high-fidelity, cyber-modern fintech aesthetic** inspired by institutional Web3 applications (e.g., Uniswap v3, Rainbow Wallet, Phantom). The interface balances high cryptographic rigor with intuitive visual feedback, using **deep cosmic dark tones, subtle glassmorphic translucency, rich neon accents, and smooth micro-animations**.

### Core Tenets:
1. **Clarity Over Clutter**: Complex cryptographic operations (scrypt derivation, Wei conversion) are distilled into clean, approachable visual components.
2. **Dynamic Responsiveness**: Buttons, cards, and input fields provide immediate interactive feedback (subtle elevation, border glow, kinetic loading states).
3. **Safety Through Color**: Critical security notices (recovery phrases, testnet reminders, confirmation thresholds) use standardized semantic hues.
4. **Zero Placeholder Policy**: All visual elements are fully rendered, high-contrast, and responsive across all device breakpoints.

---

## 2. Color Palette & Semantic Tokens

### 2.1 Base Colors (Slate & Obsidian)
```css
:root {
  /* Background layers */
  --bg-deep: #090d16;        /* Deep canvas obsidian */
  --bg-dark: #0f172a;        /* Primary background surface */
  --bg-card: #1e293b;        /* Card surface elevation */
  --bg-card-glass: rgba(30, 41, 59, 0.72); /* Glassmorphic card surface */
  --bg-input: #0b1120;       /* Recessed input background */
  --border-color: #334155;   /* Default structural border */
  --border-focus: #6366f1;   /* Active border highlight */
  
  /* Text typography */
  --text-main: #f8fafc;      /* Primary text high-contrast */
  --text-muted: #94a3b8;     /* Secondary / meta descriptions */
  --text-dim: #64748b;       /* Subtle captions & timestamps */
}
```

### 2.2 Semantic & Brand Accents
```css
:root {
  /* Primary Brand: Electric Indigo */
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --primary-glow: rgba(99, 102, 241, 0.35);

  /* Secondary Brand: Cosmic Violet */
  --accent: #8b5cf6;
  --accent-hover: #7c3aed;

  /* Status Tokens */
  --success: #10b981;        /* Mined transactions, positive balance (+ETH) */
  --success-bg: rgba(16, 185, 129, 0.12);
  --success-border: rgba(16, 185, 129, 0.35);

  --warning: #f59e0b;        /* Gas fees, educational banner, testnet guard */
  --warning-bg: rgba(245, 158, 11, 0.12);
  --warning-border: rgba(245, 158, 11, 0.35);

  --danger: #ef4444;         /* Outgoing tx (-ETH), validation error, reset */
  --danger-bg: rgba(239, 68, 68, 0.12);
  --danger-border: rgba(239, 68, 68, 0.35);
}
```

---

## 3. Typography System

The application leverages **Inter** for readable, clean UI elements and **JetBrains Mono** for addresses, hashes, and hexadecimal numbers.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Scale & Hierarchy
| Level | Font Family | Size | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| **Display / Balance** | Inter | `2.25rem` (36px) | 800 | 1.1 | Live SepoliaETH balance |
| **Heading 1 / Title** | Inter | `1.5rem` (24px) | 700 | 1.3 | Page Titles, Navbar Brand |
| **Heading 2 / Card** | Inter | `1.25rem` (20px) | 600 | 1.4 | Card headers, Modal titles |
| **Heading 3 / Subhead**| Inter | `1.05rem` (17px) | 600 | 1.4 | Subsection titles |
| **Body Standard** | Inter | `0.95rem` (15px) | 400/500 | 1.5 | General text, inputs |
| **Caption / Meta** | Inter | `0.85rem` (13.5px) | 500 | 1.4 | Badges, labels, helper text |
| **Code / Address** | JetBrains Mono | `0.88rem` (14px) | 500 | 1.4 | `0x...` addresses, hashes |

---

## 4. UI Components & Micro-Interactions

### 4.1 Glassmorphic Cards
Cards feature a subtle backdrop blur with a glowing perimeter gradient:
```css
.card {
  background: var(--bg-card-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.75rem;
  box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.4),
              0 4px 12px -2px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease, border-color 0.2s ease;
}
```

### 4.2 Buttons with Micro-States
Interactive buttons have hover elevations, active depressed states, and disabled opacity:
```css
.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  color: #ffffff;
  box-shadow: 0 4px 14px 0 var(--primary-glow);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px 0 var(--primary-glow);
  filter: brightness(1.08);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(1px);
}
```

### 4.3 12-Word Mnemonic Chip Matrix
The recovery phrase words are presented in a structured, numbered 3-column grid with subtle borders and monospace numbers:
```css
.mnemonic-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.65rem;
}

.mnemonic-word {
  display: flex;
  align-items: center;
  background-color: var(--bg-card);
  padding: 0.6rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
}
```

### 4.4 Transaction Status Badges
- **Incoming Transaction**: `+ 0.05 ETH` rendered in emerald `#34d399` with subtle background glow.
- **Outgoing Transaction**: `- 0.01 ETH` rendered in ruby `#f87171` with subtle background glow.
- **Network Badge**: Pulsing dot animation indicating live connection to Sepolia testnet.

---

## 5. Animations & Keyframes

### 5.1 Continuous Spin (for scrypt & block mining)
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

### 5.2 Pulse Glow (for live network indicator)
```css
@keyframes pulseDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

.network-badge::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--success);
  margin-right: 6px;
  animation: pulseDot 2s ease-in-out infinite;
}
```

---

## 6. Layout & Responsive Breakpoints

| Breakpoint | Target Screen | Layout Strategy |
|---|---|---|
| `< 480px` | Mobile (compact) | Mnemonic grid becomes 2 columns; table scrolls horizontally; single column action cards. |
| `481px - 768px` | Tablet / Large Phone | Full 3-column mnemonic grid; responsive navbar buttons wrap cleanly. |
| `> 768px` | Desktop / Laptop | Maximum container width capped at `860px` with centered focal elevation. |
