import {
  CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS,
  CONSOLIDATION_WALLET_LIMIT,
} from "@/constants/consolidation.constants";
import { isAddress, zeroAddress } from "viem";

/**
 * Pure planning rules for building or extending a consolidation.
 *
 * A consolidation is a set of wallets in which every pair has registered
 * use case 999 in both directions. The plan gives each wallet exactly one
 * transaction (all of its missing directions at once) and orders the
 * signers so that wallets already in the current consolidation sign first
 * and joining wallets sign last. Signing in that order never splits the
 * current consolidation on the way to the final group.
 *
 * A four-wallet group counts only when one member has all three of its
 * links registered in both directions at or after
 * CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS ("fresh"). Four-wallet plans
 * therefore require every direction touching a joining wallet to be fresh,
 * and register an older direction again in its signer's step.
 */

const FOURTH_SLOT_GROUP_SIZE = 4;

export type ConsolidationWalletIssue = "invalid" | "duplicate";

interface ConsolidationWalletValidation {
  /** Issue for each entry, in entry order. Blank entries have no issue. */
  readonly issues: readonly (ConsolidationWalletIssue | undefined)[];
  /** Lowercased valid wallets in entry order, without blanks or duplicates. */
  readonly wallets: readonly string[];
  readonly tooFew: boolean;
  readonly tooMany: boolean;
  readonly isValid: boolean;
}

interface ConsolidationPlanStep {
  /** Lowercased wallet that signs this step's single transaction. */
  readonly signer: string;
  /** Lowercased wallets the signer has to register (or register again). */
  readonly targets: readonly string[];
  readonly isExistingMember: boolean;
}

/**
 * `all-steps`: the plan forms a four-wallet group before activation, so
 * every step waits; registrations made earlier would never count.
 */
export type FourthSlotWait = "none" | "all-steps";

export interface ConsolidationPlan {
  readonly wallets: readonly string[];
  readonly steps: readonly ConsolidationPlanStep[];
  readonly finalGroupSize: number;
  readonly needsFourthSlot: boolean;
  readonly beforeFourthSlotActivation: boolean;
  readonly fourthSlotWait: FourthSlotWait;
  /** Wallets whose every direction must be fresh (four-wallet plans only). */
  readonly freshWallets: readonly string[];
  /** Some directions are registered again because they predate activation. */
  readonly reregistersStaleLinks: boolean;
  /**
   * A joining wallet already registered toward an existing member whose step
   * registers back, so that step completes or renews the pair early.
   */
  readonly outOfOrder: boolean;
}

type DirectedLinkLookup = (from: string, to: string) => boolean;

interface LinkStatus {
  /** Direction registered on-chain. */
  readonly isRegistered: DirectedLinkLookup;
  /** Direction recorded by 6529 as registered at or after activation. */
  readonly isFresh: DirectedLinkLookup;
}

export type ConsolidationStepStatus =
  | "complete"
  | "recording"
  | "current"
  | "upcoming";

type ConsolidationStepBlock =
  | "earlier-steps"
  | "fourth-slot"
  | "disconnected"
  | "wrong-wallet";

export interface ConsolidationStepProgress {
  readonly index: number;
  readonly signer: string;
  readonly targets: readonly string[];
  /** Targets the step's transaction still has to send. */
  readonly pendingTargets: readonly string[];
  /**
   * `recording`: every remaining direction was confirmed in this session and
   * waits for 6529 to record its registration time.
   */
  readonly status: ConsolidationStepStatus;
  readonly waitsForFourthSlot: boolean;
  readonly block: ConsolidationStepBlock | undefined;
  readonly canSign: boolean;
}

export function toWalletKey(wallet: string): string {
  return wallet.trim().toLowerCase();
}

export function toDirectedLinkKey(from: string, to: string): string {
  return `${toWalletKey(from)}>${toWalletKey(to)}`;
}

export function createDirectedLinkLookup(
  linkKeys: Iterable<string>
): DirectedLinkLookup {
  const keys = new Set(linkKeys);
  return (from, to) => keys.has(toDirectedLinkKey(from, to));
}

/** Every ordered pair of distinct wallets, in list order. */
export function getDirectedWalletPairs(
  wallets: readonly string[]
): readonly (readonly [string, string])[] {
  return wallets.flatMap((from) =>
    wallets.filter((to) => to !== from).map((to) => [from, to] as const)
  );
}

/** Whether a group of this many wallets uses the fourth slot. */
export function requiresFourthSlot(walletCount: number): boolean {
  return walletCount >= FOURTH_SLOT_GROUP_SIZE;
}

function isValidWallet(value: string): boolean {
  return isAddress(value) && toWalletKey(value) !== zeroAddress;
}

export function validateConsolidationWallets(
  entries: readonly string[]
): ConsolidationWalletValidation {
  const seen = new Set<string>();
  const wallets: string[] = [];
  const issues = entries.map((entry): ConsolidationWalletIssue | undefined => {
    const value = entry.trim();
    if (!value) {
      return undefined;
    }
    if (!isValidWallet(value)) {
      return "invalid";
    }
    const key = toWalletKey(value);
    if (seen.has(key)) {
      return "duplicate";
    }
    seen.add(key);
    wallets.push(key);
    return undefined;
  });
  const hasIssue = issues.some((issue) => issue !== undefined);
  const tooFew = wallets.length < 2;
  const tooMany = wallets.length > CONSOLIDATION_WALLET_LIMIT;

  return {
    issues,
    wallets,
    tooFew,
    tooMany,
    isValid: !hasIssue && !tooFew && !tooMany,
  };
}

/**
 * Joining wallets are those outside the current consolidation. With fewer
 * than three current members listed, every wallet counts as joining.
 */
function getFreshWallets(
  wallets: readonly string[],
  existing: ReadonlySet<string>
): string[] {
  if (!requiresFourthSlot(wallets.length)) {
    return [];
  }
  const members = wallets.filter((wallet) => existing.has(wallet));
  return members.length >= FOURTH_SLOT_GROUP_SIZE - 1
    ? wallets.filter((wallet) => !existing.has(wallet))
    : [...wallets];
}

function isLinkSatisfied(
  status: LinkStatus,
  freshWallets: ReadonlySet<string>,
  from: string,
  to: string
): boolean {
  if (!status.isRegistered(from, to)) {
    return false;
  }
  const needsFresh = freshWallets.has(from) || freshWallets.has(to);
  return !needsFresh || status.isFresh(from, to);
}

function orderSteps(
  steps: readonly ConsolidationPlanStep[]
): ConsolidationPlanStep[] {
  const existing = steps.filter((step) => step.isExistingMember);
  // Joining wallets may sign in any order; fewer targets first keeps the
  // wallet with the most links last.
  const joining = steps
    .filter((step) => !step.isExistingMember)
    .map((step, position) => ({ step, position }))
    .sort(
      (a, b) =>
        a.step.targets.length - b.step.targets.length || a.position - b.position
    )
    .map(({ step }) => step);
  return [...existing, ...joining];
}

function isOutOfOrder(
  steps: readonly ConsolidationPlanStep[],
  existing: ReadonlySet<string>,
  isRegistered: DirectedLinkLookup
): boolean {
  return steps.some(
    (step) =>
      step.isExistingMember &&
      step.targets.some(
        (target) => !existing.has(target) && isRegistered(target, step.signer)
      )
  );
}

export function buildConsolidationPlan(input: {
  readonly wallets: readonly string[];
  readonly existingMembers: readonly string[];
  readonly isRegistered: DirectedLinkLookup;
  readonly isFresh: DirectedLinkLookup;
  readonly nowMs: number;
}): ConsolidationPlan {
  const wallets = [...new Set(input.wallets.map(toWalletKey))];
  const existing = new Set(
    input.existingMembers
      .map(toWalletKey)
      .filter((member) => wallets.includes(member))
  );
  const freshWallets = getFreshWallets(wallets, existing);
  const freshSet = new Set(freshWallets);
  const pendingSteps = wallets
    .map((signer) => ({
      signer,
      targets: wallets.filter(
        (target) =>
          target !== signer && !isLinkSatisfied(input, freshSet, signer, target)
      ),
      isExistingMember: existing.has(signer),
    }))
    .filter((step) => step.targets.length > 0);
  const steps = orderSteps(pendingSteps);
  const needsFourthSlot = requiresFourthSlot(wallets.length);
  const beforeFourthSlotActivation =
    input.nowMs < CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS;

  return {
    wallets,
    steps,
    finalGroupSize: wallets.length,
    needsFourthSlot,
    beforeFourthSlotActivation,
    fourthSlotWait:
      needsFourthSlot && beforeFourthSlotActivation ? "all-steps" : "none",
    freshWallets,
    reregistersStaleLinks: steps.some((step) =>
      step.targets.some((target) => input.isRegistered(step.signer, target))
    ),
    outOfOrder: isOutOfOrder(steps, existing, input.isRegistered),
  };
}

function getCurrentStepBlock(
  waitsForFourthSlot: boolean,
  signer: string,
  connectedAddress: string | undefined
): ConsolidationStepBlock | undefined {
  if (waitsForFourthSlot) {
    return "fourth-slot";
  }
  if (!connectedAddress) {
    return "disconnected";
  }
  return toWalletKey(connectedAddress) === signer ? undefined : "wrong-wallet";
}

/**
 * Applies live status to a plan. Steps stay numbered as planned; only the
 * first step with directions left to send is actionable, and only by its
 * signer. A direction confirmed on-chain in this session that 6529 has not
 * recorded as fresh yet is not sent again.
 */
export function resolveConsolidationProgress(input: {
  readonly plan: Pick<
    ConsolidationPlan,
    "fourthSlotWait" | "steps" | "freshWallets"
  >;
  readonly isRegistered: DirectedLinkLookup;
  readonly isFresh: DirectedLinkLookup;
  readonly recordedLinkKeys: ReadonlySet<string>;
  readonly connectedAddress: string | undefined;
}): ConsolidationStepProgress[] {
  const { plan, recordedLinkKeys, connectedAddress } = input;
  const freshSet = new Set(plan.freshWallets);
  const waitsForFourthSlot = plan.fourthSlotWait === "all-steps";
  let currentFound = false;

  return plan.steps.map((step, index) => {
    const unsatisfied = step.targets.filter(
      (target) => !isLinkSatisfied(input, freshSet, step.signer, target)
    );
    const pendingTargets = unsatisfied.filter(
      (target) =>
        !input.isRegistered(step.signer, target) ||
        !recordedLinkKeys.has(toDirectedLinkKey(step.signer, target))
    );
    let status: ConsolidationStepStatus = "complete";
    let block: ConsolidationStepBlock | undefined;

    if (pendingTargets.length > 0) {
      status = currentFound ? "upcoming" : "current";
      block = currentFound
        ? "earlier-steps"
        : getCurrentStepBlock(
            waitsForFourthSlot,
            step.signer,
            connectedAddress
          );
      currentFound = true;
    } else if (unsatisfied.length > 0) {
      status = "recording";
    }

    return {
      index,
      signer: step.signer,
      targets: step.targets,
      pendingTargets,
      status,
      waitsForFourthSlot,
      block,
      canSign: status === "current" && block === undefined,
    };
  });
}
