import type { Delegation } from "@/entities/IDelegation";

const USE_CASE_ALL = 1;
const USE_CASE_MINTING = 2;
const USE_CASE_AIRDROPS = 3;
const USE_CASE_MANAGER = 998;

export interface SetupWallet {
  /** Lowercased address. */
  readonly wallet: string;
  readonly display: string;
  readonly tdh: number;
}

/** A counterpart wallet named on a setup fact. */
export interface SetupCounterpart {
  readonly wallet: string;
  readonly display: string;
}

export interface SetupWalletFacts extends SetupWallet {
  /** Wallets that hold a Delegation Manager role for this wallet. */
  readonly managedBy: readonly SetupCounterpart[];
  /** Wallets this wallet manages. */
  readonly manages: readonly SetupCounterpart[];
  /** Wallets whose eligibility this wallet can use to mint (All or Minting). */
  readonly mintsFor: readonly SetupCounterpart[];
  /** Where this wallet's airdrops are delegated. */
  readonly airdropsTo: readonly SetupCounterpart[];
  /** Wallets whose airdrops are delegated to this wallet. */
  readonly airdropsFrom: readonly SetupCounterpart[];
}

export interface SetupChecklist {
  readonly combined: boolean;
  /** Wallets that have a Delegation Manager. */
  readonly managedWallets: readonly SetupCounterpart[];
  /** Wallets whose eligibility another wallet can use to mint. */
  readonly mintDelegators: readonly SetupCounterpart[];
}

const key = (address: string) => address.toLowerCase();

function isActive(delegation: Delegation, nowSeconds: number): boolean {
  // The contract ignores expiry when it checks a manager, so a manager role
  // stays listed until it is revoked.
  return (
    delegation.use_case === USE_CASE_MANAGER ||
    !delegation.expiry ||
    delegation.expiry > nowSeconds
  );
}

function addCounterpart(
  list: SetupCounterpart[],
  wallet: string,
  display: string | undefined
) {
  const walletKey = key(wallet);
  if (list.some((item) => item.wallet === walletKey)) {
    return;
  }
  list.push({ wallet: walletKey, display: display?.trim() ? display : wallet });
}

interface FactLists {
  readonly managedBy: SetupCounterpart[];
  readonly manages: SetupCounterpart[];
  readonly mintsFor: SetupCounterpart[];
  readonly airdropsTo: SetupCounterpart[];
  readonly airdropsFrom: SetupCounterpart[];
}

/** Adds what one delegation row says about `walletKey` to its fact lists. */
function addRowFacts(
  lists: FactLists,
  walletKey: string,
  row: Delegation,
  displayByWallet: ReadonlyMap<string, string>
) {
  const from = key(row.from_address);
  const to = key(row.to_address);
  if (from === to) {
    return;
  }
  const fromDisplay = displayByWallet.get(from) ?? row.from_display;
  const toDisplay = displayByWallet.get(to) ?? row.to_display;
  const isFrom = from === walletKey;
  const isTo = to === walletKey;

  switch (row.use_case) {
    case USE_CASE_MANAGER:
      if (isFrom) addCounterpart(lists.managedBy, to, toDisplay);
      if (isTo) addCounterpart(lists.manages, from, fromDisplay);
      return;
    case USE_CASE_ALL:
    case USE_CASE_MINTING:
      if (isTo) addCounterpart(lists.mintsFor, from, fromDisplay);
      return;
    case USE_CASE_AIRDROPS:
      if (isFrom) addCounterpart(lists.airdropsTo, to, toDisplay);
      if (isTo) addCounterpart(lists.airdropsFrom, from, fromDisplay);
      break;
  }
}

/**
 * Turns each wallet's delegation rows (from `GET /api/delegations/{wallet}`,
 * which lists rows where the wallet is on either side) into the facts the
 * setup panel shows. A row is read once per wallet it names, so a delegation
 * between two of the collector's wallets appears on both of them.
 */
export function getSetupWalletFacts(
  wallets: readonly SetupWallet[],
  delegationsByWallet: ReadonlyMap<string, readonly Delegation[]>,
  nowSeconds: number
): SetupWalletFacts[] {
  const displayByWallet = new Map(
    wallets.map((wallet) => [key(wallet.wallet), wallet.display])
  );

  return wallets.map((wallet) => {
    const walletKey = key(wallet.wallet);
    const lists: FactLists = {
      managedBy: [],
      manages: [],
      mintsFor: [],
      airdropsTo: [],
      airdropsFrom: [],
    };
    for (const row of delegationsByWallet.get(walletKey) ?? []) {
      if (isActive(row, nowSeconds)) {
        addRowFacts(lists, walletKey, row, displayByWallet);
      }
    }
    return { ...wallet, wallet: walletKey, ...lists };
  });
}

export function getSetupChecklist(
  facts: readonly SetupWalletFacts[]
): SetupChecklist {
  const managedWallets = facts
    .filter((wallet) => wallet.managedBy.length > 0)
    .map(({ wallet, display }) => ({ wallet, display }));

  const mintDelegators: SetupCounterpart[] = [];
  for (const wallet of facts) {
    for (const delegator of wallet.mintsFor) {
      addCounterpart(mintDelegators, delegator.wallet, delegator.display);
    }
  }

  return {
    combined: facts.length >= 2,
    managedWallets,
    mintDelegators,
  };
}
