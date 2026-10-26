import { BaseProviderAdapter } from "./base.adapter";
import { ProviderCode, StandardGameMetadata } from "../types";

export class BGamingAdapter extends BaseProviderAdapter {
  readonly code: ProviderCode = "bgaming";
  readonly name = "BGaming";

  readonly defaultCatalog: StandardGameMetadata[] = [
    {
      externalId: "bg_elvis_frog",
      slug: "elvis-frog-in-vegas",
      title: "Elvis Frog in Vegas",
      category: "slots",
      providerCode: "bgaming",
      thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
      rtp: 96.0,
      volatility: "MEDIUM",
      minBet: 0.50,
      maxBet: 500.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
    {
      externalId: "bg_aztec_magic",
      slug: "aztec-magic-deluxe",
      title: "Aztec Magic Deluxe",
      category: "slots",
      providerCode: "bgaming",
      thumbnail: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=500&auto=format&fit=crop&q=80",
      rtp: 96.96,
      volatility: "MEDIUM",
      minBet: 0.50,
      maxBet: 500.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
    {
      externalId: "bg_bonanza_billion",
      slug: "bonanza-billion",
      title: "Bonanza Billion",
      category: "slots",
      providerCode: "bgaming",
      thumbnail: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80",
      rtp: 96.0,
      volatility: "VERY_HIGH",
      minBet: 0.20,
      maxBet: 400.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
  ];
}
