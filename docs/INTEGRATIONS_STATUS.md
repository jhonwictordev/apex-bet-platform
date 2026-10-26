# Relação de Integrações do Sistema: Funcionais vs Pendentes

A arquitetura do **Apex Bet & Casino** foi projetada com transparência total: uma integração é declarada **concluída e funcional** apenas após a execução de testes rigorosos em ambiente real ou sandbox autorizado.

---

## 1. Integrações Funcionais e Operacionais

| Integração | Tipo | Camada | Status | Observações |
|---|---|---|---|---|
| **Apex Originals RNG Engine** | Cassino | Local / Backend | 🟢 **100% Funcional** | 6 jogos operacionais (Crash, Mines, Plinko, Roleta, Blackjack, Dice) com validação criptográfica HMAC-SHA256 e interface completa. |
| **Carteira Virtual Atômica** | Financeiro Fictício | Local / Backend | 🟢 **100% Funcional** | Isolamento de concorrência com `prisma.$transaction`, saldo não-negativo e faucet demonstrativo. |
| **Motor de Apostas Esportivas** | Sportsbook | Local / Backend | 🟢 **100% Funcional** | Apostas Simples e Múltiplas, odds dinâmicas, cupom interativo, liquidação de partidas e cashout antecipado. |
| **Simulador de Feed Esportivo** | Dados Esportivos | Local / Backend | 🟢 **100% Funcional** | Feeds ao vivo de futebol, basquete, tênis e e-sports com estatísticas e placares em tempo real. |
| **Autenticação & RBAC** | Segurança | Local / Backend | 🟢 **100% Funcional** | JWT com `jose`, hash de senhas com `bcryptjs`, 4 níveis de papéis (`USER`, `SUPPORT`, `ADMIN`, `SUPER_ADMIN`). |
| **Painel Administrativo Master** | Gestão | Local / Backend | 🟢 **100% Funcional** | Dashboard de KPIs, moderação de jogadores, gestão esportiva e trilhas de auditoria. |
| **Game Integration Gateway** | B2B Gateway | Local / Backend | 🟢 **100% Funcional** | Registro de provedores, sincronização de catálogo, health check e gerenciador de sessões. |

---

## 2. Integrações Preparadas (Aguardando Credenciais de Produção / Sandbox Comercial)

Os adaptadores abaixo possuem código-fonte completo, modelos de dados e rotinas de sincronização implementadas, aguardando apenas a inserção de chaves autorizadas no **Painel Admin**:

| Provedor | Adaptador | Status Técnico | Requisito para Ativação | Modo Fallback Atual |
|---|---|---|---|---|
| **Pragmatic Play** | `PragmaticPlayAdapter` | 🟡 Preparado | Chave de API e endpoint de sandbox comercial contratual. | Modo demonstrativo simulado local. |
| **PG Soft** | `PGSoftAdapter` | 🟡 Preparado | Operator Token e Secret Key emitidos pelo estúdio. | Modo demonstrativo simulado local. |
| **Evolution Gaming** | `EvolutionAdapter` | 🟡 Preparado | Casino Key e liberação de IP no firewall da Evolution. | Modo demonstrativo simulado local. |
| **Spribe** | `SpribeAdapter` | 🟡 Preparado | Client ID e Secret do portal de desenvolvedor Spribe. | Modo demonstrativo simulado local. |
| **BGaming** | `BGamingAdapter` | 🟡 Preparado | Auth Token e Endpoint Sandbox oficial. | Modo demonstrativo simulado local. |
| **NetEnt** | `NetEntAdapter` | 🟡 Preparado | Credenciais do agregador parceiro. | Modo demonstrativo simulado local. |
| **Playtech** | `PlaytechAdapter` | 🟡 Preparado | Chave de integração B2B. | Modo demonstrativo simulado local. |
| **The Odds API** | `SportsDataAdapter` | 🟡 Preparado | Chave no `.env` (`SPORTS_DATA_API_KEY`). | Feed demonstrativo de alta fidelidade local. |
| **API-Football** | `SportsDataAdapter` | 🟡 Preparado | Chave no `.env` (`SPORTS_DATA_API_KEY`). | Feed demonstrativo de alta fidelidade local. |
