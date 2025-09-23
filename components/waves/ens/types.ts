export const TEXT_RECORD_KEYS = [
  "url",
  "email",
  "com.twitter",
  "org.telegram",
  "com.github",
  "description",
] as const;

export type TextRecordKey = (typeof TEXT_RECORD_KEYS)[number];

export interface EnsContenthash {
  readonly protocol: "ipfs" | "ipns" | "arweave" | "other";
  readonly decoded: string | null;
  readonly gatewayUrl: string | null;
}

export interface EnsOwnership {
  readonly registryOwner: string | null;
  readonly isWrapped: boolean;
  readonly registrant: string | null;
  readonly expiry: number | null;
  readonly gracePeriodEnds?: number | null;
}

export interface EnsLinks {
  readonly app?: string;
  readonly etherscan?: string;
  readonly open?: string;
}

export interface EnsNamePreview {
  readonly type: "ens.name";
  readonly chainId: number;
  readonly name: string;
  readonly normalized: string;
  readonly address: string | null;
  readonly resolver: string | null;
  readonly avatarUrl: string | null;
  readonly records: Partial<Record<TextRecordKey, string | null>>;
  readonly contenthash: EnsContenthash | null;
  readonly ownership: EnsOwnership;
  readonly links: EnsLinks;
}

export interface EnsAddressPreview {
  readonly type: "ens.address";
  readonly chainId: number;
  readonly address: string;
  readonly primaryName: string | null;
  readonly forwardMatch: boolean;
  readonly avatarUrl: string | null;
  readonly links: EnsLinks;
}

export interface EnsContentPreview {
  readonly type: "ens.content";
  readonly chainId: number;
  readonly name: string;
  readonly contenthash: EnsContenthash | null;
  readonly links: EnsLinks;
}

export type EnsPreview = EnsNamePreview | EnsAddressPreview | EnsContentPreview;

export const isEnsPreview = (value: unknown): value is EnsPreview => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as { readonly type?: unknown };
  return (
    record.type === "ens.name" ||
    record.type === "ens.address" ||
    record.type === "ens.content"
  );
};

export const isEnsNamePreview = (value: unknown): value is EnsNamePreview => {
  return isEnsPreview(value) && value.type === "ens.name";
};

export const isEnsAddressPreview = (
  value: unknown
): value is EnsAddressPreview => {
  return isEnsPreview(value) && value.type === "ens.address";
};
