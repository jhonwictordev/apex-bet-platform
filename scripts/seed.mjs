import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Create Default Users
  const adminPasswordHash = await bcrypt.hash("AdminPassword123!", 10);
  const supportPasswordHash = await bcrypt.hash("SupportPassword123!", 10);
  const demoUserPasswordHash = await bcrypt.hash("DemoPassword123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@apex.bet" },
    update: {},
    create: {
      email: "admin@apex.bet",
      username: "admin_master",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      isEmailVerified: true,
      birthDate: new Date("1990-01-01"),
      wallet: {
        create: {
          demoBalance: 100000.0,
          currency: "BRL",
          totalDepositedVirtual: 100000.0,
        },
      },
      compliance: {
        create: {
          sessionTimeLimitMinutes: 120,
        },
      },
    },
  });

  const support = await prisma.user.upsert({
    where: { email: "suporte@apex.bet" },
    update: {},
    create: {
      email: "suporte@apex.bet",
      username: "support_agent",
      passwordHash: supportPasswordHash,
      role: "SUPPORT",
      isEmailVerified: true,
      wallet: {
        create: {
          demoBalance: 50000.0,
          currency: "BRL",
        },
      },
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "jogador@apex.bet" },
    update: {},
    create: {
      email: "jogador@apex.bet",
      username: "demo_player",
      passwordHash: demoUserPasswordHash,
      role: "USER",
      isEmailVerified: true,
      birthDate: new Date("1998-05-15"),
      wallet: {
        create: {
          demoBalance: 10000.0,
          currency: "BRL",
          totalDepositedVirtual: 10000.0,
        },
      },
      compliance: {
        create: {
          dailyDepositLimit: 5000.0,
          sessionTimeLimitMinutes: 60,
        },
      },
    },
  });

  console.log("✅ Seeded Users: Super Admin, Support Agent, Demo Player");

  // 2. Seed Game Categories
  const categories = [
    { slug: "originais", name: "Apex Originais", icon: "Sparkles", order: 1 },
    { slug: "slots", name: "Caça-Níqueis (Slots)", icon: "Coins", order: 2 },
    { slug: "crash", name: "Crash Games", icon: "Rocket", order: 3 },
    { slug: "live-casino", name: "Cassino Ao Vivo", icon: "Video", order: 4 },
    { slug: "table-games", name: "Jogos de Mesa", icon: "Dices", order: 5 },
    { slug: "arcade", name: "Arcade & Casuais", icon: "Gamepad2", order: 6 },
  ];

  for (const cat of categories) {
    await prisma.gameCategory.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  console.log("✅ Seeded Game Categories");

  // 3. Seed Providers
  const providers = [
    {
      code: "inhouse",
      name: "Apex Originals",
      description: "Coleção proprietária de jogos de cassino com RNG provably fair no backend",
      status: "AVAILABLE_DEMO",
      isEnabled: true,
      logoUrl: "/icons/apex.svg",
    },
    {
      code: "pragmatic",
      name: "Pragmatic Play",
      description: "Líder global em slots e entretenimento digital",
      status: "AWAITING_CREDENTIALS",
      isEnabled: true,
      logoUrl: "/icons/pragmatic.svg",
    },
    {
      code: "pgsoft",
      name: "PG Soft (Pocket Games)",
      description: "Especialista em jogos mobile-first com animações cinematográficas",
      status: "AWAITING_CREDENTIALS",
      isEnabled: true,
      logoUrl: "/icons/pgsoft.svg",
    },
    {
      code: "spribe",
      name: "Spribe",
      description: "Criadora do fenômeno global Aviator e jogos turbo",
      status: "AWAITING_CREDENTIALS",
      isEnabled: true,
      logoUrl: "/icons/spribe.svg",
    },
    {
      code: "evolution",
      name: "Evolution Gaming",
      description: "Referência mundial em mesas de cassino ao vivo e game shows",
      status: "AWAITING_CREDENTIALS",
      isEnabled: true,
      logoUrl: "/icons/evolution.svg",
    },
    {
      code: "bgaming",
      name: "BGaming",
      description: "Provedora inovadora com recursos de jogos dinâmicos",
      status: "AWAITING_CREDENTIALS",
      isEnabled: true,
      logoUrl: "/icons/bgaming.svg",
    },
    {
      code: "netent",
      name: "NetEnt",
      description: "Pioneira lendária do entretenimento digital",
      status: "AWAITING_CREDENTIALS",
      isEnabled: true,
      logoUrl: "/icons/netent.svg",
    },
    {
      code: "playtech",
      name: "Playtech",
      description: "Um dos maiores fornecedores de tecnologia de jogos",
      status: "AWAITING_CREDENTIALS",
      isEnabled: true,
      logoUrl: "/icons/playtech.svg",
    },
    {
      code: "aggregator",
      name: "Universal B2B Aggregator",
      description: "Gateway unificado para agregação de múltiplos estúdios",
      status: "CONFIGURED",
      isEnabled: true,
      logoUrl: "/icons/aggregator.svg",
    },
  ];

  const dbProviders = {};
  for (const prov of providers) {
    const p = await prisma.provider.upsert({
      where: { code: prov.code },
      update: prov,
      create: {
        ...prov,
        credentials: {
          create: {
            environment: "SANDBOX",
            testStatus: prov.code === "inhouse" ? "SUCCESS" : "UNTESTED",
            testMessage:
              prov.code === "inhouse"
                ? "Motor interno demonstrativo 100% operacional"
                : "Aguardando credenciais oficiais de API sandbox",
          },
        },
        integration: {
          create: {
            adapterName: `${prov.name}Adapter`,
            version: "1.0.0",
            capabilities: JSON.stringify([
              "DEMO_LAUNCH",
              "CATALOG_SYNC",
              "SESSION_MANAGEMENT",
              "WEBHOOKS",
            ]),
          },
        },
      },
    });
    dbProviders[prov.code] = p;
  }

  console.log("✅ Seeded Providers & Credentials");

  // 4. Seed Games
  const catSlots = await prisma.gameCategory.findUnique({ where: { slug: "slots" } });
  const catCrash = await prisma.gameCategory.findUnique({ where: { slug: "crash" } });
  const catLive = await prisma.gameCategory.findUnique({ where: { slug: "live-casino" } });
  const catTable = await prisma.gameCategory.findUnique({ where: { slug: "table-games" } });
  const catArcade = await prisma.gameCategory.findUnique({ where: { slug: "arcade" } });
  const catOrig = await prisma.gameCategory.findUnique({ where: { slug: "originais" } });

  const gamesData = [
    // In-House Originals
    {
      providerId: dbProviders["inhouse"].id,
      slug: "apex-crash",
      title: "Apex Crash",
      categoryId: catOrig.id,
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
      rtp: 97.0,
      volatility: "HIGH",
      minBet: 0.5,
      maxBet: 500.0,
      isFeatured: true,
      isHot: true,
      isOriginal: true,
      status: "AVAILABLE_DEMO",
    },
    {
      providerId: dbProviders["inhouse"].id,
      slug: "apex-mines",
      title: "Apex Mines",
      categoryId: catOrig.id,
      thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80",
      rtp: 97.0,
      volatility: "MEDIUM",
      minBet: 0.5,
      maxBet: 500.0,
      isFeatured: true,
      isHot: true,
      isOriginal: true,
      status: "AVAILABLE_DEMO",
    },
    {
      providerId: dbProviders["inhouse"].id,
      slug: "apex-plinko",
      title: "Apex Plinko",
      categoryId: catOrig.id,
      thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=80",
      rtp: 97.0,
      volatility: "HIGH",
      minBet: 0.5,
      maxBet: 500.0,
      isFeatured: true,
      isHot: true,
      isOriginal: true,
      status: "AVAILABLE_DEMO",
    },
    {
      providerId: dbProviders["inhouse"].id,
      slug: "apex-roulette",
      title: "Roulette Royale Pro",
      categoryId: catOrig.id,
      thumbnail: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=500&auto=format&fit=crop&q=80",
      rtp: 97.3,
      volatility: "MEDIUM",
      minBet: 1.0,
      maxBet: 2500.0,
      isFeatured: true,
      isOriginal: true,
      status: "AVAILABLE_DEMO",
    },
    {
      providerId: dbProviders["inhouse"].id,
      slug: "apex-blackjack",
      title: "Blackjack VIP Pro",
      categoryId: catOrig.id,
      thumbnail: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80",
      rtp: 99.5,
      volatility: "LOW",
      minBet: 2.0,
      maxBet: 5000.0,
      isFeatured: true,
      isOriginal: true,
      status: "AVAILABLE_DEMO",
    },
    {
      providerId: dbProviders["inhouse"].id,
      slug: "apex-dice",
      title: "Apex Cyber Dice",
      categoryId: catOrig.id,
      thumbnail: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&auto=format&fit=crop&q=80",
      rtp: 99.0,
      volatility: "LOW",
      minBet: 0.5,
      maxBet: 1000.0,
      isFeatured: false,
      isOriginal: true,
      status: "AVAILABLE_DEMO",
    },

    // Pragmatic Play
    {
      providerId: dbProviders["pragmatic"].id,
      slug: "gates-of-olympus",
      title: "Gates of Olympus",
      categoryId: catSlots.id,
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
      rtp: 96.5,
      volatility: "VERY_HIGH",
      minBet: 0.2,
      maxBet: 500.0,
      isFeatured: true,
      isHot: true,
      status: "AVAILABLE_DEMO",
    },
    {
      providerId: dbProviders["pragmatic"].id,
      slug: "sweet-bonanza",
      title: "Sweet Bonanza",
      categoryId: catSlots.id,
      thumbnail: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=500&auto=format&fit=crop&q=80",
      rtp: 96.48,
      volatility: "HIGH",
      minBet: 0.2,
      maxBet: 500.0,
      isFeatured: true,
      isHot: true,
      status: "AVAILABLE_DEMO",
    },
    {
      providerId: dbProviders["pragmatic"].id,
      slug: "sugar-rush",
      title: "Sugar Rush",
      categoryId: catSlots.id,
      thumbnail: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
      rtp: 96.5,
      volatility: "HIGH",
      minBet: 0.2,
      maxBet: 500.0,
      isFeatured: true,
      status: "AVAILABLE_DEMO",
    },
    {
      providerId: dbProviders["pragmatic"].id,
      slug: "big-bass-bonanza",
      title: "Big Bass Bonanza",
      categoryId: catSlots.id,
      thumbnail: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&auto=format&fit=crop&q=80",
      rtp: 96.71,
      volatility: "HIGH",
      minBet: 0.1,
      maxBet: 250.0,
      status: "AVAILABLE_DEMO",
    },

    // PG Soft
    {
      providerId: dbProviders["pgsoft"].id,
      slug: "fortune-tiger",
      title: "Fortune Tiger",
      categoryId: catSlots.id,
      thumbnail: "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=500&auto=format&fit=crop&q=80",
      rtp: 96.81,
      volatility: "MEDIUM",
      minBet: 0.5,
      maxBet: 500.0,
      isFeatured: true,
      isHot: true,
      status: "AVAILABLE_DEMO",
    },
    {
      providerId: dbProviders["pgsoft"].id,
      slug: "fortune-rabbit",
      title: "Fortune Rabbit",
      categoryId: catSlots.id,
      thumbnail: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=500&auto=format&fit=crop&q=80",
      rtp: 96.75,
      volatility: "MEDIUM",
      minBet: 0.5,
      maxBet: 500.0,
      isFeatured: true,
      status: "AVAILABLE_DEMO",
    },
    {
      providerId: dbProviders["pgsoft"].id,
      slug: "fortune-ox",
      title: "Fortune Ox",
      categoryId: catSlots.id,
      thumbnail: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&auto=format&fit=crop&q=80",
      rtp: 96.75,
      volatility: "MEDIUM",
      minBet: 0.5,
      maxBet: 500.0,
      status: "AVAILABLE_DEMO",
    },

    // Spribe
    {
      providerId: dbProviders["spribe"].id,
      slug: "aviator",
      title: "Aviator",
      categoryId: catCrash.id,
      thumbnail: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500&auto=format&fit=crop&q=80",
      rtp: 97.0,
      volatility: "MEDIUM",
      minBet: 1.0,
      maxBet: 500.0,
      isFeatured: true,
      isHot: true,
      status: "AVAILABLE_DEMO",
    },

    // Evolution
    {
      providerId: dbProviders["evolution"].id,
      slug: "crazy-time",
      title: "Crazy Time",
      categoryId: catLive.id,
      thumbnail: "https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=500&auto=format&fit=crop&q=80",
      rtp: 96.08,
      volatility: "HIGH",
      minBet: 0.5,
      maxBet: 2500.0,
      isFeatured: true,
      isHot: true,
      status: "AVAILABLE_DEMO",
    },
    {
      providerId: dbProviders["evolution"].id,
      slug: "lightning-roulette",
      title: "Lightning Roulette",
      categoryId: catLive.id,
      thumbnail: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=500&auto=format&fit=crop&q=80",
      rtp: 97.3,
      volatility: "HIGH",
      minBet: 1.0,
      maxBet: 5000.0,
      isFeatured: true,
      status: "AVAILABLE_DEMO",
    },
  ];

  for (const g of gamesData) {
    await prisma.game.upsert({
      where: { slug: g.slug },
      update: g,
      create: g,
    });
  }

  console.log("✅ Seeded Casino Games Catalog");

  // 5. Seed Sports & Competitions
  const sports = [
    { slug: "futebol", name: "Futebol", icon: "⚽", order: 1 },
    { slug: "basquete", name: "Basquete", icon: "🏀", order: 2 },
    { slug: "tenis", name: "Tênis", icon: "🎾", order: 3 },
    { slug: "esports", name: "E-Sports", icon: "🎮", order: 4 },
    { slug: "mma", name: "MMA / UFC", icon: "🥊", order: 5 },
    { slug: "volei", name: "Vôlei", icon: "🏐", order: 6 },
    { slug: "futebol-americano", name: "Futebol Americano", icon: "🏈", order: 7 },
  ];

  const dbSports = {};
  for (const s of sports) {
    const createdSport = await prisma.sport.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
    dbSports[s.slug] = createdSport;
  }

  // Competitions
  const compPremier = await prisma.competition.create({
    data: {
      sportId: dbSports["futebol"].id,
      name: "Premier League Inglesa",
      country: "Inglaterra",
    },
  });

  const compChampions = await prisma.competition.create({
    data: {
      sportId: dbSports["futebol"].id,
      name: "UEFA Champions League",
      country: "Europa",
    },
  });

  const compBrasileirao = await prisma.competition.create({
    data: {
      sportId: dbSports["futebol"].id,
      name: "Brasileirão Série A",
      country: "Brasil",
    },
  });

  const compNBA = await prisma.competition.create({
    data: {
      sportId: dbSports["basquete"].id,
      name: "NBA",
      country: "Estados Unidos",
    },
  });

  const compCS2 = await prisma.competition.create({
    data: {
      sportId: dbSports["esports"].id,
      name: "IEM Major Championship",
      country: "Internacional",
    },
  });

  console.log("✅ Seeded Sports & Competitions");

  // 6. Seed Sports Events & Markets & Odds
  const events = [
    {
      competitionId: compPremier.id,
      sportId: dbSports["futebol"].id,
      homeTeam: "Arsenal",
      awayTeam: "Manchester City",
      homeScore: 1,
      awayScore: 1,
      isLive: true,
      status: "LIVE",
      currentPeriod: "2H",
      currentMinute: 68,
      startTime: new Date(Date.now() - 4000000),
      markets: [
        {
          key: "1X2",
          name: "Vencedor do Encontro (1X2)",
          odds: [
            { label: "Arsenal (1)", value: 2.85 },
            { label: "Empate (X)", value: 2.45 },
            { label: "Man City (2)", value: 2.95 },
          ],
        },
        {
          key: "TOTAL_GOALS",
          name: "Total de Gols (Mais/Menos 2.5)",
          odds: [
            { label: "Mais de 2.5", value: 1.72 },
            { label: "Menos de 2.5", value: 2.1 },
          ],
        },
        {
          key: "BTTS",
          name: "Ambas as Equipes Marcam",
          odds: [
            { label: "Sim", value: 1.25 },
            { label: "Não", value: 3.6 },
          ],
        },
      ],
    },
    {
      competitionId: compChampions.id,
      sportId: dbSports["futebol"].id,
      homeTeam: "Real Madrid",
      awayTeam: "Bayern de Munique",
      homeScore: 0,
      awayScore: 0,
      isLive: false,
      status: "UPCOMING",
      startTime: new Date(Date.now() + 86400000), // tomorrow
      markets: [
        {
          key: "1X2",
          name: "Resultado Final (1X2)",
          odds: [
            { label: "Real Madrid", value: 2.15 },
            { label: "Empate", value: 3.6 },
            { label: "Bayern Munique", value: 3.1 },
          ],
        },
        {
          key: "TOTAL_GOALS",
          name: "Total de Gols (Mais/Menos 2.5)",
          odds: [
            { label: "Mais de 2.5", value: 1.62 },
            { label: "Menos de 2.5", value: 2.3 },
          ],
        },
      ],
    },
    {
      competitionId: compBrasileirao.id,
      sportId: dbSports["futebol"].id,
      homeTeam: "Flamengo",
      awayTeam: "Palmeiras",
      homeScore: 2,
      awayScore: 1,
      isLive: true,
      status: "LIVE",
      currentPeriod: "2H",
      currentMinute: 82,
      startTime: new Date(Date.now() - 5000000),
      markets: [
        {
          key: "1X2",
          name: "Vencedor da Partida",
          odds: [
            { label: "Flamengo", value: 1.28 },
            { label: "Empate", value: 4.8 },
            { label: "Palmeiras", value: 11.5 },
          ],
        },
      ],
    },
    {
      competitionId: compNBA.id,
      sportId: dbSports["basquete"].id,
      homeTeam: "Los Angeles Lakers",
      awayTeam: "Golden State Warriors",
      homeScore: 84,
      awayScore: 89,
      isLive: true,
      status: "LIVE",
      currentPeriod: "Q3",
      currentMinute: 9,
      startTime: new Date(Date.now() - 3600000),
      markets: [
        {
          key: "MONEYLINE",
          name: "Vencedor do Jogo (Moneyline)",
          odds: [
            { label: "Lakers", value: 2.35 },
            { label: "Warriors", value: 1.62 },
          ],
        },
        {
          key: "OVER_UNDER",
          name: "Total de Pontos (Mais/Menos 228.5)",
          odds: [
            { label: "Mais de 228.5", value: 1.9 },
            { label: "Menos de 228.5", value: 1.9 },
          ],
        },
      ],
    },
    {
      competitionId: compCS2.id,
      sportId: dbSports["esports"].id,
      homeTeam: "FURIA Esports",
      awayTeam: "Natus Vincere (NaVi)",
      homeScore: 1,
      awayScore: 0,
      isLive: true,
      status: "LIVE",
      currentPeriod: "Mapa 2",
      currentMinute: 14,
      startTime: new Date(Date.now() - 2500000),
      markets: [
        {
          key: "MATCH_WINNER",
          name: "Vencedor da Série (MD3)",
          odds: [
            { label: "FURIA", value: 1.75 },
            { label: "NaVi", value: 2.05 },
          ],
        },
      ],
    },
  ];

  for (const ev of events) {
    const { markets, ...evData } = ev;
    const createdEvent = await prisma.sportEvent.create({
      data: evData,
    });

    for (const m of markets) {
      const createdMarket = await prisma.market.create({
        data: {
          eventId: createdEvent.id,
          key: m.key,
          name: m.name,
          status: "ACTIVE",
        },
      });

      for (const o of m.odds) {
        await prisma.odd.create({
          data: {
            marketId: createdMarket.id,
            label: o.label,
            value: o.value,
            isActive: true,
          },
        });
      }
    }
  }

  console.log("✅ Seeded Sports Events, Markets and Live Odds");

  // 7. Seed System Settings & Visual CMS
  const settings = [
    { key: "PLATFORM_NAME", value: "Apex Bet & Casino" },
    { key: "PRIMARY_COLOR", value: "#B4FF39" },
    { key: "SECONDARY_COLOR", value: "#151A23" },
    { key: "HERO_BANNER_TITLE", value: "A Experiência Definitiva em Apostas e Cassino Virtual" },
    { key: "HERO_BANNER_SUBTITLE", value: "Créditos fictícios demonstrativos, catálogo premium e odds em tempo real sem dinheiro real." },
    { key: "MAINTENANCE_MODE", value: "false" },
    { key: "RESPONSIBLE_GAMING_NOTICE", value: "Plataforma 100% demonstrativa para entretenimento e pesquisa tecnológica. Não envolve apostas com dinheiro real." },
  ];

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log("✅ Seeded System Settings");
  console.log("🎉 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
