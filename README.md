# ArbiYield AI

**One scaffold, three live demos on Arbitrum Sepolia: AI yield strategies, prediction markets, and El Niño climate resilience — each backed by a Stylus contract judges can verify on Arbiscan.**


|              |                                                                                    |
| ------------ | ---------------------------------------------------------------------------------- |
| **Event**    | ETH Lima 2026 · Arbitrum Stylus · Generative AI                                    |
| **Live app** | [https://arbiyield-ai-appx.vercel.app/](https://arbiyield-ai-appx.vercel.app/)     |
| **Network**  | Arbitrum Sepolia (`421614`)                                                        |
| **Repo**     | [github.com/samgbm/arbiyield-ai-appx](https://github.com/samgbm/arbiyield-ai-appx) |


---



## What we built

ArbiYield AI is a Next.js dapp with an **app switcher** that walks judges through three production-shaped modules on the same stack (Wagmi + RainbowKit + Supabase + Vercel AI SDK):

1. **Yield Strategies** — natural language → Generative UI strategy card → `createStrategy(id)` on Stylus; rich metadata + execution steps in Supabase
2. **MeleePMM Prediction Markets** — YES/NO parimutuel markets with anti-dilution floors, AI+Tavily oracle research, on-chain resolve
3. **El Niño Climate Resilience** — crowdfunded ETH relief pool, farmer policies, keccak aid logistics, zero-click rainfall payouts

**Demo Mode** (header toggle) short-circuits RPC/AI with mock data for resilient live pitches. **Live Network** uses real Arbitrum Sepolia + Supabase.

---



## Problem & impact



### Overall

AI demos often stop at chat UI. DeFi and climate tooling need **verifiable L2 state**. ArbiYield AI pairs generative interfaces with **custom Rust Stylus contracts** so every pitch step can end in an Arbiscan receipt.

### Yield

- **Problem:** Strategy “tips” are opaque and not attributable on-chain.  
- **Impact:** Intent becomes a permanent Stylus record (`id` + `creator`); playbooks live off-chain for gas efficiency.



### Prediction markets

- **Problem:** Classic parimutuel dilutes early YES/NO capital; resolution is slow and opaque.  
- **Impact:** Entry-time **minimum return floors**; AI oracle researches the web (Tavily) and the creator signs `resolveMarket` on-chain.



### El Niño / climate resilience

- **Problem:** Coastal floods devastate co-ops; aid is diverted; banking payouts are slow.  
- **Impact:** Global donors fund an ETH pool; logistics hashes notarize the supply chain; rainfall ≥ 50mm triggers **parametric ETH payouts** from the pool with near-zero Arbitrum fees.

---



## Why Arbitrum + Stylus


| Choice                   | Why it matters                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Arbitrum Sepolia**     | Live, judge-verifiable txs; cheap enough for crowdfunding + trading demos                                            |
| **Stylus (Rust → WASM)** | Express anti-dilution math, hash checkpoints, and parametric payouts in Rust; Solidity-compatible ABI for wagmi/viem |
| **SDK**                  | `stylus-sdk = "0.10.8"`                                                                                              |


Stylus maps Rust `snake_case` → Solidity `camelCase` (e.g. `verify_aid_batch` → `verifyAidBatch`).

---



## Deployed smart contracts (Arbitrum Sepolia)


| Module  | Contract                        | Address                                      | Arbiscan                                                                               |
| ------- | ------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| Yield   | StrategyExecutor                | `0x0d5170e733955952906011451dd89b7059e973a3` | [View](https://sepolia.arbiscan.io/address/0x0d5170e733955952906011451dd89b7059e973a3) |
| Markets | MeleePMM                        | `0x558a0f52d9fc7c0b13afe7965f6e757d6812527c` | [View](https://sepolia.arbiscan.io/address/0x558a0f52d9fc7c0b13afe7965f6e757d6812527c) |
| El Niño | NINO (logistics + pool + relay) | `0x3b22f5c054919b8798d1422e92ba57f53b63570b` | [View](https://sepolia.arbiscan.io/address/0x3b22f5c054919b8798d1422e92ba57f53b63570b) |


**Sources:** `arbi-yield-contract/`, `contracts/pmm-stylus/`, `contracts/elnino-stylus/`  
**Env vars:** `NEXT_PUBLIC_CONTRACT_ADDRESS`, `NEXT_PUBLIC_PMM_CONTRACT_ADDRESS`, `NEXT_PUBLIC_NINO_CONTRACT_ADDRESS`

---



## Main on-chain transactions



### Yield — StrategyExecutor


| Action            | Function                                                           |
| ----------------- | ------------------------------------------------------------------ |
| Register strategy | `createStrategy(string id)`                                        |
| List / ownership  | `getAllStrategies()`, `getStrategiesByOwner`, `getStrategyCreator` |
| Events            | `StrategyCreated`, `StrategyExecuted`                              |




### Markets — MeleePMM


| Action                   | Function                                    |
| ------------------------ | ------------------------------------------- |
| Create market            | `createMarket(uint64 end_timestamp)`        |
| Trade                    | payable `buyShares(market_id, outcome_id)`  |
| Exit early               | `cashoutShares`                             |
| Resolve (creator/oracle) | `resolveMarket(market_id, winning_outcome)` |
| Claim                    | `claimWinnings`                             |


**Anti-dilution:** on each `buyShares`,  
`minimum_return_floor += amount * total_pool_after / outcome_pool_after`.  
Winners receive `max(pro_rata, minimum_return_floor)`.

### El Niño — NINO Stylus


| Action                | Function                                                     |
| --------------------- | ------------------------------------------------------------ |
| Donate to relief pool | payable `donate()`                                           |
| Onboard farmers       | `batchRegisterFarmers(...)`                                  |
| Seal logistics step   | `logAidCheckpoint(batch_hash, location_name)`                |
| Verify / flag         | `verifyAidBatch`, `flagAidBatch`                             |
| Zero-click payout     | `processClimateRelay(location_id, rainfall_mm)`              |
| Pool views            | `getPoolStats`, `getDonation`, `getDonorAt`, `getPolicy`     |
| Events                | `DonationReceived`, `AidCheckpointLogged`, `PayoutDisbursed` |


Demo logistics tip hash (AID-001):  
`0x4a49292c1af239d2462d308e430dacc7292dc9b84c9df3ab6e02ef684f84f13f`

---



## Architecture



### On-chain vs off-chain

```text
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App                              │
│  Header · App Switcher · Demo Mode · Themes · RainbowKit        │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                ▼                             ▼
     Arbitrum Sepolia (Stylus)          Supabase + AI APIs
 ┌──────────────────────────┐    ┌──────────────────────────────┐
 │ StrategyExecutor         │    │ strategies (metadata, steps) │
 │ MeleePMM                 │    │ markets (title, category)    │
 │ NINO (pool + aid + relay)│    │ aid_shipments / checkpoints  │
 └──────────────────────────┘    │ /api/chat · /api/markets/*   │
                                 │ /api/health · /api/swagger   │
                                 └──────────────────────────────┘
```


| On-chain (gas-critical truth)                         | Off-chain (UX + enrichment)                                   |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| Strategy `id` + `creator`                             | Name, APY, narrative, execution steps                         |
| Market pools, positions, floors, resolution           | Title, description, category                                  |
| ETH relief pool, policies, checkpoint hashes, payouts | Human-readable logistics trail, QR deep links                 |
| —                                                     | OpenAI strategy stream; Tavily research for oracle suggestion |




### Module flows

**Yield**

```text
Prompt → POST /api/chat (streamObject + Zod)
      → StrategyCard (Generative UI)
      → wagmi createStrategy(id)
      → Supabase strategies row (metadata + steps)
```

**Markets**

```text
AI deploy card → createMarket + Supabase metadata
             → buyShares / cashout / claim
             → POST /api/markets/resolve (AI + Tavily)
             → creator signs resolveMarket
```

**El Niño**

```text
donate() → batchRegisterFarmers → logAidCheckpoint chain
        → verifyAidBatch (QR / hash)
        → processClimateRelay (≥50mm) → ETH payouts from pool
```



### App routes


| Path                  | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `/`                   | Presentation home — contract chips + recent txs |
| `/strategies`         | Live yield hub                                  |
| `/strategies/create`  | AI strategy generator                           |
| `/strategies/[id]`    | Detail + execution steps                        |
| `/markets`            | Market hub                                      |
| `/markets/create`     | AI market deploy card                           |
| `/markets/[id]`       | Trade + live stream + resolve                   |
| `/markets/portfolio`  | User positions                                  |
| `/el-nino`            | Mission overview / demo guide                   |
| `/el-nino/funding`    | Crowdfunding pool                               |
| `/el-nino/onboarding` | Farmer batch register                           |
| `/el-nino/register`   | Seal checkpoint                                 |
| `/el-nino/logistics`  | QR / hash tracker                               |
| `/el-nino/oracle`     | Climate relay + payout feed                     |
| `/docs`               | Swagger API docs                                |
| `/health`             | System status                                   |




### API routes


| Route                            | Role                                 |
| -------------------------------- | ------------------------------------ |
| `POST /api/chat`                 | Stream structured yield strategy     |
| `GET/POST /api/markets/metadata` | Market metadata CRUD (Supabase)      |
| `POST /api/markets/resolve`      | AI oracle YES/NO/UNDECIDED + sources |
| `GET /api/health`                | Supabase + RPC + OpenAI probes       |
| `GET /api/swagger`               | OpenAPI for `/docs`                  |


---



## Tech stack

**Suggested hackathon tags (≤20):**  
`Arbitrum Stylus`, `Rust`, `WASM`, `Next.js`, `React`, `TypeScript`, `Wagmi`, `Viem`, `RainbowKit`, `Vercel AI SDK`, `OpenAI`, `Supabase`, `TanStack Query`, `Zod`, `Tailwind CSS`, `Tavily`, `Jest`, `Pino`, `Zustand`, `Recharts`


| Layer      | Tools                                                                                  |
| ---------- | -------------------------------------------------------------------------------------- |
| App        | Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4                        |
| AI         | Vercel AI SDK · `@ai-sdk/openai` · Zod structured output · Tavily                      |
| Web3       | Wagmi v2 · Viem · RainbowKit · Arbitrum Sepolia                                        |
| Data       | Supabase (`strategies`, `markets`, `aid_*`)                                            |
| Contracts  | Arbitrum Stylus · Rust · `stylus-sdk` 0.10.8                                           |
| UX / state | Zustand (Demo Mode) · TanStack Query · Sonner · Lucide · Recharts · multi-theme engine |
| Ops        | Pino · Jest · ESLint · GitHub Actions · `next-swagger-doc`                             |


---



## UX principles

The product aims to feel **snappy, responsive, and resilient**:

- Skeleton / loading states on hubs, scanners, and strategy detail  
- Optimistic Demo Mode for stage demos when RPC/AI flake  
- Wagmi fee buffering on Arbitrum Sepolia writes  
- Health page + `/api/health` for dependency visibility  
- Header: Create submenu, Fund, API Docs, System Status

---



## Demo Mode vs Live Network


|         | **Live Network**                 | **Demo Mode**                                   |
| ------- | -------------------------------- | ----------------------------------------------- |
| Yield   | OpenAI stream + `createStrategy` | Instant mock StrategyCard + fake tx hash        |
| Markets | Chain + Supabase                 | `mockMarkets` + local created markets           |
| El Niño | Real donate / verify / relay     | Local pool + demo trail (`DEMO_AID_BATCH_HASH`) |


Toggle lives in the **header** (persisted via Zustand / `localStorage`).

---



## Local setup



### 1. Install

```bash
git clone https://github.com/samgbm/arbiyield-ai-appx.git
cd arbiyield-ai-appx
npm install
```



### 2. Environment

Copy `.env.example` → `.env.local`:

```bash
NEXT_PUBLIC_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
NEXT_PUBLIC_CONTRACT_ADDRESS=0x0d5170e733955952906011451dd89b7059e973a3
NEXT_PUBLIC_PMM_CONTRACT_ADDRESS=0x558a0f52d9fc7c0b13afe7965f6e757d6812527c
NEXT_PUBLIC_NINO_CONTRACT_ADDRESS=0x3b22f5c054919b8798d1422e92ba57f53b63570b
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
# Optional seeder for npm run seed*:
# SEEDER_PRIVATE_KEY=0x...
```

Never commit secrets. Prefer Alchemy / WalletConnect keys only in `.env.local`.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Checks & seeds

```bash
npm test
npm run lint
curl http://localhost:3000/api/health

npm run seed              # MeleePMM markets + Supabase metadata
npm run seed:strategies   # createStrategy + strategies table
npm run seed:aid          # 10 aid trails + logAidCheckpoint
```



### 5. Stylus (optional)

```bash
cd arbi-yield-contract && cargo stylus check --endpoint https://sepolia-rollup.arbitrum.io/rpc
cd ../contracts/pmm-stylus && cargo test --features stylus-test
cd ../elnino-stylus && cargo stylus check --endpoint https://sepolia-rollup.arbitrum.io/rpc
```

Export Melee ABI:

```bash
cd contracts/pmm-stylus
cargo stylus export-abi
# paste into src/lib/pmmContract.ts
```

---



## Pitch script (~5 minutes)

1. **Home (**`/`**)** — show three contract chips + recent Arbiscan txs.
2. **Yield** — `/strategies/create` → prompt *“low-risk USDC on Arbitrum”* → stream card → sign `createStrategy` → open `/strategies`.
3. **Markets** — `/markets` → open a market → `buyShares` → AI Resolve research → note anti-dilution floor.
4. **El Niño** — `/el-nino/funding` donate → `/el-nino/logistics` paste demo hash / Simulate QR → `/el-nino/oracle` trigger rainfall → show `PayoutDisbursed`.
5. **Fail-safe** — flip **Demo Mode** if anything flakes; finish the story.
6. Point judges at `/docs`, `/health`, and this README.

---



## Architecture link (hackathon form)

Use this README as the architecture document:

**[https://github.com/samgbm/arbiyield-ai-appx/blob/main/README.md](https://github.com/samgbm/arbiyield-ai-appx/blob/main/README.md)**

(Or the deployed app home + contract Arbiscan links above.)

---

```
Hackathon form 
```



### Título del proyecto

```text
ArbiYield AI
```



### Historia

```text
Las herramientas de IA y DeFi suelen quedarse en demos de chat sin estado verificable. En Latinoamérica, además, las cooperativas costeras enfrentan inundaciones por El Niño con ayuda lenta, opaca y fácil de desviar. ArbiYield AI resuelve ambos frentes: convierte intención en registros on-chain y lleva resiliencia climática a pagos paramétricos.

Construimos un dapp en Arbitrum Sepolia con tres módulos Stylus (Rust/WASM): (1) estrategias de yield generadas por IA y notarizadas on-chain, (2) mercados de predicción MeleePMM con pisos anti-dilución y oráculo AI+Tavily, y (3) un pool ETH de ayuda El Niño con logística keccak y payouts zero-click cuando la lluvia supera 50mm.

Arbitrum es el núcleo de la solución: fees bajos para donar y operar, Stylus para lógica Rust expresiva (matemática de mercados, hashes de cadena de suministro, dispersión paramétrica), y Arbiscan para que jueces y donantes auditen cada transacción en vivo.
```



### Descripción detallada

```text
ArbiYield AI es un scaffold Next.js 16 + React 19 orientado a hackathon, con app switcher Yield → Markets → El Niño.

Yield: el usuario describe un perfil de riesgo; /api/chat usa Vercel AI SDK + Zod para streamear una StrategyCard. Al firmar, createStrategy(id) registra id+creator en StrategyExecutor (Stylus). Metadatos, APY y pasos de ejecución viven en Supabase.

Markets: MeleePMM hospeda mercados YES/NO. buyShares aplica un minimum_return_floor para proteger capital temprano. La UI fusiona estado on-chain con metadata en Supabase. El oráculo AI investiga con Tavily; el creador firma resolveMarket.

El Niño: donate() fondea un pool ETH; batchRegisterFarmers crea pólizas; logAidCheckpoint sella hashes de checkpoints (granja→fábrica→depósito→tienda); verifyAidBatch valida el tip hash (QR). processClimateRelay dispara payouts ETH a agricultores activos cuando rainfall_mm ≥ 50.

Off-chain: Supabase, OpenAI, Tavily, Swagger (/docs), health checks. Demo Mode en el header permite pitch sin depender de RPC/AI. Contratos: StrategyExecutor 0x0d5170e7…, MeleePMM 0x558a0f52…, NINO 0x3b22f5c0… en Arbitrum Sepolia.
```



### Uso de Arbitrum

```text
Toda la verdad económica y de provenance vive en Arbitrum Sepolia vía tres contratos Stylus (Rust compilado a WASM, stylus-sdk 0.10.8):

1) StrategyExecutor — createStrategy y lecturas de ownership/listado. Permite notarizar estrategias generadas por IA con costo L2 bajo.
2) MeleePMM — createMarket, buyShares (payable), cashoutShares, resolveMarket, claimWinnings. La matemática anti-dilución corre en Rust on-chain.
3) NINO — donate (payable), batchRegisterFarmers, logAidCheckpoint, verifyAidBatch, processClimateRelay y vistas del pool. El crowdfunding y los payouts paramétricos usan ETH real en L2; los fees mínimos de Arbitrum hacen viable que casi el 100% de la donación llegue al campo.

Elegimos Arbitrum + Stylus porque necesitamos (a) verificación pública en Arbiscan para jueces/donantes, (b) fees bajos para trading y ayuda humanitaria, y (c) Rust para lógica que sería frágil o costosa en Solidity puro. La dapp habla a los contratos con wagmi/viem y RainbowKit; la metadata pesada permanece en Supabase para no quemar gas.
```



### Problema e impacto

```text
Problema: (1) Las recomendaciones DeFi/AI no dejan rastro auditable. (2) Los mercados parimutuel clásicos diluyen a early buyers y resuelven de forma opaca. (3) Tras lluvias extremas por El Niño, las cooperativas costeras esperan días o semanas por ayuda bancaria, mientras la logística de insumos es difícil de auditar.

A quién afecta: retail DeFi y builders que necesitan demos verificables; traders de predicción; cooperativas agrícolas costeras, donantes globales y operadores humanitarios en LatAm.

Cambio esperado: intenciones de yield convertidas en registros Stylus; mercados con floors anti-dilución y resolución asistida por IA pero sellada on-chain; un pool ETH crowdfundeado que paga automáticamente cuando un relayer reporta rainfall ≥ 50mm, con cadena de hashes de ayuda verificable (Stylus + Supabase). Impacto: transparencia, velocidad y confianza — medibles en transacciones Arbiscan, no solo en slides.
```



### Tecnologías (lista)

```text
Arbitrum Stylus
Rust
WASM
Next.js
React
TypeScript
Wagmi
Viem
RainbowKit
Vercel AI SDK
OpenAI
Supabase
TanStack Query
Zod
Tailwind CSS
Tavily
Jest
Pino
Zustand
Recharts
```



### Smart contracts (form rows)


| Network label    | Chain slug         | Address                                      |
| ---------------- | ------------------ | -------------------------------------------- |
| Arbitrum Sepolia | `arbitrum-sepolia` | `0x0d5170e733955952906011451dd89b7059e973a3` |
| Arbitrum Sepolia | `arbitrum-sepolia` | `0x558a0f52d9fc7c0b13afe7965f6e757d6812527c` |
| Arbitrum Sepolia | `arbitrum-sepolia` | `0x3b22f5c054919b8798d1422e92ba57f53b63570b` |


> If the form only lists **Arbitrum One**, note in the architecture text that demos are on **Arbitrum Sepolia** (Stylus-eligible testnet) and paste Sepolia addresses + Arbiscan links.



### Arquitectura (URL)

```text
https://github.com/samgbm/arbiyield-ai-appx/blob/main/README.md
```



### Pitch (short)

```text
ArbiYield AI: tres demos Stylus en un solo dapp. Prompt → estrategia on-chain. Mercados con anti-dilución + oráculo AI. Pool El Niño que paga ETH solo cuando llueve ≥50mm — todo verificable en Arbiscan Sepolia.
```



### Documentos adicionales (sugeridos)


| Etiqueta         | URL                                                                              |
| ---------------- | -------------------------------------------------------------------------------- |
| App en vivo      | `https://arbiyield-ai-appx.vercel.app/`                                          |
| StrategyExecutor | `https://sepolia.arbiscan.io/address/0x0d5170e733955952906011451dd89b7059e973a3` |
| MeleePMM         | `https://sepolia.arbiscan.io/address/0x558a0f52d9fc7c0b13afe7965f6e757d6812527c` |
| El Niño NINO     | `https://sepolia.arbiscan.io/address/0x3b22f5c054919b8798d1422e92ba57f53b63570b` |
| API Docs         | `https://arbiyield-ai-appx.vercel.app/docs`                                      |
| System Status    | `https://arbiyield-ai-appx.vercel.app/health`                                    |


---



## License

Private hackathon submission · ETH Lima 2026 · Arbitrum & AI.