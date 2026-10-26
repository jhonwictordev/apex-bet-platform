# ⚡ Apex Bet & Casino — Plataforma Demonstrativa de Apostas e Cassino

> **AVISO DE CONFORMIDADE E JOGO RESPONSÁVEL (18+):**  
> Esta plataforma foi desenvolvida exclusivamente para fins de **demonstração, validação tecnológica e pesquisa de arquitetura de software**. Todos os saldos, transações, jogos e eventos operam com **créditos fictícios** sem qualquer valor financeiro real. **Não há depósitos, saques, premiações monetárias ou processamento de dinheiro real.**

---

## 🚀 1. Visão Geral do Projeto

Inspirada nas referências líderes do setor (**Stake, 1win, Bet365 e Sportingbet**), a plataforma **Apex Bet & Casino** foi projetada com arquitetura modular de microsserviços/módulos desacoplados, identidade visual dark premium (`#0B0E14`, `#151A23`, `#1D2430`, `#B4FF39`), carteira virtual atômica, motor de apostas esportivas, catálogo de provedores B2B e 6 jogos originais com RNG provably fair no servidor.

---

## 🛠️ 2. Stack Tecnológica

### Frontend
- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript.
- **Estilização:** Tailwind CSS com paleta dark premium e glow neons.
- **Ícones & Animações:** Lucide React, Framer Motion, HTML5 Canvas.
- **Gerenciamento de Estado:** React Context API + Hooks dedicados (`useAuth`, `useBetSlip`).

### Backend
- **Arquitetura:** Clean Architecture / Modular Gateway Pattern.
- **Runtime:** Node.js 20+ com TypeScript.
- **ORM & Banco de Dados:** Prisma ORM com SQLite local out-of-the-box (zero dependências externas para execução imediata) e suporte total a PostgreSQL em produção.
- **Segurança & Criptografia:** JWT (`jose`), hashing `bcryptjs`, HMAC-SHA256 para verificação de seeds e webhooks.
- **Testes Automatizados:** Test runner nativo `node:test` + asserções rigorosas de saldo, probabilidade e concorrência.

---

## 🎮 3. Jogos Demonstrativos Originais (Apex Originals)

Todos os jogos contam com validação estrita no servidor via HMAC-SHA256:

1. **Apex Crash (`/cassino/originais/apex-crash`):**  
   Curva exponencial de voo em tempo real desenhada via HTML5 Canvas, multiplicadores dinâmicos até 10.000x, cashout manual ou automático com parada precisa antes da explosão.
2. **Apex Mines (`/cassino/originais/apex-mines`):**  
   Grade 5x5 (25 peças) configurável de 1 a 24 minas, revelação de diamantes reluzentes, cálculo matemático de progressão de risco e botão de cashout imediato.
3. **Apex Plinko (`/cassino/originais/apex-plinko`):**  
   Pirâmide de pinos com física de queda simulada, seleção de linhas (8 a 16) e níveis de risco (Baixo, Médio, Alto) com multiplicadores de até 1.000x nas extremidades.
4. **Roulette Royale (`/cassino/originais/apex-roulette`):**  
   Roleta Europeia (0 a 36) autêntica, apostas internas (número pleno 36x) e externas (Vermelho/Preto, Par/Ímpar, Dúzias 3x) com animação 3D de rotação.
5. **Blackjack VIP Pro (`/cassino/originais/apex-blackjack`):**  
   Mesa de feltro verde com baralho de 6 decks, inteligência artificial do dealer jogando até 17 suave, suporte a *Hit* (pedir carta), *Stand* (parar) e Blackjack natural com retorno 3:2.
6. **Apex Cyber Dice (`/cassino/originais/apex-dice`):**  
   Controle deslizante de alvo (0 a 100), condições *Roll Over* ou *Roll Under*, cálculo em tempo real de margem da casa (1%) e chance de vitória.

---

## 🌐 4. Game Integration Gateway (Provedores B2B)

Camada universal de adaptadores que unifica a comunicação com múltiplos fornecedores internacionais:

| Provedor | Código | Adaptador | Status Padrão | Capacidades |
|---|---|---|---|---|
| **Apex Originals** | `inhouse` | `InHouseDemoAdapter` | `AVAILABLE_DEMO` | Execução direta no cliente, RNG provably fair, histórico em banco |
| **Pragmatic Play** | `pragmatic` | `PragmaticPlayAdapter` | `AWAITING_CREDENTIALS` | Sincronização de catálogo, launcher de sandbox demo oficial |
| **PG Soft** | `pgsoft` | `PGSoftAdapter` | `AWAITING_CREDENTIALS` | Mobile-first slots (Fortune Tiger, Fortune Rabbit, Ox, Dragon) |
| **Evolution Gaming**| `evolution`| `EvolutionAdapter` | `AWAITING_CREDENTIALS` | Live Casino (Crazy Time, Lightning Roulette, Monopoly) |
| **Spribe** | `spribe` | `SpribeAdapter` | `AWAITING_CREDENTIALS` | Crash Games (Aviator original e jogos turbo) |
| **BGaming** | `bgaming` | `BGamingAdapter` | `AWAITING_CREDENTIALS` | Slots dinâmicos e jogos casuais |
| **NetEnt** | `netent` | `NetEntAdapter` | `AWAITING_CREDENTIALS` | Slots lendários (Starburst, Gonzo's Quest) |
| **Playtech** | `playtech` | `PlaytechAdapter` | `AWAITING_CREDENTIALS` | Buffalo Blitz, Age of the Gods |
| **B2B Aggregator** | `aggregator`| `AggregatorAdapter` | `CONFIGURED` | Gateway universal para agregação unificada multi-estúdios |

### Operações Padronizadas dos Adaptadores
- `getProviderStatus()`
- `getGames()`
- `getGameDetails()`
- `getAuthorizedDemoLaunch()`
- `createDemoSession()`
- `closeDemoSession()`
- `synchronizeCatalog()`
- `validateCallback()`
- `healthCheck()`

---

## ⚽ 5. Motor de Apostas Esportivas (Sportsbook)

- **Modalidades:** Futebol, Basquete, Tênis, E-Sports (CS2), MMA, Vôlei, Futebol Americano.
- **Mercados:** Vencedor do Encontro (1X2 / Moneyline), Total de Gols/Pontos (Mais/Menos), Ambas as Equipes Marcam (BTTS).
- **Cupom de Apostas (Bet Slip):** Suporte a apostas Simples e Múltiplas (acumuladas/parlay) com cálculo de cotações acumuladas $\prod \text{odds}$.
- **Liquidação Automática:** Serviço backend que processa resultados de partidas, avalia bilhetes pendentes e credita os ganhos virtuais diretamente na carteira do jogador.
- **Cashout Antecipado:** Encerramento controlado da aposta antes do apito final.

---

## 💳 6. Carteira Virtual & Transações Atômicas

- **Saldo Fictício Inicial:** R$ 10.000,00 concedidos gratuitamente no cadastro.
- **Faucet Automático:** Botão de recarga instantânea sempre que o usuário desejar resetar ou obter novos créditos de teste.
- **Transações Atômicas:** Validação com bloqueio transacional (`prisma.$transaction`) que impede concorrência e saldo negativo não autorizado.
- **Extrato Transacional Completo:** Registro imutável de apostas, ganhos, estornos e recargas com saldo anterior e posterior.

---

## 🛡️ 7. Painel Administrativo Master (`/admin`)

O painel administrativo restrito para contas `ADMIN` e `SUPER_ADMIN` oferece:
1. **Dashboard & KPIs:** Total de usuários, apostas, rodadas de cassino, volume movimentado e auditoria.
2. **Gerenciamento de Provedores:** Teste de conexão com sandboxes, sincronização de catálogos e configuração segura de credenciais mascaradas.
3. **Gerenciador Esportivo:** Criação de novos confrontos, edição de placares ao vivo e liquidação de partidas.
4. **Moderação de Usuários:** Pesquisa de jogadores, alteração de permissões RBAC e suspensão temporária ou definitiva de contas.
5. **Auditoria de Segurança:** Registro de eventos sensíveis (logins, alterações de permissão, recargas).

---

## 🔑 8. Credenciais Pré-configuradas para Testes Locais

| Papel | E-mail | Senha | Saldo Virtual Inicial |
|---|---|---|---|
| **Super Administrador** | `admin@apex.bet` | `AdminPassword123!` | R$ 100.000,00 |
| **Suporte Técnico** | `suporte@apex.bet` | `SupportPassword123!` | R$ 50.000,00 |
| **Jogador Demonstrativo**| `jogador@apex.bet` | `DemoPassword123!` | R$ 10.000,00 |

---

## 💻 9. Guia de Instalação e Execução Local

### Pré-requisitos
- Node.js 18+ (recomendado 20 ou 24)
- npm 9+

### Passos de Instalação

```bash
# 1. Navegar até a pasta do projeto
cd C:\Users\winc\.gemini\antigravity\scratch\apex-bet-platform

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env

# 4. Gerar o cliente Prisma e sincronizar o banco SQLite local
npm run prisma:generate
npm run prisma:push

# 5. Executar o seeder com dados realistas
npm run prisma:seed

# 6. Rodar os testes automatizados
npm test

# 7. Iniciar a aplicação em modo de desenvolvimento ou produção
npm run dev
# ou
npm run build && npm run start
```

Acesse a aplicação no navegador em: **`http://localhost:3000`**

---

## 🐳 10. Execução com Docker & Docker Compose

Para executar a aplicação com Docker e Redis:

```bash
docker-compose up --build -d
```

---

## 🧪 11. Relatório dos Testes Automatizados

Executados via `npm test` (`node:test`):
- `✔ Crash Engine produces valid multipliers and respect house edge`
- `✔ Mines Engine calculates exponential multiplier curve with house edge`
- `✔ Plinko Engine drops ball and indexes correct certified slot`
- `✔ Roulette Engine calculates accurate European 0-36 payouts`
- `✔ Dice Engine computes fair payout multiplier with 1% house edge`
- `✔ Virtual Wallet: Atomic transaction integrity and balance rules`
- `✔ Sports Bet Engine: Parlay odds multiplication and settlement calculation`

**Total: 7/7 suites de teste aprovadas com 100% de sucesso.**

---

## 🔒 12. Checklist de Segurança e Boas Práticas

- [x] Zero manipulação de dinheiro real ou gateways de pagamento reais (PIX, cartões ou criptomoedas desabilitados).
- [x] Credenciais sensíveis nunca trafegadas ou expostas ao frontend (armazenadas protegidas no backend).
- [x] Validação estrita de maioridade (18+) no formulário de cadastro.
- [x] Ferramentas de autoexclusão voluntária (24h, 7 dias, 30 dias, 6 meses) e limites de tempo de sessão.
- [x] Proteção contra injeção de SQL e XSS garantida via Prisma ORM e tipagem estrita com TypeScript e Zod.
- [x] Rate limiting e transações com isolamento de concorrência.
- [x] Auditoria imutável de ações no modelo `AuditLog`.
