# Guia de Integração com Provedores de Jogos (B2B Game Gateway)

Este documento especifica a arquitetura técnica, protocolos de segurança e contratos de integração para conexão de provedores internacionais no **Apex Bet & Casino**.

---

## 1. Arquitetura do Game Integration Gateway

O sistema utiliza o padrão **Gateway / Adapter Pattern**, onde a aplicação se comunica exclusivamente com interfaces universais padronizadas (`IGameProviderAdapter`), isolando as peculiaridades de cada fornecedor.

```
┌──────────────────────────────────────────────┐
│            Game Integration Gateway          │
├──────────────────────┬───────────────────────┤
│ Provider Registry    │ Catalog Sync Service  │
│ Session Manager      │ HMAC Webhook Verifier │
│ Audit Logger         │ Error Sanitizer       │
└───────────┬──────────┴───────────┬───────────┘
            │                      │
   ┌────────▼────────┐    ┌────────▼────────┐
   │ PragmaticPlay   │    │     PG Soft     │
   │    Adapter      │    │     Adapter     │
   └─────────────────┘    └─────────────────┘
```

---

## 2. Provedores e Especificações Técnicas

### 2.1 Pragmatic Play (`PragmaticPlayAdapter`)
- **Protocolo de Integração:** Seamless Wallet API / Operator API.
- **Formato:** JSON sobre HTTPS / REST.
- **Autenticação:** Assinatura digital HMAC-SHA256 gerada com chave secreta do operador sobre o corpo da requisição ordenado.
- **Títulos Suportados:** *Gates of Olympus, Sweet Bonanza, Sugar Rush, Big Bass Bonanza, The Dog House*.
- **Endpoint Sandbox:** `https://api.pragmaticplay.net/v1` (ou ambiente staging do agregador parceiro).
- **Parâmetros de Lançamento de Demonstração:**
  ```
  https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?lang=pt&cur=BRL&gameSymbol={gameSymbol}
  ```

### 2.2 PG Soft (Pocket Games) (`PGSoftAdapter`)
- **Protocolo de Integração:** Operator Integration API (Mobile Webview).
- **Formato:** POST HTTPS x-www-form-urlencoded / JSON.
- **Autenticação:** `operator_token` + `secret_key` com hash MD5/SHA256 nos callbacks.
- **Títulos Suportados:** *Fortune Tiger, Fortune Rabbit, Fortune Ox, Fortune Dragon, Fortune Mouse*.
- **Endpoint Sandbox:** `https://api.pgsoft-games.com/v1`.
- **Modo Demonstração:** Inicialização com parâmetro `btt=1` (Bet Type Test) que carrega o jogo no modo créditos fictícios.

### 2.3 Evolution Gaming (`EvolutionAdapter`)
- **Protocolo de Integração:** ECashier Live Casino API.
- **Formato:** REST / WebSockets para feed de vídeo e transmissão de apostas.
- **Autenticação:** `casino_key` + `api_token` com validação de IP de origem (IP Allowlist obrigatória).
- **Títulos Suportados:** *Crazy Time, Lightning Roulette, Lightning Blackjack, Monopoly Live, Bac Bo*.
- **Endpoint Sandbox:** `https://api.evolution.com/v1`.

### 2.4 Spribe (`SpribeAdapter`)
- **Protocolo de Integração:** Turbo Games Gateway.
- **Formato:** RESTful JSON + Server-Sent Events / WebSockets.
- **Autenticação:** OAuth2 Client Credentials (`client_id`, `client_secret`).
- **Títulos Suportados:** *Aviator, Spribe Mines, Spribe Dice, Spribe Plinko*.
- **Endpoint Sandbox:** `https://api.spribe.io/v1`.

### 2.5 B2B Aggregator (`AggregatorAdapter`)
- **Objetivo:** Integração com agregadores universais (Ex: Slotegrator, SoftSwiss, EveryMatrix) que reúnem centenas de estúdios sob um protocolo único.
- **Operação:** Tradução dos modelos do agregador para a tipagem interna `StandardGameMetadata`.

---

## 3. Segurança e Auditoria

1. **Proteção de Credenciais:** Chaves de API e segredos nunca são transmitidos ao cliente/frontend. Ficam armazenados criptografados no modelo `ProviderCredentials`.
2. **IP Whitelisting:** Configuração no backend para aceitar requisições de webhooks apenas de IPs documentados dos fornecedores.
3. **Auditoria Imutável:** Todas as sessões geradas e respostas de health check são registradas no `ProviderSyncLog` e `AuditLog`.
