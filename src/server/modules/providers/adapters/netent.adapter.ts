import { BaseProviderAdapter } from "./base.adapter";
import { ProviderCode, StandardGameMetadata } from "../types";

export class NetEntAdapter extends BaseProviderAdapter {
  readonly code: ProviderCode = "netent";
  readonly name = "NetEnt";

  readonly defaultCatalog: StandardGameMetadata[] = [
    {
      externalId: "ne_starburst",
      slug: "starburst",
      title: "Starburst",
      category: "slots",
      providerCode: "netent",
      thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80",
      rtp: 96.09,
      volatility: "LOW",
      minBet: 0.10,
      maxBet: 500.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
    {
      externalId: "ne_gonzos_quest",
      slug: "gonzos-quest",
      title: "Gonzo's Quest",
      category: "slots",
      providerCode: "netent",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
      rtp: 95.97,
      volatility: "MEDIUM",
      minBet: 0.20,
      maxBet: 400.0,
      isDemoAvailable: true,
      status: "AVAILABLE_DEMO",
    },
  ];
}
