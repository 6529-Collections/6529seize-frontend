import registry from "./registry.json";

export type CompoundV2MarketConfig = {
  readonly address: `0x${string}`;
  readonly symbol: string;
  readonly name: string;
  readonly appPath: string;
  readonly marketUrl: string;
  readonly underlying: {
    readonly address: `0x${string}`;
    readonly symbol: string;
    readonly decimals: number;
  };
};

export type CompoundV3MarketConfig = {
  readonly address: `0x${string}`;
  readonly symbol: string;
  readonly name: string;
  readonly appPath: string;
  readonly marketUrl: string;
  readonly base: {
    readonly address: `0x${string}`;
    readonly symbol: string;
    readonly decimals: number;
  };
};

type CompoundRegistry = {
  readonly comptroller: `0x${string}`;
  readonly v2Markets: readonly CompoundV2MarketConfig[];
  readonly v3Markets: readonly CompoundV3MarketConfig[];
};

const parsedRegistry = registry as CompoundRegistry;

export const compoundRegistry: CompoundRegistry = parsedRegistry;

export const v2MarketsByAddress = new Map<`0x${string}`, CompoundV2MarketConfig>(
  parsedRegistry.v2Markets.map((market) => [market.address.toLowerCase() as `0x${string}`, market])
);

export const v3MarketsByAddress = new Map<`0x${string}`, CompoundV3MarketConfig>(
  parsedRegistry.v3Markets.map((market) => [market.address.toLowerCase() as `0x${string}`, market])
);

export const v2MarketsByPath = new Map<string, CompoundV2MarketConfig>(
  parsedRegistry.v2Markets.map((market) => [market.appPath.toLowerCase(), market])
);

export const v3MarketsByPath = new Map<string, CompoundV3MarketConfig>(
  parsedRegistry.v3Markets.map((market) => [market.appPath.toLowerCase(), market])
);
