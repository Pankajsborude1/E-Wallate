# Requirements Specification: SepoliaPay Vault

## 1. Document Overview
This document specifies the complete set of functional, non-functional, security, and interface requirements for **SepoliaPay Vault**, a non-custodial Ethereum Sepolia web wallet.

---

## 2. Functional Requirements (FR)

### FR-1: Deterministic Wallet Generation
- **FR-1.1**: The system shall generate a cryptographically secure 12-word mnemonic phrase compliant with the **BIP-39** specification using `ethers.Wallet.createRandom()`.
- **FR-1.2**: The system shall present the 12 words in a numbered, high-contrast grid with explicit warning instructions.
- **FR-1.3**: The system shall require the user to check an explicit acknowledgment checkbox (*"I have safely written down my 12-word recovery phrase"*) before permitting wallet encryption and save.
- **FR-1.4**: The system shall derive the corresponding Ethereum public address formatted as an EIP-55 checksummed `0x...` string.

### FR-2: Mnemonic Recovery & Validation
- **FR-2.1**: The system shall permit the user to restore an existing wallet by entering their 12-word recovery phrase.
- **FR-2.2**: The input parser shall normalize whitespace, trim leading/trailing spaces, and convert all characters to lowercase.
- **FR-2.3**: The system shall reject phrases that do not contain exactly 12 words.
- **FR-2.4**: The system shall validate the BIP-39 checksum using `Wallet.fromPhrase()` and return clear, descriptive error feedback if words are invalid or misspelled.

### FR-3: Password-Derived Keystore Encryption & Storage
- **FR-3.1**: The system shall require a user password of at least 6 characters before saving a created or restored wallet.
- **FR-3.2**: The system shall enforce password confirmation matching prior to encryption.
- **FR-3.3**: The system shall encrypt the wallet using the Web3 Secret Storage Definition (`scrypt` KDF + `AES-128-CTR` cipher) via `wallet.encrypt(password)`.
- **FR-3.4**: The encrypted JSON keystore shall be stored under the key `sepolia_ewallet_encrypted_json` in the browser's `localStorage`.
- **FR-3.5**: Plaintext private keys or recovery phrases shall **NEVER** be saved to `localStorage`, `sessionStorage`, cookies, or any remote database.

### FR-4: Keystore Unlocking & Volatile Session Management
- **FR-4.1**: If an encrypted keystore exists in `localStorage`, the system shall default to the **Unlock Wallet** mode.
- **FR-4.2**: The system shall decrypt the keystore using `Wallet.fromEncryptedJson(json, password)`.
- **FR-4.3**: If the user inputs an incorrect password, the system shall catch the decryption exception and display *"Incorrect password. Could not decrypt the wallet."* without crashing.
- **FR-4.4**: Decrypted wallet objects must remain exclusively in volatile React component state (`useState`) and be purged immediately upon user logout or browser unload.
- **FR-4.5**: The system shall offer a **Reset Wallet** option with confirmation dialog to delete the local keystore if the password is lost.

### FR-5: Balance Querying & Sepolia RPC Node Interface
- **FR-5.1**: The system shall connect to Ethereum Sepolia Testnet using `new JsonRpcProvider(VITE_RPC_URL)`.
- **FR-5.2**: The system shall fetch the account balance in integer Wei via `provider.getBalance(address)` and format it into human-readable ETH using `formatEther()`.
- **FR-5.3**: The system shall display the ETH balance formatted to 6 decimal places alongside a currency badge (*SepoliaETH*).
- **FR-5.4**: The system shall provide a manual refresh button (`↻ Refresh Balance`) with loading spinner feedback.
- **FR-5.5**: If the RPC fails or `VITE_RPC_URL` is unconfigured, the system shall surface an informative alert.

### FR-6: Gas Estimation & Transaction Dispatch
- **FR-6.1**: The system shall validate recipient addresses using `ethers.isAddress(recipient)`.
- **FR-6.2**: The system shall validate that the transfer amount is a positive number greater than 0.
- **FR-6.3**: The system shall query live network gas fee data using `provider.getFeeData()`.
- **FR-6.4**: The system shall estimate total gas fee based on standard 21,000 gas units: $\text{Total Gas (Wei)} = 21,000 \times \text{gasPrice}$.
- **FR-6.5**: Pre-flight verification: If $\text{Amount (Wei)} + \text{Gas Fee (Wei)} > \text{Balance (Wei)}$, the system shall abort and display the exact deficit.
- **FR-6.6**: The system shall provide a two-step confirmation dialog displaying Recipient, Amount, Estimated Network Gas Fee, and Total Deduction.
- **FR-6.7**: Upon confirmation, the system shall locally sign the transaction and broadcast it via `connectedWallet.sendTransaction()`.
- **FR-6.8**: The system shall await 1 block confirmation (`txResponse.wait(1)`), display the transaction hash, and provide a direct link to `https://sepolia.etherscan.io/tx/{hash}`.

### FR-7: Address Sharing & QR Code
- **FR-7.1**: The system shall generate a high-contrast SVG QR code encoding the wallet's public address using `qrcode.react`.
- **FR-7.2**: The system shall provide a one-click **Copy Address** button with visual confirmation (*"✓ Copied!"* for 2 seconds).
- **FR-7.3**: The system shall display a testnet safety advisory stating that only Sepolia Testnet ETH should be sent to this address.

### FR-8: Transaction History Indexing
- **FR-8.1**: The system shall fetch the last 10 transactions using the Etherscan Sepolia API V2 endpoint (`chainid=11155111&module=account&action=txlist`).
- **FR-8.2**: The history table shall display: Tx Hash (shortened with explorer link), From address, To address, Value (with `+` incoming green or `-` outgoing red badge), and formatted Timestamp.
- **FR-8.3**: If the address has no prior transactions, an empty state notice shall be displayed.
- **FR-8.4**: If the API key is missing or invalid, an explanatory alert shall guide the user.

---

## 3. Non-Functional Requirements (NFR)

| ID | Category | Specification |
|---|---|---|
| **NFR-1** | **Cryptographic Security** | Zero plaintext key persistence. Web3 Secret Storage standard (`scrypt` + `AES-128-CTR`). Client-side ECDSA signatures. |
| **NFR-2** | **Performance & Latency** | Local key generation and address derivation $< 200\text{ms}$. Scrypt derivation $< 3.5\text{s}$ with user loading spinner. |
| **NFR-3** | **Aesthetics & Usability** | Modern dark-mode fintech interface with glassmorphism, responsive across desktop, tablet, and mobile. |
| **NFR-4** | **Reliability** | Comprehensive error boundaries for network timeouts, RPC down-times, invalid passwords, and user balance deficits. |
| **NFR-5** | **Zero External Dependencies for Keys** | Key generation and signing must execute entirely in the local browser without sending payloads to any server. |
| **NFR-6** | **Chain Fidelity** | Restricted strictly to Sepolia Testnet (Chain ID `11155111`) to prevent financial risk. |

---

## 4. Environment & Dependency Specifications

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "ethers": "6.13.4",
    "qrcode.react": "4.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^5.4.11"
  }
}
```
Node.js runtime requirement: **v18.x or v20.x LTS**.
Browser compatibility: Google Chrome, Mozilla Firefox, Brave, Microsoft Edge, Apple Safari (modern versions supporting Web Crypto API).
