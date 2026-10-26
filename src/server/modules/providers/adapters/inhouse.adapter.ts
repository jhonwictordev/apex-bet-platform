import { BaseProviderAdapter } from "./base.adapter";
import { GameLaunchRequest, GameLaunchResponse, ProviderCode, StandardGameMetadata } from "../types";

export class InHouseDemoAdapter extends BaseProviderAdapter {
  readonly code: ProviderCode = "inhouse";
  readonly name = "Apex Originals (Demonstração Própria)";

  readonly defaultCatalog: StandardGameMetadata[] = [
    {
      externalId: "apex_crash_orig",
      slug: "apex-crash",
      title: "Apex Crash",
      category: "crash",
      providerCode: "inhouse",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
      rtp: 97.0,
      volatility: "HIGH",
      minBet: 0.50,
      maxBet: 500.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
    {
      externalId: "apex_mines_orig",
      slug: "apex-mines",
      title: "Apex Mines",
      category: "arcade",
      providerCode: "inhouse",
      thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80",
      rtp: 97.0,
      volatility: "MEDIUM",
      minBet: 0.50,
      maxBet: 500.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
    {
      externalId: "apex_plinko_orig",
      slug: "apex-plinko",
      title: "Apex Plinko",
      category: "arcade",
      providerCode: "inhouse",
      thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=80",
      rtp: 97.0,
      volatility: "HIGH",
      minBet: 0.50,
      maxBet: 500.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
    {
      externalId: "apex_roulette_orig",
      slug: "apex-roulette",
      title: "Roulette Royale European",
      category: "table-games",
      providerCode: "inhouse",
      thumbnail: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=500&auto=format&fit=crop&q=80",
      rtp: 97.3,
      volatility: "MEDIUM",
      minBet: 1.00,
      maxBet: 2500.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
    {
      externalId: "apex_blackjack_orig",
      slug: "apex-blackjack",
      title: "Blackjack VIP Pro",
      category: "table-games",
      providerCode: "inhouse",
      thumbnail: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80",
      rtp: 99.5,
      volatility: "LOW",
      minBet: 2.00,
      maxBet: 5000.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
    {
      externalId: "apex_dice_orig",
      slug: "apex-dice",
      title: "Apex Cyber Dice",
      category: "arcade",
      providerCode: "inhouse",
      thumbnail: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&auto=format&fit=crop&q=80",
      rtp: 99.0,
      volatility: "LOW",
      minBet: 0.50,
      maxBet: 1000.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
  ];

  override async getAuthorizedDemoLaunch(request: GameLaunchRequest): Promise<GameLaunchResponse> {
    const game = await this.getGameDetails(request.slug);
    const sessionToken = `inhouse_${crypto.randomUUID()}`;

    return {
      success: true,
      sessionToken,
      launchUrl: `/cassino/originais/${request.slug}`,
      isIframe: false,
      isOfficialSandbox: false,
      provider: "inhouse",
      gameTitle: game ? game.title : request.slug,
      message: "Jogo original Apex em execução direta no navegador com validação backend em tempo real.",
    };
  }
}
