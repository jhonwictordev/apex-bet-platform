# Arquitetura do Sistema — Apex Bet & Casino

## 1. Visão Arquitetural

```mermaid
flowchart TD
    Client["Navegador do Usuário / Frontend Next.js\n(React 18 + Tailwind + Zustand + Context)"]

    subgraph PlatformCore["Apex Platform Core"]
        Gateway["Game Integration Gateway\n(Provider Registry)"]
        BetEngine["Sports Bet Engine\n(Odds & Parlay Calculator)"]
        WalletService["Virtual Wallet Service\n(Atomic Transactions & Faucet)"]
        AuthSecurity["Auth & RBAC Security\n(JWT & Password Hashing)"]
        RNGServer["In-House RNG Engine\n(Crash, Mines, Plinko, Roulette, Blackjack, Dice)"]
    end

    subgraph DataStorage["Camada de Persistência"]
        DB[("Prisma ORM\n(SQLite / PostgreSQL)")]
        Audit[("Audit Logs Ledger")]
    end

    subgraph ExternalAdapters["Game Provider Adapters"]
        Pragmatic["PragmaticPlayAdapter"]
        PGSoft["PGSoftAdapter"]
        Evolution["EvolutionAdapter"]
        Spribe["SpribeAdapter"]
        BGaming["BGamingAdapter"]
        Aggregator["AggregatorAdapter"]
    end

    Client -->|API REST & JWT| AuthSecurity
    Client -->|Cupom de Apostas| BetEngine
    Client -->|Jogos Originais| RNGServer
    Client -->|Extrato & Faucet| WalletService
    Client -->|Lançamento de Jogos| Gateway

    Gateway --> ExternalAdapters
    BetEngine --> WalletService
    RNGServer --> WalletService

    WalletService --> DB
    BetEngine --> DB
    AuthSecurity --> DB
    Gateway --> DB
    AuthSecurity --> Audit
```

---

## 2. Diagrama de Sequência: Apostas Esportivas e Liquidação

```mermaid
sequenceDiagram
    autonumber
    actor Player as Jogador (Demo)
    participant Slip as Cupom de Apostas
    participant BetEngine as Sports Bet Engine
    participant Wallet as Virtual Wallet Service
    participant DB as Banco de Dados
    actor Admin as Painel Admin

    Player->>Slip: Adiciona Seleções (Arsenal Odd 2.85, Lakers Odd 2.35)
    Player->>Slip: Informa Valor (R$ 50,00) e Clica em "Confirmar"
    Slip->>BetEngine: POST /api/sports/bet (selections, stake)
    BetEngine->>Wallet: debitVirtualBalance(userId, 50.00, 'SPORTS_BET')
    Wallet->>DB: Verifica Saldo e Atualiza Atômico (prisma.$transaction)
    Wallet-->>BetEngine: Débito Confirmado
    BetEngine->>DB: Cria Bet (Status: PENDING) e BetSelections
    BetEngine-->>Player: Bilhete Registrado

    Note over Admin,BetEngine: Partida é finalizada e resultado inserido
    Admin->>BetEngine: PATCH /api/admin/sports/events (scores, winningOddIds)
    BetEngine->>DB: Atualiza Status das Odds e Selections (WON/LOST)
    BetEngine->>BetEngine: Avalia Bilhetes Afetados
    BetEngine->>Wallet: creditVirtualBalance(userId, potentialReturn, 'SPORTS_WIN')
    Wallet->>DB: Credita Saldo Virtual Atômico
    BetEngine->>DB: Gera Notificação de Vitória
```

---

## 3. Entidades do Banco de Dados (Prisma Schema)

- **Contas & Autenticação:** `User`, `Session`, `ComplianceSettings`
- **Carteira Virtual:** `Wallet`, `WalletTransaction` (Ledger atômico com saldo antes/depois)
- **Provedores & Catálogo:** `Provider`, `ProviderCredentials`, `ProviderIntegration`, `ProviderSyncLog`, `GameCategory`, `Game`, `GameSession`, `DemoGameRound`
- **Apostas Esportivas:** `Sport`, `Competition`, `SportEvent`, `Market`, `Odd`, `Bet`, `BetSelection`
- **Suporte & Auditoria:** `SupportTicket`, `TicketMessage`, `Notification`, `AuditLog`, `SystemSettings`
