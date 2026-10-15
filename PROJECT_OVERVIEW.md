# Project Overview & Technical Report: SepoliaPay Vault

## 1. Abstract
**SepoliaPay Vault** is a browser-based, client-side, non-custodial cryptocurrency wallet engineered for the **Ethereum Sepolia Testnet** (Chain ID: `11155111`). Implemented with **React 18**, **Vite**, and **ethers.js v6**, the system empowers users with sovereign asset management without relying on centralized intermediaries or backends. Private keys are derived deterministically using BIP-39 mnemonic phrases, encrypted locally inside the browser using the Web3 Secret Storage Definition (`scrypt` + `AES-128-CTR`), and never transmitted across the network in plaintext. State transactions are signed locally using client-side elliptic curve digital signatures (`secp256k1`), validated via pre-flight gas estimation against live Alchemy JSON-RPC nodes, and cross-referenced using Etherscan API V2 block indexing.

---

## 2. Background & Problem Statement

### 2.1 The Paradigm Shift: Custodial vs. Non-Custodial
In traditional banking and centralized cryptocurrency exchanges (CEXs such as Binance or Coinbase), custody of financial assets resides with third parties. Users possess account credentials (usernames and passwords), but the underlying cryptographic private keys remain in exchange databases.

| Attribute | Custodial Wallets (CEX) | Non-Custodial Wallets (SepoliaPay Vault) |
|---|---|---|
| **Private Key Ownership** | Third-party custodian / central exchange | User possesses complete local ownership |
| **Recovery Mechanism** | Email verification, KYC, customer support | 12-Word BIP-39 mnemonic seed phrase |
| **Trust Model** | Centralized, requires counterparty trust | Trustless, mathematically enforced |
| **Single Point of Failure** | Database breach, exchange insolvency, freeze | None on network side; client device security |
| **Transaction Signing** | Performed on custodian's backend servers | Performed locally in client browser memory |
| **Transparency** | Off-chain internal ledger balance changes | On-chain Ethereum Sepolia consensus |

### 2.2 Problem Statement
Modern users and engineering students often perceive blockchain interaction as an opaque "black box" due to browser extensions or complex mobile wallets. Furthermore, existing educational wallets often cut corners by storing unencrypted private keys in `localStorage`, creating security vulnerabilities and misconceptions. 

There is an acute need for a production-grade, transparent, educational reference implementation that:
1. Adheres strictly to formal cryptographic standards (BIP-39, Web3 Secret Storage).
2. Clearly decouples client-side local signing from remote JSON-RPC broadcasting.
3. Operates safely on an incentiveless testbed (Ethereum Sepolia Testnet).
4. Provides full transparency into gas estimation, block confirmations, and transaction indexing.

---

## 3. Project Objectives
1. **Deterministic Key Generation**: Implement BIP-39 standard compliant 12-word recovery phrase derivation with cryptographic entropy.
2. **Standardized Keystore Encryption**: Secure private keys locally using password-derived encryption via the Web3 Secret Storage specification (scrypt key derivation function + AES-128-CTR cipher).
3. **Volatile Session Security**: Restrict decrypted private key instances exclusively to volatile React memory (`useState`), guaranteeing zero unencrypted persistent footprint.
4. **Blockchain RPC Integration**: Interface seamlessly with Ethereum Sepolia nodes via Alchemy JSON-RPC API for real-time balance inquiries and transaction broadcasting.
5. **Pre-flight Gas & Balance Verification**: Calculate live gas fees dynamically ($\text{Total Gas} = 21,000 \times \text{gasPrice}$) and reject transactions before broadcast if balance is insufficient.
6. **Decentralized Transaction Lifecycle**: Sign transactions locally with ECDSA (`secp256k1`), wait for single-block blockchain confirmation, and generate direct Sepolia Etherscan explorer audit links.
7. **Address Sharing & History**: Generate SVG QR codes for instant mobile peer-to-peer scanning and query historical transactions using Etherscan API V2.

---

## 4. Technology Stack Justification

| Technology | Version | Purpose in SepoliaPay Vault |
|---|---|---|
| **React** | `^18.3.1` | Component-based UI rendering, unidirectional reactive state management, volatile memory session containment. |
| **Vite** | `^5.4.0` | Ultra-fast build pipeline, ES module hot-reloading, zero-bundle production optimization. |
| **ethers.js** | `6.13.4` | Primary cryptographic engine (BIP-39, HDNodeWallet, keystore encryption/decryption, JSON-RPC provider, Wei/Ether math). |
| **qrcode.react** | `4.1.0` | Client-side SVG QR code generator with zero network dependency. |
| **Alchemy RPC** | API v2 | High-availability JSON-RPC communication bridge to Ethereum Sepolia execution nodes. |
| **Etherscan API** | API v2 | Sepolia account transaction indexing and historical ledger query endpoint. |

---

## 5. Architectural & Cryptographic Principles

### 5.1 BIP-39 Mnemonic Derivation
1. **Entropy Generation**: `ethers.Wallet.createRandom()` invokes the browser's cryptographically secure pseudo-random number generator (`crypto.getRandomValues`).
2. **Entropy to Words**: 128 bits of entropy are generated. A 4-bit SHA-256 checksum is appended to make 132 bits. These are partitioned into 12 groups of 11 bits each, which index into the standardized 2,048-word BIP-39 dictionary.
3. **Key Derivation**: The mnemonic is transformed into a seed, which deterministically derives the master private key and corresponding Ethereum public address ($0x...$) via secp256k1 curve multiplication and Keccak-256 hashing.

### 5.2 Password Encryption (Web3 Secret Storage Definition)
When a user inputs their password:
$$\text{Derived Key} = \text{scrypt}(\text{password}, \text{salt}, N=8192, r=8, p=1)$$
The private key is encrypted with **AES-128-CTR** using the derived key. The ciphertext, salt, IV, and a MAC (Message Authentication Code) are formatted as a JSON keystore:
```json
{
  "address": "9c1234...",
  "id": "e3a890...",
  "version": 3,
  "crypto": {
    "cipher": "aes-128-ctr",
    "cipherparams": { "iv": "..." },
    "ciphertext": "...",
    "kdf": "scrypt",
    "kdfparams": { "dklen": 32, "n": 8192, "r": 8, "p": 1, "salt": "..." },
    "mac": "..."
  }
}
```
Only this encrypted JSON is saved to `localStorage` under the key `sepolia_ewallet_encrypted_json`.

### 5.3 Local Transaction Signing (ECDSA)
When sending ETH:
1. `amountInWei = parseEther(amount)` converts decimal ETH into integer Wei.
2. The user reviews the estimated gas fee ($\text{gasPrice} \times 21,000$).
3. `connectedWallet.sendTransaction()` signs the transaction payload using the local private key via ECDSA (`secp256k1`).
4. Only the signed raw byte hex is transmitted to Alchemy via `eth_sendRawTransaction`.
5. The private key never leaves the client browser.

---

## 6. Functional Modules Overview

### 6.1 Authentication & Onboarding (`CreateImport.jsx`)
- **Mode 1: Unlock Wallet**: Reads keystore from `localStorage`, runs `Wallet.fromEncryptedJson(json, password)`, verifies MAC, and hydrates React state.
- **Mode 2: Create Wallet**: Generates a new 12-word phrase, displays safety instructions, requires explicit confirmation checkbox, and encrypts with password before saving.
- **Mode 3: Import Wallet**: Accepts 12-word space-delimited phrase, validates BIP-39 checksum with `Wallet.fromPhrase()`, and encrypts with user password.
- **Reset Keystore**: Allows users to purge local browser storage if they need to switch wallets or recover with their mnemonic.

### 6.2 Overview & Balance (`WalletCard.jsx` & `Dashboard.jsx`)
- Displays truncated and full Ethereum `0x...` public address with one-click clipboard copy feedback.
- Queries `provider.getBalance(address)` and renders live balance in SepoliaETH down to 6 decimal places.
- Offers manual balance refresh trigger with loading indicator.

### 6.3 Transaction Dispatch (`SendForm.jsx` & `Send.jsx`)
- Strict input validation: checks `ethers.isAddress(recipient)` and verifies positive numeric amounts.
- Dynamic fee estimation: queries `provider.getFeeData()` for gas price.
- Pre-flight balance check: ensures $\text{Amount} + \text{Gas Fee} \le \text{Balance}$.
- Two-step confirmation dialogue detailing recipient, amount, network gas, and total deduction.
- Real-time block confirmation polling (`txResponse.wait(1)`).
- Direct link generation to Sepolia Etherscan explorer.

### 6.4 Address QR Scanner (`ReceiveQR.jsx` & `Receive.jsx`)
- Generates high-contrast SVG QR code of user address with margin framing.
- Warns user to restrict incoming assets strictly to Sepolia Testnet ETH.

### 6.5 History & Ledger Audit (`TxHistory.jsx` & `History.jsx`)
- Queries Etherscan API V2 (`chainid=11155111&module=account&action=txlist`).
- Formats timestamps to local user date/time.
- Highlights incoming (`+` green) vs. outgoing (`-` red) transfers.

---

## 7. Security Analysis & Threat Model

| Potential Threat | Threat Vector | Mitigation in SepoliaPay Vault |
|---|---|---|
| **Malicious Network Interception** | Man-in-the-Middle (MitM) sniffing private keys | Private keys are never sent over network. Only signed raw transaction hex is broadcast. |
| **XSS Reading `localStorage`** | Malicious script dumping browser storage | Raw keys/mnemonics are never in `localStorage`; only scrypt-encrypted JSON keystore is stored. |
| **Memory Dump after Logout** | Private key persists in client variables | Logging out sets React wallet state to `null`, triggering immediate garbage collection. |
| **Accidental Mainnet Loss** | User funds wallet with real ETH | App is hardcoded with Sepolia Testnet badges, warning banners, and RPC endpoints. |
| **Out-of-Gas Failure** | Sending more funds than balance | Pre-flight check verifies $(\text{Value} + 21,000 \times \text{gasPrice}) \le \text{Balance}$. |

---

## 8. College Project Report Mapping
This documentation aligns with standard academic university guidelines for Computer Science, Information Technology, and Blockchain Engineering capstone projects:
1. **Chapter 1: Introduction & Literature Survey** (Section 2)
2. **Chapter 2: Problem Definition & Objectives** (Section 3)
3. **Chapter 3: System Design & Cryptographic Architecture** (Section 4 & 5)
4. **Chapter 4: Implementation Details & Functional Modules** (Section 6)
5. **Chapter 5: Security Evaluation & Threat Mitigations** (Section 7)
6. **Chapter 6: Results, Screenshots & Future Enhancements**
