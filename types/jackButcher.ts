export interface JackButcherLinks {
  readonly site?: string;
  readonly contract?: string;
  readonly token?: string;
  readonly market?: string;
  readonly etherscan?: string;
}

interface JackButcherBase {
  readonly type: `jack.${string}`;
  readonly chainId: number;
  readonly requestUrl?: string | null;
  readonly url?: string | null;
  readonly links?: JackButcherLinks;
  readonly [key: string]: unknown;
}

export interface JackTraitAttribute {
  readonly trait_type: string;
  readonly value: string | number | boolean;
}

export interface JackChecksCard extends JackButcherBase {
  readonly type: "jack.checks";
  readonly variant: "edition" | "original" | "unknown";
  readonly collection: { readonly address: string; readonly name: string };
  readonly token: {
    readonly id: string;
    readonly owner?: string | null;
    readonly image?: string | null;
    readonly attributes?: readonly JackTraitAttribute[];
  };
  readonly meta?: {
    readonly statement?: string;
    readonly migrationHint?: "migrated" | "unmigrated" | "unknown";
  };
}

export interface JackOpepenSetInfo {
  readonly number?: number | null;
  readonly name?: string | null;
  readonly editionSize?: number | null;
}

export interface JackOpepenCard extends JackButcherBase {
  readonly type: "jack.opepen";
  readonly collection: { readonly address: string; readonly name: string };
  readonly token: {
    readonly id: string;
    readonly image?: string | null;
    readonly set?: JackOpepenSetInfo | null;
    readonly attributes?: readonly JackTraitAttribute[];
  };
  readonly consensus?: { readonly metAt?: number | null };
}

export interface JackOpepenSetCard extends JackButcherBase {
  readonly type: "jack.opepen.set";
  readonly set: {
    readonly number: number;
    readonly title?: string | null;
    readonly artist?: string | null;
    readonly editions?: readonly { readonly size: number }[];
  };
  readonly status?: { readonly consensus?: "met" | "open" | "closed" };
}

export interface JackInfinityCard extends JackButcherBase {
  readonly type: "jack.infinity";
  readonly collection: { readonly address: string; readonly name: string };
  readonly token?: {
    readonly id?: string;
    readonly image?: string | null;
    readonly refundable?: boolean;
  };
  readonly economics?: {
    readonly depositEth?: string;
    readonly refundable?: boolean;
    readonly burnOnRefund?: boolean;
  };
}

export interface JackTransactionSummary extends JackButcherBase {
  readonly type: "jack.tx";
  readonly hash: string;
  readonly status: "success" | "reverted" | "pending";
  readonly blockNumber?: number | null;
  readonly summary?: {
    readonly project?: "checks" | "opepen" | "infinity";
    readonly action?: "mint" | "migrate" | "reveal" | "transfer" | "refund";
    readonly collection?: string;
    readonly tokenId?: string;
    readonly from?: string;
    readonly to?: string;
  };
}

export type JackButcherCard =
  | JackChecksCard
  | JackOpepenCard
  | JackOpepenSetCard
  | JackInfinityCard
  | JackTransactionSummary;

export const isJackButcherCard = (value: unknown): value is JackButcherCard => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybeType = (value as { readonly type?: unknown }).type;
  if (typeof maybeType !== "string") {
    return false;
  }

  return maybeType.startsWith("jack.");
};
