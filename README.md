# ArbiYield AI

**ArbiYield AI** — Arbitrum Scaffold-Stylus + Generative AI Hackathon Project (ETH Lima 2026: Arbitrum & AI).

Prompt a DeFi yield strategy, get a safe generative UI card (APY, gas, Sign & Execute), then settle on **Arbitrum Sepolia** through a custom **Stylus (Rust/WASM)** contract — with demo-mode fallbacks for live pitches.

## Stack

- Next.js 16 · React 19 · Tailwind CSS v4 · TypeScript
- next-themes (theme engine)
- Jest + React Testing Library
- Arbitrum Stylus (Rust/WASM) · Arbitrum Sepolia

## Demo journey (target)

1. **Theme engine** — cycle custom themes instantly (no reload)
2. **AI prompting** — chat-like intent (“Generate a safe yield strategy for 100 USDC…”)
3. **Generative UI** — structured JSON → React strategy card + Sign & Execute
4. **Stylus speed run** — wallet signature → Sepolia confirm → Arbiscan toast link
5. **Demo mode** — graceful degradation on RPC/wallet/AI failure

## Develop

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

## Build

```bash
npm run build
npm start
```

## Deploy

### Frontend (Vercel)

Vercel-ready Next.js app. Set `NEXT_PUBLIC_CONTRACT_ADDRESS` (see `.env.example`) to the Stylus address below.

### Stylus contract — deployed on Arbitrum Sepolia ✅

Successfully deployed and activated with `cargo stylus deploy`:

| | |
|---|---|
| **Contract** | [`0xdb76e1ca5056c550afcd2084fc571c7fef2e89ae`](https://sepolia.arbiscan.io/address/0xdb76e1ca5056c550afcd2084fc571c7fef2e89ae) |
| **Deployment tx** | [`0x0b55fef85ed6120415e2e76bc00c29e40babb2573c192733e12a030c80153ae2`](https://sepolia.arbiscan.io/tx/0x0b55fef85ed6120415e2e76bc00c29e40babb2573c192733e12a030c80153ae2) |
| **Activation tx** | [`0xf69a44f436cf2dcc5d4a9bcd00c960589069c8615cb371bfcbe01da67cfbaf1e`](https://sepolia.arbiscan.io/tx/0xf69a44f436cf2dcc5d4a9bcd00c960589069c8615cb371bfcbe01da67cfbaf1e) |
| **Network** | Arbitrum Sepolia |
| **WASM data fee** | ~0.000081 ETH (20% bump on estimate) |

Contract source: `arbi-yield-contract/` (`StrategyExecutor`).

```bash
cd arbi-yield-contract
cargo stylus check --endpoint https://sepolia-rollup.arbitrum.io/rpc
cargo stylus deploy --endpoint https://sepolia-rollup.arbitrum.io/rpc --private-key <KEY>
```
