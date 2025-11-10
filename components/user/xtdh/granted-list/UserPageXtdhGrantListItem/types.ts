import type { ReactNode } from "react";

export interface GrantDetails {
  readonly tokenTypeLabel: ReactNode;
  readonly totalSupplyLabel: ReactNode;
  readonly floorPriceLabel: ReactNode;
  readonly tokensCountLabel: ReactNode;
  readonly tdhRateLabel: ReactNode;
  readonly validUntilLabel: ReactNode;
}

export type GrantItemVariant = "contract" | "error";
