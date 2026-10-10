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
 * and new wallets sign last. Signing in that order never splits the current
 * consolidation on the way to the final group.
 */

// The group size that needs the fourth slot, which only counts for links
// completed at or after CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS.
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
  /** Lowercased wallets the signer still has to register toward. */
  readonly targets: readonly string[];
  readonly isExistingMember: boolean;
}

/**
 * How the fourth-slot activation gate applies before activation:
 * - `none`: no gate (fewer than four wallets, or activation has passed).
 * - `final-step`: the last signer completes all three of its links in its
 *   own step, so only that step waits for activation.
 * - `all-steps`: no signer completes all of its links in one step, so every
 *   remaining step waits for activation.
 * - `unreachable`: every wallet already has a completed link from before
 *   activation, so no member can qualify the group as four wallets.
 */
export type FourthSlotWait =
  | "none"
  | "final-step"
  | "all-steps"
  | "unreachable";

export interface ConsolidationPlan {
  readonly wallets: readonly string[];
  readonly steps: readonly ConsolidationPlanStep[];
  readonly finalGroupSize: number;
  readonly needsFourthSlot: boolean;
  readonly beforeFourthSlotActivation: boolean;
  readonly fourthSlotWait: FourthSlotWait;
  /** A new wallet registered toward an existing member that has not answered. */
  readonly outOfOrder: boolean;
}

type DirectedLinkLookup = (from: string, to: string) => boolean;

export type ConsolidationStepStatus = "complete" | "current" | "upcoming";

type ConsolidationStepBlock =
  | "earlier-steps"
  | "fourth-slot"
  | "disconnected"
  | "wrong-wallet";

export interface ConsolidationStepProgress {
  readonly index: number;
  readonly signer: string;
  readonly targets: readonly string[];
  /** Targets still unregistered on-chain; the step's transaction sends these. */
  readonly pendingTargets: readonly string[];
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
  registeredLinkKeys: Iterable<string>
): DirectedLinkLookup {
  const registered = new Set(registeredLinkKeys);
  return (from, to) => registered.has(toDirectedLinkKey(from, to));
}

/** Every ordered pair of distinct wallets, in list order. */
export function getDirectedWalletPairs(
  wallets: readonly string[]
): readonly (readonly [string, string])[] {
  return wallets.flatMap((from) =>
    wallets.filter((to) => to !== from).map((to) => [from, to] as const)
  );
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

function hasCompletedLink(
  wallet: string,
  wallets: readonly string[],
  isRegistered: DirectedLinkLookup
): boolean {
  return wallets.some(
    (other) =>
      other !== wallet &&
      isRegistered(wallet, other) &&
      isRegistered(other, wallet)
  );
}

function getFourthSlotWait(
  wallets: readonly string[],
  steps: readonly ConsolidationPlanStep[],
  isRegistered: DirectedLinkLookup
): FourthSlotWait {
  const hasQualifyingMember = wallets.some(
    (wallet) => !hasCompletedLink(wallet, wallets, isRegistered)
  );
  if (!hasQualifyingMember) {
    return "unreachable";
  }
  const finalStep = steps.at(-1);
  if (finalStep?.targets.length === wallets.length - 1) {
    return "final-step";
  }
  return "all-steps";
}

function orderSteps(
  steps: readonly ConsolidationPlanStep[]
): ConsolidationPlanStep[] {
  const existing = steps.filter((step) => step.isExistingMember);
  // New wallets may sign in any order; fewer targets first lets the final
  // signer complete all of its links in one step whenever possible.
  const added = steps
    .filter((step) => !step.isExistingMember)
    .map((step, position) => ({ step, position }))
    .sort(
      (a, b) =>
        a.step.targets.length - b.step.targets.length || a.position - b.position
    )
    .map(({ step }) => step);
  return [...existing, ...added];
}

function isOutOfOrder(
  wallets: readonly string[],
  existing: ReadonlySet<string>,
  isRegistered: DirectedLinkLookup
): boolean {
  return wallets.some(
    (added) =>
      !existing.has(added) &&
      [...existing].some(
        (member) => isRegistered(added, member) && !isRegistered(member, added)
      )
  );
}

export function buildConsolidationPlan(input: {
  readonly wallets: readonly string[];
  readonly existingMembers: readonly string[];
  readonly isRegistered: DirectedLinkLookup;
  readonly nowMs: number;
}): ConsolidationPlan {
  const wallets = [...new Set(input.wallets.map(toWalletKey))];
  const existing = new Set(
    input.existingMembers
      .map(toWalletKey)
      .filter((member) => wallets.includes(member))
  );
  const pendingSteps = wallets
    .map((signer) => ({
      signer,
      targets: wallets.filter(
        (target) => target !== signer && !input.isRegistered(signer, target)
      ),
      isExistingMember: existing.has(signer),
    }))
    .filter((step) => step.targets.length > 0);
  const steps = orderSteps(pendingSteps);
  const needsFourthSlot = wallets.length >= FOURTH_SLOT_GROUP_SIZE;
  const beforeFourthSlotActivation =
    input.nowMs < CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS;

  return {
    wallets,
    steps,
    finalGroupSize: wallets.length,
    needsFourthSlot,
    beforeFourthSlotActivation,
    fourthSlotWait:
      needsFourthSlot && beforeFourthSlotActivation
        ? getFourthSlotWait(wallets, steps, input.isRegistered)
        : "none",
    outOfOrder: isOutOfOrder(wallets, existing, input.isRegistered),
  };
}

function stepWaitsForFourthSlot(
  plan: Pick<ConsolidationPlan, "fourthSlotWait" | "steps">,
  index: number
): boolean {
  switch (plan.fourthSlotWait) {
    case "final-step":
      return index === plan.steps.length - 1;
    case "all-steps":
    case "unreachable":
      return true;
    case "none":
      return false;
  }
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
 * Applies live on-chain status to a plan. Steps stay numbered as planned;
 * only the first incomplete step is actionable, and only by its signer.
 */
export function resolveConsolidationProgress(input: {
  readonly plan: Pick<ConsolidationPlan, "fourthSlotWait" | "steps">;
  readonly isRegistered: DirectedLinkLookup;
  readonly connectedAddress: string | undefined;
}): ConsolidationStepProgress[] {
  const { plan, isRegistered, connectedAddress } = input;
  let currentFound = false;

  return plan.steps.map((step, index) => {
    const pendingTargets = step.targets.filter(
      (target) => !isRegistered(step.signer, target)
    );
    const waitsForFourthSlot = stepWaitsForFourthSlot(plan, index);
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
