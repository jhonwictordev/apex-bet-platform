# Apex Bet & Casino — Next-Gen Sportsbook & Luxury Casino Platform

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2.15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Playwright-1.64-45ba4b?style=for-the-badge&logo=playwright" alt="Playwright" />
  <img src="https://img.shields.io/badge/License-MIT-B8FF32?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/Security-Hardened-emerald?style=for-the-badge" alt="Security" />
</p>

---

## 🌟 Overview

**Apex Bet & Casino** is a commercial-grade, full-stack web application inspired by the premier dark-luxury aesthetics of industry leaders (**Stake, 1win, Bet365, and Sportingbet**).

Designed for **educational and demonstrative purposes**, the platform operates on an exclusively virtual economy with simulated credits, zero monetary risk, and real-time live data feeds across global football and sports fixtures.

---

## 🚀 Key Architectural Pillars

### 1. ⚽ Real Sports Data Integration (3 Live Sources)
The platform features an automated sports gateway and synchronization engine with cross-provider deduplication:
- **TheSportsDB (Key `123`):** Official free public tier integration querying global sports, Premier League fixtures, and Brazilian club tournaments (`eventspastleague.php?id=4351`, `searchevents.php`), featuring high-resolution crests and venue metadata.
- **OpenLigaDB (Keyless Public API):** High-speed feed for the German Bundesliga (1. and 2. Bundesliga) and European leagues, incorporating change-date optimization (`/getlastchangedate`) to prevent redundant round-trips.
- **API-SPORTS (API-Football):** Individual free tier integration with automated rate-limiting budget management (100 requests/day quota tracker), masked key storage in the admin portal, and graceful fallback.
- **Sports Deduplicator:** Intelligent fuzzy-matching engine that merges duplicate fixtures across providers while preserving higher-priority official crests and live timestamps.

### 2. 🎰 6 In-House Provably Fair RNG Casino Titles
Equipped with an audit-ready HMAC-SHA256 random number generation (RNG) engine:
- **Apex Crash:** Continuous multiplier rise with sub-second cashout mechanics.
- **Apex Mines:** 5×5 tactical minefield with dynamic risk-adjusted payout curves.
- **Apex Plinko:** Ballistic physics simulation with certified pyramid pin distributions (up to 1,000×).
- **Roulette Royale:** European 37-pocket (0–36) single-zero table with interactive betting carpet.
- **Blackjack VIP:** Multi-deck shoe with soft-17 rules, double down, and split options.
- **Cyber Dice:** High-frequency probability slider with transparent house edge.

### 3. 🎨 Dark-Luxury Design System & Microinteractions
- **Color Tokens:** `#080B11` (Deep Space Background), `#10151E` (Surface Panels), `#19212D` (Elevated Cards), `#B8FF32` (Electric Neon Accent), and `#6DFFBE` (Mint Glow).
- **Tabular Figures (`.tabular-nums`):** Fixed-width numerals on all betting odds, match timers, multipliers, and scoreboards to prevent layout shift during live updates.
- **Responsive Viewport Support:** Built-in mobile touch dock (`MobileBottomNav`), collapsible sidebar navigation, and glassmorphic modals.
- **Automated Visual Testing:** Fully audited via Playwright across Desktop (1920×1080), Laptop (1440×900), Tablet (768×1024), and Mobile (390×844).

### 4. 🛡️ Enterprise Cybersecurity & Safety
- **Zero Real-Money Risk:** No deposit rails, credit card inputs, banking APIs, or monetary conversions exist in the codebase.
- **Zero Committed Secrets:** Strict `.gitignore` configuration guarantees `.env`, `.env.local`, SQLite databases, and private keys are never committed to version control.
- **Security Headers:** Enforced via `next.config.mjs` including HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and disabled technology fingerprinting (`poweredByHeader: false`).
- **Data Sanitization:** Passwords hashed with `bcryptjs`. Sensitive fields (`passwordHash`, `mfaSecret`) are stripped via `sanitizeUser()` before API responses are dispatched.

---

## 📁 Repository Structure

```
apex-bet-platform/
├── prisma/
│   ├── schema.prisma           # Prisma ORM schema (Users, Wallets, Bets, Sports, Games)
│   └── seed.mjs                # Database seeder with demo accounts and games
├── public/                     # Static brand assets and icons
├── scripts/
│   ├── visual-audit.mjs        # Automated Playwright multi-viewport visual test suite
│   └── seed.mjs                # Standalone database population script
├── src/
│   ├── app/                    # Next.js App Router (Pages & REST API Endpoints)
│   │   ├── admin/              # Master Administrative Console
│   │   ├── cassino/            # Stake-inspired Casino Lobby & Game Rooms
│   │   ├── esportes/           # Bet365/1win-inspired Editorial Sportsbook
│   │   ├── api/                # Secure API routes (Auth, Sports, Casino, Wallet)
│   │   ├── globals.css         # Tailwind tokens, glassmorphism & tabular figures
│   │   └── layout.tsx          # Root layout with responsive header, dock & modals
│   ├── components/             # Reusable Design System Component Library
│   │   ├── casino/             # CasinoGameCard (3:4 / 4:3 Stake style cards)
│   │   ├── home/               # HeroShowcase (Dark luxury cinematic hero)
│   │   ├── layout/             # PremiumHeader, SidebarNavigation, MobileBottomNav
│   │   └── sports/             # OddsDisplay, SportsEventCard, LiveScoreCard
│   ├── context/                # Global React contexts (Auth & Bet Slip)
│   ├── lib/                    # Core utilities, DB client, formatting & sanitizers
│   └── server/                 # Business logic, sports adapters & RNG engines
│       ├── core/               # Result wrappers & provably fair crypto engine
│       └── modules/sports/     # TheSportsDB, OpenLigaDB & API-SPORTS adapters
├── tests/                      # Automated unit and integration test suite
├── .env.example                # Documented configuration template (no secrets)
├── next.config.mjs             # Hardened security headers & remote image rules
├── package.json                # Project dependencies & automation scripts
├── SECURITY.md                 # Cybersecurity policy & vulnerability reporting
└── tailwind.config.js          # Dark-luxury theme tokens & custom shadows
```

---

## 🛠️ Quickstart Guide

### Prerequisites
- **Node.js:** `v20.x` or later
- **npm:** `v10.x` or later

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/jhonwictordev/apex-bet-platform.git
cd apex-bet-platform
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` (the `.env` file is ignored by Git for security):
```bash
cp .env.example .env
```

### 3. Initialize Database & Seed
```bash
# Push Prisma schema to local SQLite database
npx prisma db push

# Populate catalog with demo games, sports fixtures, and administrator
npm run prisma:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Production Build & Start
```bash
npm run build
npm start
```

---

## 🧪 Testing & Quality Assurance

### Run Automated Unit & Integration Tests
```bash
npm test
```
The test suite validates:
- RNG mathematical payout curves and house edges (Crash, Mines, Plinko, Roulette, Dice).
- Real HTTP connectivity with TheSportsDB (Key `123`) and OpenLigaDB.
- API-SPORTS rate-limiting budget and quota management.
- Multi-source fixture deduplication and team name fuzzy matching.
- Virtual wallet atomic balance guarantees and parlay bet calculations.

### Run Automated Visual Regression Audit (Playwright)
```bash
node scripts/visual-audit.mjs
```
Captures full visual screenshots across 4 responsive viewports (`1920x1080`, `1440x900`, `768x1024`, and `390x844`).

---

## 🔑 Demo Credentials

| Role | Username / Email | Password | Initial Virtual Balance |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@apexbet.demo` | `admin123` | R$ 10.000,00 (Unlimited Faucet) |
| **Test Player** | `jogador@apexbet.demo` | `jogador123` | R$ 10.000,00 (Unlimited Faucet) |

---

## ⚖️ Legal & Responsible Gaming Disclaimer

This software is developed strictly for educational, technical demonstration, and portfolio purposes.
- All currency presented on the platform is **100% virtual and fictitious**.
- There is **no mechanism** to deposit, withdraw, or win real monetary rewards.
- The project adheres to responsible gaming principles and is intended for adult audiences (18+).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
