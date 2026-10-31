import type { SaleActionsByKind } from "@/lib/stream/dataSource";
import type { MockStreamEngine } from "@/lib/stream/mock/engine";
import {
  createEditionActions,
  editionAuctionView,
} from "@/lib/stream/mock/sales/editionAuction";
import {
  createEnglishActions,
  englishView,
  syncPauseExpiry,
} from "@/lib/stream/mock/sales/englishAuction";
import type {
  KnownSaleKind,
  SaleRef,
  SaleView,
  SaleViewByKind,
} from "@/lib/stream/types";

/**
 * One mock adapter per sale kind. A new sale method (for example a fixed-price
 * adapter) is one more module under this folder and one more entry here.
 */
interface MockSaleAdapter<K extends KnownSaleKind> {
  readonly kind: K;
  read(engine: MockStreamEngine, saleId: string): SaleViewByKind[K] | null;
  actions(engine: MockStreamEngine): SaleActionsByKind[K];
}

const englishAuctionAdapter: MockSaleAdapter<"ENGLISH_AUCTION"> = {
  kind: "ENGLISH_AUCTION",
  read(engine, saleId) {
    const auction = engine.state.englishAuctions.get(saleId);
    if (!auction) {
      return null;
    }
    syncPauseExpiry(engine, auction);
    return englishView(engine, auction);
  },
  actions: createEnglishActions,
};

const editionAuctionAdapter: MockSaleAdapter<"UNIFORM_AUCTION"> = {
  kind: "UNIFORM_AUCTION",
  read(engine, saleId) {
    for (const auction of engine.state.editionAuctions.values()) {
      if (auction.saleId === saleId) {
        return editionAuctionView(engine, auction);
      }
    }
    return null;
  },
  actions: createEditionActions,
};

export const MOCK_SALE_ADAPTERS: {
  readonly [K in KnownSaleKind]: MockSaleAdapter<K>;
} = {
  ENGLISH_AUCTION: englishAuctionAdapter,
  UNIFORM_AUCTION: editionAuctionAdapter,
};

function isKnownSaleKind(kind: string): kind is KnownSaleKind {
  return Object.hasOwn(MOCK_SALE_ADAPTERS, kind);
}

function readKnown(
  engine: MockStreamEngine,
  kind: KnownSaleKind,
  ref: SaleRef
): SaleView | null {
  switch (kind) {
    case "ENGLISH_AUCTION": {
      const sale = MOCK_SALE_ADAPTERS.ENGLISH_AUCTION.read(engine, ref.saleId);
      return sale === null ? null : { kind, ref, sale };
    }
    case "UNIFORM_AUCTION": {
      const sale = MOCK_SALE_ADAPTERS.UNIFORM_AUCTION.read(engine, ref.saleId);
      return sale === null ? null : { kind, ref, sale };
    }
  }
}

/** `getSale`: dispatches on the sale kind; unknown kinds stay renderable as "unsupported". */
export function readSale(engine: MockStreamEngine, ref: SaleRef): SaleView {
  if (!isKnownSaleKind(ref.kind)) {
    return { kind: "unsupported", ref };
  }
  return readKnown(engine, ref.kind, ref) ?? { kind: "unsupported", ref };
}
