# ArbiYield AI

**Prompt a yield strategy. Stream a Generative UI card. Sign it onto Arbitrum Stylus.**

---

## Overview

**ArbiYield AI** is an ETH Lima 2026 hackathon dapp that turns natural-language DeFi intent into an executable on-chain record.

Users describe a risk preference and asset (e.g. “low-risk USDC on Arbitrum”). The backend uses **OpenAI** through the **Vercel AI SDK** (`streamObject` + Zod) to stream a strictly typed strategy JSON payload. The frontend renders that stream into a live **StrategyCard** (Generative UI). With one click, the wallet signs `executeStrategy` on our custom **Arbitrum Stylus (Rust/WASM)** contract, permanently recording the strategy name and expected yield on **Arbitrum Sepolia**.

---

## Hackathon Bounties Targeted

### Arbitrum Advanced Bounty — Stylus (Rust Smart Contracts)

We fulfill the **Arbitrum Advanced Bounty** by shipping a custom **Rust** smart contract compiled to WASM with **Arbitrum Stylus `stylus-sdk` v0.10.8**, deployed and activated on **Arbitrum Sepolia**.

| Detail | Value |
| --- | --- |
| Contract | `StrategyExecutor` |
| Address | [`0xdb76e1ca5056c550afcd2084fc571c7fef2e89ae`](https://sepolia.arbiscan.io/address/0xdb76e1ca5056c550afcd2084fc571c7fef2e89ae) |
| Network | Arbitrum Sepolia |
| SDK | `stylus-sdk = "0.10.8"` |
| Source | [`arbi-yield-contract/`](./arbi-yield-contract) |

On-chain surface:

- `executeStrategy(string,uint256)` — write path for AI strategies  
- `totalStrategiesExecuted()` / `getUserStrategyCount(address)` — live ledger reads  
- `StrategyExecuted` event — indexed user + strategy metadata  

Deployment / activation:

- Deploy tx: [`0x0b55fef8…`](https://sepolia.arbiscan.io/tx/0x0b55fef85ed6120415e2e76bc00c29e40babb2573c192733e12a030c80153ae2)  
- Activation tx: [`0xf69a44f4…`](https://sepolia.arbiscan.io/tx/0xf69a44f436cf2dcc5d4a9bcd00c960589069c8615cb371bfcbe01da67cfbaf1e)

---

## Key Features

- **Generative UI** — Zod-validated JSON streams into React (`StrategySkeleton` → `StrategyCard`) via `experimental_useObject`
- **Rust/WASM via Stylus** — custom `StrategyExecutor` on Arbitrum Sepolia, not a Solidity template
- **Demo Mode** — stealth footer toggle short-circuits AI + Web3 with perfect mock data for live pitches
- **16-Theme Custom CSS Engine** — Explorer / Quantum / ETH Lima / Arbiscan themes with instant class-based switching
- **Production hardening** — Pino structured logs, `/api/health`, Wagmi fee buffering, graceful loading UX

---

## Tech Stack

| Layer | Tools |
| --- | --- |
| App | **Next.js** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS v4** |
| AI | **Vercel AI SDK** · **`@ai-sdk/openai`** · **Zod** structured output |
| Web3 | **Wagmi v2** · **Viem** · **RainbowKit** · Arbitrum Sepolia |
| Contracts | **Arbitrum Stylus** · **Rust** · `stylus-sdk` **0.10.8** |
| Ops | **Pino** logging · Jest · GitHub Actions CI |

---

## Live Links

| Resource | URL |
| --- | --- |
| **Production app** | [https://arbiyield-ai-appx.vercel.app/](https://arbiyield-ai-appx.vercel.app/) |
| **Stylus contract (Arbiscan)** | [https://sepolia.arbiscan.io/address/0xdb76e1ca5056c550afcd2084fc571c7fef2e89ae](https://sepolia.arbiscan.io/address/0xdb76e1ca5056c550afcd2084fc571c7fef2e89ae) |
| **Contract address** | `0xdb76e1ca5056c550afcd2084fc571c7fef2e89ae` |

---

## Architecture (pitch-ready)

```text
User prompt
    │
    ▼
POST /api/chat  ──►  OpenAI (gpt-4o-mini) via Vercel AI SDK streamObject
    │                     Zod StrategySchema enforced
    ▼
experimental_useObject  ──►  StrategyCard (Generative UI)
    │
    ▼
wagmi writeContract  ──►  StrategyExecutor (Stylus / Rust WASM)
    │
    ▼
Arbitrum Sepolia ledger + Arbiscan receipt
```

Fail-safe path: footer **⚡ Demo Mode** → mock AI strategy + simulated tx (no RPC / OpenAI dependency on stage).

---

## Local Setup

### 1. Clone & install

```bash
git clone https://github.com/samgbm/arbiyield-ai-appx.git
cd arbiyield-ai-appx
npm install
```

### 2. Environment

Copy `.env.example` → `.env.local` and set:

```bash
OPENAI_API_KEY=sk-...your-key...
NEXT_PUBLIC_CONTRACT_ADDRESS=0xdb76e1ca5056c550afcd2084fc571c7fef2e89ae
NEXT_PUBLIC_ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

> Never commit real secrets. Prefer Alchemy / WalletConnect project keys in `.env.local` only.

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Optional checks

```bash
npm test
npm run lint
curl http://localhost:3000/api/health
```

### 5. Stylus contract (optional local verify)

```bash
cd arbi-yield-contract
cargo stylus check --endpoint https://sepolia-rollup.arbitrum.io/rpc
```

---

## Demo script (3 minutes)

1. Open the [live app](https://arbiyield-ai-appx.vercel.app/) and flip a theme.  
2. Prompt: *“Find me a low-risk USDC strategy”* — watch skeleton → streamed StrategyCard.  
3. Connect wallet (Arbitrum Sepolia) → **Execute on Arbitrum** → show Arbiscan tx.  
4. If anything flakes: tap the stealth **⚡** in the footer → Demo Mode → re-run the same flow flawlessly.  
5. Point judges at this README + the Stylus contract source under `arbi-yield-contract/`.

---

## License

Private hackathon submission · ETH Lima 2026 · Arbitrum & AI.



# MeleePMM — Parimutuel Market Maker (Arbitrum Stylus)

Single shared Stylus contract hosting many YES/NO markets with **entry-time anti-dilution floors**.

## Anti-dilution

On each `buyShares` deposit:

`minimum_return_floor += amount * total_pool_after / outcome_pool_after`

If that outcome wins, `claimWinnings` pays:

`max(pro_rata_share_of_total_pool, minimum_return_floor)`

Early buyers keep a locked payout floor even when late same-side capital would otherwise dilute classic parimutuel odds. Opposing capital still improves winners’ upside.

## Build & test

```bash
cd contracts/pmm-stylus
cargo test --features stylus-test
cargo build --release --target wasm32-unknown-unknown
# or: cargo stylus check
```

## Export Solidity ABI (for Next.js)

```bash
cd contracts/pmm-stylus
cargo stylus export-abi
# equivalent:
cargo run --features export-abi --target x86_64-unknown-linux-gnu
```

Copy the printed interface into `src/lib/pmmContract.ts` (`pmmABI`).

## Deploy (Arbitrum Sepolia)

```bash
cargo stylus deploy --endpoint "$RPC_URL" --private-key "$DEPLOYER_KEY"
```

Then set `NEXT_PUBLIC_PMM_CONTRACT_ADDRESS` in `.env.local`.
