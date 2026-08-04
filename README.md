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

Vercel-ready Next.js app. Pair with a Stylus contract deployed to Arbitrum Sepolia for the execute path.
