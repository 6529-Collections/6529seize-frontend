import type {
  MockAccount,
  SaleActionsByKind,
  StreamActions,
  StreamDevControls,
  TxResult,
} from "@/lib/stream/dataSource";
import { releaseSplit } from "@/lib/stream/mock/accounts";
import {
  appendStatement,
  createEditionFor,
  startFromItem,
} from "@/lib/stream/mock/curation";
import { later, type MockStreamEngine, revert } from "@/lib/stream/mock/engine";
import {
  deployFederated,
  mintViaAuction,
  openFederatedEdition,
  setFederatedStatus,
} from "@/lib/stream/mock/federated";
import { auctionTimes } from "@/lib/stream/mock/sales/editionAuction";
import {
  englishState,
  findEnglishAuction,
  pauseEnglishAuction,
  resolveEnglishDispute,
} from "@/lib/stream/mock/sales/englishAuction";
import { MOCK_SALE_ADAPTERS } from "@/lib/stream/mock/sales/registry";
import type { GasOperation } from "@/lib/stream/gas";
import type {
  Address,
  FederatedForm,
  KnownSaleKind,
  WorkKey,
} from "@/lib/stream/types";

/** Each federated form's deploy carries its own labelled gas estimate. */
const DEPLOY_OPERATION: Readonly<Record<FederatedForm, GasOperation>> = {
  ERC721: "federatedDeploy721",
  ERC1155: "federatedDeploy1155",
  PAIR: "federatedDeployPair",
};

/** The mock's writes: each runs atomically through `engine.tx`. */
export class MockStreamActions implements StreamActions {
  private readonly saleActions: { [K in KnownSaleKind]: SaleActionsByKind[K] };

  constructor(private readonly engine: MockStreamEngine) {
    this.saleActions = {
      ENGLISH_AUCTION: MOCK_SALE_ADAPTERS.ENGLISH_AUCTION.actions(engine),
      UNIFORM_AUCTION: MOCK_SALE_ADAPTERS.UNIFORM_AUCTION.actions(engine),
    };
  }

  sale<K extends KnownSaleKind>(kind: K): SaleActionsByKind[K] {
    return this.saleActions[kind];
  }

  startAuction(_from: Address, itemHash: `0x${string}`) {
    return later(() => {
      return this.engine.tx("auctionStart", () =>
        startFromItem(this.engine, itemHash)
      );
    });
  }

  createEdition(_from: Address, master: WorkKey) {
    return later(() => {
      return this.engine.tx("createEdition", () =>
        createEditionFor(this.engine, master)
      );
    });
  }

  releaseSplit(_from: Address, wallet: Address, payeeIndex: number) {
    return later(() => {
      return this.engine.tx(null, () =>
        releaseSplit(this.engine, wallet, payeeIndex)
      );
    });
  }

  deployFederated(
    from: Address,
    request: Parameters<StreamActions["deployFederated"]>[1]
  ) {
    return later(() => {
      return this.engine.tx(DEPLOY_OPERATION[request.form], () =>
        deployFederated(this.engine, from, request)
      );
    });
  }

  mintViaAuction(from: Address, contract: Address, title: string) {
    return later(() => {
      return this.engine.tx("auctionStart", () =>
        mintViaAuction(this.engine, from, contract, title)
      );
    });
  }

  openFederatedEditionAuction(
    from: Address,
    contract: Address,
    title: string,
    cap: number
  ) {
    return later(() => {
      return this.engine.tx("editionOpen", () =>
        openFederatedEdition(this.engine, from, contract, { title, cap })
      );
    });
  }
}

function auctionOf(engine: MockStreamEngine, work: WorkKey) {
  const sale = engine.token(work).sale;
  if (sale?.kind !== "ENGLISH_AUCTION") {
    revert("UnknownSale", { work });
  }
  return findEnglishAuction(engine, sale.saleId);
}

/** Dev-panel controls: the clock, the accounts and network-side actors. */
export class MockDevControls implements StreamDevControls {
  constructor(private readonly engine: MockStreamEngine) {}

  accounts(): readonly MockAccount[] {
    return this.engine.state.devAccounts.map((account) => ({
      ...account,
      balance: this.engine.balanceOf(account.address),
    }));
  }

  clockSpeed(): number {
    return this.engine.clock.getSpeed();
  }

  setClockSpeed(multiplier: number): void {
    this.engine.clock.setSpeed(multiplier);
    this.engine.notify();
  }

  isClockPaused(): boolean {
    return this.engine.clock.isPaused();
  }

  setClockPaused(paused: boolean): void {
    this.engine.clock.setPaused(paused);
    this.engine.notify();
  }

  advance(seconds: number): void {
    this.engine.clock.advance(seconds);
    this.engine.notify();
  }

  jumpToNextEnd(): number | null {
    const { engine } = this;
    const now = engine.now();
    const ends: number[] = [];
    for (const auction of engine.state.englishAuctions.values()) {
      if (englishState(engine, auction) === "ACTIVE") {
        ends.push(auction.endTime);
      }
    }
    for (const auction of engine.state.editionAuctions.values()) {
      if (auction.status === "OPEN") {
        ends.push(auctionTimes(engine, auction).editionEnd);
      }
    }
    const next = ends.filter((end) => end > now).sort((a, b) => a - b)[0];
    if (next === undefined) {
      return null;
    }
    // Land 30 seconds before the end, inside every anti-snipe window.
    this.advance(Math.max(0, next - now - 30));
    return next;
  }

  pauseForDispute(work: WorkKey): TxResult {
    return this.engine.tx(null, () => {
      pauseEnglishAuction(this.engine, auctionOf(this.engine, work));
    });
  }

  resolveDispute(work: WorkKey, upheld: boolean): TxResult {
    return this.engine.tx(null, () => {
      const token = this.engine.token(work);
      if (upheld) {
        appendStatement(this.engine, {
          role: "CURATOR",
          kind: "DISPUTE_OUTCOME",
          subject: { token: token.token, id: token.tokenId },
          summary: "Dispute upheld by TDH vote (simulated).",
        });
      }
      resolveEnglishDispute(this.engine, auctionOf(this.engine, work), upheld);
    });
  }

  setFederatedStatus(contract: Address, delisted: boolean): TxResult {
    return this.engine.tx(null, () => {
      const statement = appendStatement(this.engine, {
        role: "CURATOR",
        kind: delisted ? "DELISTING" : "RELISTING",
        subject: { token: contract, id: 0 },
        summary: delisted
          ? "TDH vote: delisted (simulated)."
          : "TDH vote: relisted (simulated).",
      });
      setFederatedStatus(
        this.engine,
        contract,
        delisted,
        delisted ? statement : null
      );
    });
  }

  reset(): void {
    this.engine.reset();
  }
}
