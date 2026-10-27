# Cybersecurity & Security Policy — Apex Bet & Casino

Apex Bet & Casino is an enterprise-grade demonstrative sportsbook and casino simulation platform engineered with a defense-in-depth architecture. This document outlines our cybersecurity measures, threat mitigation strategies, and responsible vulnerability disclosure process.

---

## 1. Zero-Risk Architecture & Monetary Boundary

- **Exclusively Demonstrative:** The platform utilizes 100% simulated credits (`R$ Fictício`).
- **No Monetary Rails:** There are **zero** payment gateways, bank transfers, credit card inputs, cryptocurrency deposit wallets, or withdrawal channels in the codebase.
- **No Financial Arbitrage:** Virtual balances cannot be exchanged, converted, or withdrawn into real currency under any circumstances.

---

## 2. Cryptographic Provably Fair RNG Engine

All original casino titles (**Apex Crash, Apex Mines, Apex Plinko, Roulette Royale, Blackjack VIP, and Cyber Dice**) are governed by a server-side cryptographic engine:

- **Algorithm:** Deterministic HMAC-SHA256 generation using `Server Seed`, `Client Seed`, and `Nonce`.
- **Pre-Commitment:** The server seed hash is committed before the round commences, ensuring zero outcome manipulation after player wagers are registered.
- **Auditability:** Outcomes can be mathematically validated post-round by hashing the revealed seeds.

---

## 3. Defense-in-Depth Cybersecurity Controls

### 3.1. Credential & Environment Protection
- **No Committed Secrets:** All `.env`, `.env.local`, and credential files are strictly blocked by `.gitignore`.
- **Secret Masking:** Third-party API keys (e.g., API-SPORTS, B2B Provider Sandboxes) stored via the admin console are masked upon persistence (`ak_****...`) and never leaked through unauthenticated or public JSON responses.
- **Rate-Limiting & Quota Management:** Built-in quota manager tracks outbound API consumption (e.g., 100 requests/day for API-SPORTS free tier) to prevent upstream rate-limit bans or denial-of-service degradation.

### 3.2. Data Sanitization & Session Management
- **Password Hashing:** Passwords are salted and hashed with `bcryptjs`.
- **Response Sanitization:** The `sanitizeUser()` core helper strips all `passwordHash`, `mfaSecret`, and session tokens before any payload serialization.
- **Role-Based Access Control (RBAC):** Explicit role verification (`USER`, `ADMIN`, `SUPER_ADMIN`) protects all administration endpoints (`/api/admin/*`) and settings portals.

### 3.3. HTTP Security Headers
The platform serves hardened HTTP headers on every request via `next.config.mjs`:
- `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options`: `nosniff` (mitigates MIME-type sniffing)
- `X-Frame-Options`: `SAMEORIGIN` (prevents clickjacking attacks)
- `X-XSS-Protection`: `1; mode=block`
- `Referrer-Policy`: `strict-origin-when-cross-origin`
- `Permissions-Policy`: Restricts camera, microphone, geolocation, and browsing-topics APIs.
- `poweredByHeader`: Disabled (`false`) to eliminate framework fingerprinting.

---

## 4. Reporting a Security Vulnerability

If you discover a security vulnerability or security misconfiguration within this repository, please disclose it responsibly:

1. **Do not** open public issues or public pull requests discussing unpatched vulnerabilities.
2. Submit a private vulnerability report via GitHub Security Advisories or contact the repository owner directly.
3. Include detailed reproduction steps, proof of concept (PoC), and affected components.
4. We aim to acknowledge receipt within 48 hours and provide remediation milestones.
