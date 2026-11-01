import { SPLITS_DENOMINATOR, ZERO_ADDRESS } from "@/lib/stream/constants";
import type { TxError, TxResult } from "@/lib/stream/dataSource";
import { GAS_ESTIMATES, type GasOperation } from "@/lib/stream/gas";
import { SimClock } from "@/lib/stream/mock/clock";
import { mockAddress, mockTxHash } from "@/lib/stream/mock/ids";
import type {
  MockSplitWallet,
  MockState,
  MockToken,
} from "@/lib/stream/mock/state";
import type {
  Address,
  Hex32,
  ProvenanceEvent,
  StreamContracts,
  Wei,
  WorkKey,
} from "@/lib/stream/types";

/** A revert inside a mock transaction, named after the contract's custom error. */
class MockRevert extends Error {
  constructor(
    readonly code: string,
    readonly args?: Readonly<Record<string, string | number | boolean>>
  ) {
    super(code);
    this.name = "MockRevert";
  }
}

export function revert(
  code: string,
  args?: Readonly<Record<string, string | number | boolean>>
): never {
  throw new MockRevert(code, args);
}

/**
 * Resolves a synchronous mock read or write as a promise, so the mock keeps
 * the async shape of the chain data source (and a throw becomes a rejection).
 */
export function later<T>(run: () => T | PromiseLike<T>): Promise<T> {
  return Promise.resolve().then(run);
}

/** The simulated start: Tuesday 3 November 2026, 17:00 UTC. */
export const MOCK_EPOCH = Date.UTC(2026, 10, 3, 17, 0, 0) / 1_000;

const MOCK_CONTRACTS: StreamContracts = {
  stream: mockAddress("contract:stream"),
  editions: mockAddress("contract:editions"),
  workRecords: mockAddress("contract:work-records"),
  englishAuction: mockAddress("contract:english-auction"),
  editionAuction: mockAddress("contract:uniform-edition-auction"),
  economics: mockAddress("contract:economics"),
  statementLog: mockAddress("contract:statement-log"),
  artistRegistry: mockAddress("contract:artist-registry"),
  packageRegistry: mockAddress("contract:package-registry"),
  museum: mockAddress("account:6529-network-museum"),
  networkFeeRecipient: mockAddress("account:network-fee-recipient"),
  federationRegistry: mockAddress("contract:federation-registry"),
  federationFactory: mockAddress("contract:federation-factory"),
};

function emptyState(): MockState {
  return {
    txSequence: 0,
    devAccounts: [],
    pendingItems: new Map(),
    balances: new Map(),
    artists: new Map(),
    tokens: new Map(),
    englishAuctions: new Map(),
    editionAuctions: new Map(),
    credits: new Map(),
    splitWallets: new Map(),
    editionBalances: new Map(),
    statements: [],
    packages: [],
    federated: new Map(),
    museum: [],
    provenance: new Map(),
    networkFees: 0n,
    nextStreamTokenId: 1n,
    federatedDeployNonce: 0,
  };
}

interface MockEngineOptions {
  readonly start?: number;
  readonly wallNow?: () => number;
  readonly seed?: (engine: MockStreamEngine) => void;
}

/**
 * The mock's state container: the simulated clock, the "chain" state, change
 * notifications, and the bookkeeping every adapter shares (ETH balances,
 * credits, split-wallet payments, provenance). Sale rules live in
 * `lib/stream/mock/sales/*`.
 */
export class MockStreamEngine {
  readonly clock: SimClock;
  readonly contracts = MOCK_CONTRACTS;
  state: MockState = emptyState();
  private readonly listeners = new Set<() => void>();
  private changes = 0;
  private readonly seed: ((engine: MockStreamEngine) => void) | undefined;

  constructor(options: MockEngineOptions = {}) {
    this.clock = new SimClock(options.start ?? MOCK_EPOCH, options.wallNow);
    this.seed = options.seed;
    this.seed?.(this);
  }

  now(): number {
    return this.clock.now();
  }

  version(): number {
    return this.changes;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Announces a change: every read may differ now. */
  notify(): void {
    this.changes += 1;
    this.listeners.forEach((listener) => listener());
  }

  /** Rebuilds the seeded scenario and restarts the clock. */
  reset(): void {
    this.state = emptyState();
    this.clock.reset();
    this.seed?.(this);
    this.notify();
  }

  /**
   * Runs a write atomically: a revert restores the state and becomes
   * `{ ok: false }`; success gets a hash and its gas figure.
   */
  tx<T>(operation: GasOperation | null, run: () => T): TxResult<T> {
    const snapshot = structuredClone(this.state);
    try {
      const value = run();
      this.state.txSequence += 1;
      this.notify();
      return {
        ok: true,
        hash: mockTxHash(this.state.txSequence),
        gas: operation === null ? null : GAS_ESTIMATES[operation],
        operation,
        value,
      };
    } catch (error) {
      this.state = snapshot;
      if (error instanceof MockRevert) {
        const failure: TxError =
          error.args === undefined
            ? { code: error.code }
            : { code: error.code, args: error.args };
        return { ok: false, error: failure };
      }
      throw error;
    }
  }

  /** The hash the next successful transaction will get. */
  pendingTxHash(): Hex32 {
    return mockTxHash(this.state.txSequence + 1);
  }

  // ETH ---------------------------------------------------------------------

  balanceOf(account: Address): Wei {
    return this.state.balances.get(account) ?? 0n;
  }

  debit(account: Address, amount: Wei): void {
    const balance = this.balanceOf(account);
    if (balance < amount) {
      revert("InsufficientBalance", {
        required: amount.toString(),
        available: balance.toString(),
      });
    }
    this.state.balances.set(account, balance - amount);
  }

  creditBalance(account: Address, amount: Wei): void {
    this.state.balances.set(account, this.balanceOf(account) + amount);
  }

  /** An outbid or withdrawn 1/1 bid: credited, pulled later with `claim`. */
  addCredit(account: Address, amount: Wei): void {
    this.state.credits.set(
      account,
      (this.state.credits.get(account) ?? 0n) + amount
    );
  }

  /** Pays a primary sale: the fee share to the network, the rest to the seller split. */
  payPrimary(
    seller: Address,
    feeShare: number,
    amount: Wei
  ): { readonly fee: Wei; readonly seller: Wei } {
    const fee = (amount * BigInt(feeShare)) / BigInt(SPLITS_DENOMINATOR);
    const sellerPart = amount - fee;
    this.state.networkFees += fee;
    const wallet = this.state.splitWallets.get(seller);
    if (wallet) {
      wallet.received += sellerPart;
    }
    return { fee, seller: sellerPart };
  }

  splitWallet(address: Address): MockSplitWallet | undefined {
    return this.state.splitWallets.get(address);
  }

  // Tokens ------------------------------------------------------------------

  token(key: WorkKey): MockToken {
    const token = this.state.tokens.get(key);
    if (!token) {
      revert("UnknownWork", { key });
    }
    return token;
  }

  record(
    work: WorkKey,
    event: Omit<ProvenanceEvent, "at" | "txHash"> & { readonly at?: number }
  ): void {
    const list = this.state.provenance.get(work) ?? [];
    list.push({
      ...event,
      at: event.at ?? this.now(),
      txHash: this.pendingTxHash(),
    });
    this.state.provenance.set(work, list);
  }

  editionBalance(edition: WorkKey, account: Address): number {
    return this.state.editionBalances.get(`${edition}|${account}`) ?? 0;
  }

  mintEditions(edition: WorkKey, to: Address, count: number): void {
    if (count === 0) {
      return;
    }
    const key = `${edition}|${to}`;
    this.state.editionBalances.set(
      key,
      (this.state.editionBalances.get(key) ?? 0) + count
    );
    const token = this.token(edition);
    token.supply += count;
  }

  /** The 6529 Network Museum (`EconomicsResolver.museum()`). */
  museumAddress(): Address {
    return this.contracts.museum;
  }

  isZero(address: Address | null): boolean {
    return address === null || address === ZERO_ADDRESS;
  }
}
