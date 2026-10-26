import { BaseProviderAdapter } from "./base.adapter";
import { ProviderCode, StandardGameMetadata } from "../types";

export class SpribeAdapter extends BaseProviderAdapter {
  readonly code: ProviderCode = "spribe";
  readonly name = "Spribe";

  readonly defaultCatalog: StandardGameMetadata[] = [
    {
      externalId: "spribe_aviator",
      slug: "aviator",
      title: "Aviator",
      category: "crash",
      providerCode: "spribe",
      thumbnail: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500&auto=format&fit=crop&q=80",
      rtp: 97.0,
      volatility: "MEDIUM",
      minBet: 1.00,
      maxBet: 500.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
    {
      externalId: "spribe_mines",
      slug: "spribe-mines",
      title: "Mines",
      category: "arcade",
      providerCode: "spribe",
      thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80",
      rtp: 97.0,
      volatility: "MEDIUM",
      minBet: 0.50,
      maxBet: 500.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
    {
      externalId: "spribe_plinko",
      slug: "spribe-plinko",
      title: "Plinko",
      category: "arcade",
      providerCode: "spribe",
      thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=80",
      rtp: 97.0,
      volatility: "MEDIUM",
      minBet: 0.50,
      maxBet: 500.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
    {
      externalId: "spribe_dice",
      slug: "spribe-dice",
      title: "Dice",
      category: "arcade",
      providerCode: "spribe",
      thumbnail: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&auto=format&fit=crop&q=80",
      rtp: 97.0,
      volatility: "LOW",
      minBet: 0.50,
      maxBet: 1000.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
  ];
}
