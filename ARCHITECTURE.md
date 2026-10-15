# System Architecture & Technical Specifications: SepoliaPay Vault

## 1. High-Level Architecture Diagram

SepoliaPay Vault enforces a strict **Zero-Custody, Client-Sovereign Architecture**. All cryptographic operations occur inside the browser runtime.

```mermaid
graph TB
    subgraph ClientDevice ["Client Browser Runtime"]
        subgraph UI ["Presentation Layer (React 18)"]
            Navbar["Navbar.jsx<br/>(Network & Navigation)"]
            Dashboard["Dashboard.jsx<br/>(Overview & Quick Actions)"]
            SendForm["SendForm.jsx<br/>(Gas Est. & Broadcast)"]
            ReceiveQR["ReceiveQR.jsx<br/>(SVG QR Code)"]
            TxHistory["TxHistory.jsx<br/>(Etherscan History Table)"]
            CreateImport["CreateImport.jsx<br/>(Onboarding & Keystore)"]
        end

        subgraph CoreState ["State & Session Management"]
            App["App.jsx<br/>(State Coordinator)"]
            RAM["Volatile RAM (useState)<br/>Decrypted Wallet Instance"]
        end

        subgraph CryptoEngine ["Cryptographic Engine (ethers.js v6)"]
            BIP39["BIP-39 Mnemonic Generator<br/>(Wallet.createRandom)"]
            ScryptAES["Web3 Secret Storage Keystore<br/>(scrypt + AES-128-CTR)"]
            Signer["ECDSA Signer (secp256k1)<br/>(wallet.sendTransaction)"]
        end

        subgraph Storage ["Persistent Client Storage"]
            LocalStorage["localStorage<br/>('sepolia_ewallet_encrypted_json')"]
        end
    end

    subgraph ExternalWeb3 ["Decentralized Network Infrastructure"]
        Alchemy["Alchemy JSON-RPC Provider<br/>(Sepolia Node: https://eth-sepolia.g.alchemy.com/v2/...)"]
        SepoliaMempool["Ethereum Sepolia Testnet<br/>(Consensus & Mempool, Chain ID 11155111)"]
        Etherscan["Etherscan API V2<br/>(Account Transaction Indexer)"]
    end

    %% Interactions
    UI --> App
    App <--> RAM
    CreateImport --> BIP39
    CreateImport <--> ScryptAES
    ScryptAES <--> LocalStorage
    RAM --> Signer
    Signer -- "eth_sendRawTransaction (Hex only)" --> Alchemy
    App -- "eth_getBalance" --> Alchemy
    SendForm -- "eth_estimateGas / eth_feeHistory" --> Alchemy
    Alchemy <--> SepoliaMempool
    TxHistory -- "api?module=account&action=txlist" --> Etherscan
```

---

## 2. Layered Architecture Breakdown

### 2.1 Layer 1: Client Presentation Layer
- **Component Hierarchy**:
  - `App.jsx` (Root orchestrator)
    - `Navbar.jsx` (Header, Sepolia Network Badge, dynamic navigation)
    - `EducationalBanner` (Academic notice)
    - Conditional View Routing:
      - `CreateImport.jsx` (Unlocked === false)
      - `Dashboard.jsx` (Unlocked === true)
        - `WalletCard.jsx`
      - `Send.jsx`
        - `SendForm.jsx`
      - `Receive.jsx`
        - `ReceiveQR.jsx`
      - `History.jsx`
        - `TxHistory.jsx`
    - `Footer.jsx`

### 2.2 Layer 2: State & Volatile Session Management
- **In-Memory Volatility**: The decrypted `wallet` instance resides exclusively in `App.jsx` state (`useState(null)`).
- **Session Purging**: 
  - Clicking **Logout** executes `setWallet(null)` and resets balance state.
  - Page refresh or closing the tab destroys the volatile heap memory.
  - No session cookies, tokens, or plaintext values are ever written to browser storage.

### 2.3 Layer 3: Cryptographic Keystore Layer
- **Format**: Conforms to Ethereum Web3 Secret Storage Definition (v3).
- **Encryption Parameters**:
  - Key Derivation Function (KDF): `scrypt`
  - $N = 8192$, $r = 8$, $p = 1$, $dklen = 32$
  - Cipher: `aes-128-ctr`
  - MAC: $\text{Keccak-256}(\text{derivedKey}[16..32] \parallel \text{ciphertext})$
- **Persistence**: Encrypted ciphertext and cryptographic parameters are serialized to JSON string and saved under key `sepolia_ewallet_encrypted_json`.

### 2.4 Layer 4: Blockchain JSON-RPC Provider Layer
- Initialized via `new JsonRpcProvider(VITE_RPC_URL)`.
- Encapsulates:
  - `provider.getBalance(address)`: Queries current account state in integer Wei.
  - `provider.getFeeData()`: Retrieves base fee, priority fee, and recommended gas price.
  - `wallet.connect(provider)`: Binds the in-memory signer with the remote provider.
  - `connectedWallet.sendTransaction(txPayload)`: Signs locally and dispatches to Sepolia nodes.

### 2.5 Layer 5: Blockchain Explorer & Indexing Layer
- Direct REST query against Etherscan Sepolia V2 API:
  $$\text{URL} = \text{https://api.etherscan.io/v2/api?chainid=11155111\&module=account\&action=txlist\&address=0x...\&page=1\&offset=10\&sort=desc\&apikey=KEY}$$
- Avoids brute-force RPC block scanning by querying Etherscan's indexed SQL/Bigtable ledger.

---

## 3. Sequence Diagrams

### 3.1 Wallet Creation & Encryption Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant CreateImport as CreateImport.jsx
    participant WalletUtils as wallet.js
    participant Ethers as ethers.js (v6)
    participant Storage as localStorage

    User->>CreateImport: Clicks "+ Generate New Wallet"
    CreateImport->>WalletUtils: generateNewWallet()
    WalletUtils->>Ethers: Wallet.createRandom()
    Note over Ethers: Generates 128-bit CSPRNG entropy<br/>Computes 4-bit checksum<br/>Maps to 12 BIP-39 words
    Ethers-->>WalletUtils: HDNodeWallet (address, mnemonic, privateKey)
    WalletUtils-->>CreateImport: Return { wallet, mnemonic, address }
    CreateImport->>User: Renders 12-word recovery grid & address
    User->>CreateImport: Confirms backup, inputs password (min 6 chars)
    User->>CreateImport: Clicks "Encrypt & Open Wallet"
    CreateImport->>WalletUtils: encryptAndSaveWallet(wallet, password)
    WalletUtils->>Ethers: wallet.encrypt(password)
    Note over Ethers: Runs scrypt KDF<br/>Encrypts with AES-128-CTR<br/>Generates Keystore JSON
    Ethers-->>WalletUtils: encryptedJson string
    WalletUtils->>Storage: setItem("sepolia_ewallet_encrypted_json", encryptedJson)
    CreateImport->>User: Transition to Dashboard with in-memory wallet
```

---

### 3.2 Wallet Decryption / Unlock Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant CreateImport as CreateImport.jsx
    participant WalletUtils as wallet.js
    participant Storage as localStorage
    participant Ethers as ethers.js (v6)
    participant App as App.jsx

    User->>CreateImport: Inputs password into Unlock Form
    User->>CreateImport: Clicks "Unlock Wallet"
    CreateImport->>WalletUtils: unlockSavedWallet(password)
    WalletUtils->>Storage: getItem("sepolia_ewallet_encrypted_json")
    Storage-->>WalletUtils: encryptedJson
    WalletUtils->>Ethers: Wallet.fromEncryptedJson(encryptedJson, password)
    Note over Ethers: Re-derives key via scrypt<br/>Verifies MAC checksum<br/>Decrypts AES-128-CTR ciphertext
    alt Incorrect Password
        Ethers-->>WalletUtils: Error: invalid password / MAC mismatch
        WalletUtils-->>CreateImport: Throw "Incorrect password"
        CreateImport->>User: Displays alert: "Incorrect password. Could not decrypt."
    else Password Correct
        Ethers-->>WalletUtils: Decrypted Wallet object
        WalletUtils-->>CreateImport: decryptedWallet
        CreateImport->>App: onWalletUnlocked(decryptedWallet)
        Note over App: setWallet(decryptedWallet) stored in volatile RAM
        App->>User: Displays Dashboard & initiates balance fetch
    end
```

---

### 3.3 Transaction Preparation, Gas Estimation & Send Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant SendForm as SendForm.jsx
    participant ProviderUtils as provider.js
    participant Alchemy as Alchemy Sepolia RPC
    participant Wallet as In-Memory Signer

    User->>SendForm: Inputs recipient address (0x...) and amount (ETH)
    User->>SendForm: Clicks "Review Transaction"
    Note over SendForm: Validates ethers.isAddress(recipient)<br/>Validates amount > 0
    SendForm->>ProviderUtils: getProvider()
    SendForm->>Alchemy: provider.getBalance(wallet.address)
    Alchemy-->>SendForm: balanceInWei (BigInt)
    SendForm->>Alchemy: provider.getFeeData()
    Alchemy-->>SendForm: feeData (gasPrice)
    Note over SendForm: totalGasFeeWei = 21000n * gasPrice<br/>Verifies (amountInWei + totalGasFeeWei <= balanceInWei)
    SendForm->>User: Renders Confirmation Box with estimated fee
    User->>SendForm: Clicks "Confirm & Send ETH"
    SendForm->>Wallet: wallet.connect(provider)
    SendForm->>Wallet: connectedWallet.sendTransaction({ to, value })
    Note over Wallet: Locally signs transaction payload<br/>using private key via secp256k1 ECDSA
    Wallet->>Alchemy: eth_sendRawTransaction(signedRawTxHex)
    Alchemy-->>SendForm: txResponse (hash: 0x...)
    SendForm->>User: Displays "Waiting for confirmation..."
    SendForm->>Alchemy: txResponse.wait(1)
    Note over Alchemy: Sepolia block mined & confirmed
    Alchemy-->>SendForm: TransactionReceipt
    SendForm->>User: Displays Success Alert + Sepolia Etherscan link
```

---

## 4. Security Boundaries

```
[ UNTRUSTED ZONE: Public Internet ]
           │
           ▼
[ ALCHEMY / ETHERSCAN PUBLIC APIS ]
  - Reads public balances
  - Receives signed tx hex only
  - No private key transmission
           │
═══════════╪═════════════════════════════════════════════════════
[ TRUST BOUNDARY: Local Web Browser Sandbox ]
           │
   ┌───────┴────────────────────────┐
   │ React Presentation Components  │
   │  (Dashboard, Send, Receive)    │
   └───────────────┬────────────────┘
                   │
   ┌───────────────▼────────────────┐
   │   Volatile Heap Memory (RAM)   │
   │  Decrypted wallet instance     │
   │  Zero persistence; auto-purge  │
   └───────────────┬────────────────┘
                   │ AES-128-CTR + scrypt
   ┌───────────────▼────────────────┐
   │      Browser localStorage      │
   │  Encrypted Keystore JSON only  │
   │  NO plain private keys or seed │
   └────────────────────────────────┘
```
