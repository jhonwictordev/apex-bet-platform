import { BaseProviderAdapter } from "./base.adapter";
import { ProviderCode, StandardGameMetadata } from "../types";

export class PlaytechAdapter extends BaseProviderAdapter {
  readonly code: ProviderCode = "playtech";
  readonly name = "Playtech";

  readonly defaultCatalog: StandardGameMetadata[] = [
    {
      externalId: "pt_buffalo_blitz",
      slug: "buffalo-blitz",
      title: "Buffalo Blitz",
      category: "slots",
      providerCode: "playtech",
      thumbnail: "https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=500&auto=format&fit=crop&q=80",
      rtp: 95.96,
      volatility: "HIGH",
      minBet: 0.40,
      maxBet: 400.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
    {
      externalId: "pt_age_gods",
      slug: "age-of-the-gods",
      title: "Age of the Gods",
      category: "slots",
      providerCode: "playtech",
      thumbnail: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80",
      rtp: 95.02,
      volatility: "MEDIUM",
      minBet: 0.20,
      maxBet: 500.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
  ];
}
