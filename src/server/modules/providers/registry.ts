import { IGameProviderAdapter, ProviderCode } from "./types";
import { PragmaticPlayAdapter } from "./adapters/pragmatic.adapter";
import { PGSoftAdapter } from "./adapters/pgsoft.adapter";
import { EvolutionAdapter } from "./adapters/evolution.adapter";
import { SpribeAdapter } from "./adapters/spribe.adapter";
import { BGamingAdapter } from "./adapters/bgaming.adapter";
import { NetEntAdapter } from "./adapters/netent.adapter";
import { PlaytechAdapter } from "./adapters/playtech.adapter";
import { AggregatorAdapter } from "./adapters/aggregator.adapter";
import { InHouseDemoAdapter } from "./adapters/inhouse.adapter";

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private adapters: Map<ProviderCode, IGameProviderAdapter> = new Map();

  private constructor() {
    this.register(new PragmaticPlayAdapter());
    this.register(new PGSoftAdapter());
    this.register(new EvolutionAdapter());
    this.register(new SpribeAdapter());
    this.register(new BGamingAdapter());
    this.register(new NetEntAdapter());
    this.register(new PlaytechAdapter());
    this.register(new AggregatorAdapter());
    this.register(new InHouseDemoAdapter());
  }

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  register(adapter: IGameProviderAdapter) {
    this.adapters.set(adapter.code, adapter);
  }

  get(code: ProviderCode): IGameProviderAdapter | undefined {
    return this.adapters.get(code);
  }

  getAll(): IGameProviderAdapter[] {
    return Array.from(this.adapters.values());
  }
}
