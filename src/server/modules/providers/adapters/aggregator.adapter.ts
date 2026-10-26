import { BaseProviderAdapter } from "./base.adapter";
import { ProviderCode, StandardGameMetadata } from "../types";

export class AggregatorAdapter extends BaseProviderAdapter {
  readonly code: ProviderCode = "aggregator";
  readonly name = "Universal B2B Aggregator Gateway";

  readonly defaultCatalog: StandardGameMetadata[] = [
    {
      externalId: "agg_slot_cyberpunk",
      slug: "neon-samurai",
      title: "Neon Samurai 2099",
      category: "slots",
      providerCode: "aggregator",
      thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80",
      rtp: 96.7,
      volatility: "HIGH",
      minBet: 0.50,
      maxBet: 500.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
    {
      externalId: "agg_live_roulette_gold",
      slug: "gold-vault-roulette",
      title: "Gold Vault Roulette",
      category: "live-casino",
      providerCode: "aggregator",
      thumbnail: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80",
      rtp: 97.3,
      volatility: "MEDIUM",
      minBet: 1.00,
      maxBet: 2500.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
  ];
}
