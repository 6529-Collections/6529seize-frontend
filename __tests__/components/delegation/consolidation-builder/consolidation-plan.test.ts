import {
  buildConsolidationPlan,
  createDirectedLinkLookup,
  getDirectedWalletPairs,
  resolveConsolidationProgress,
  toDirectedLinkKey,
  validateConsolidationWallets,
} from "@/components/delegation/consolidation-builder/consolidation-plan";
import {
  CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS,
  CONSOLIDATION_WALLET_LIMIT,
} from "@/constants/consolidation.constants";

const A = `0x${"a".repeat(40)}`;
const B = `0x${"b".repeat(40)}`;
const C = `0x${"c".repeat(40)}`;
const D = `0x${"d".repeat(40)}`;
const E = `0x${"e".repeat(40)}`;

const BEFORE_ACTIVATION = CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS - 1;
const AT_ACTIVATION = CONSOLIDATION_FOURTH_WALLET_ACTIVATION_MS;

type Link = readonly [string, string];

function both(...pairs: readonly Link[]): Link[] {
  return pairs.flatMap(([x, y]) => [
    [x, y],
    [y, x],
  ]);
}

function lookup(links: readonly Link[]) {
  return createDirectedLinkLookup(
    links.map(([from, to]) => toDirectedLinkKey(from, to))
  );
}

function plan(input: {
  wallets: readonly string[];
  existingMembers?: readonly string[];
  links?: readonly Link[];
  nowMs?: number;
}) {
  return buildConsolidationPlan({
    wallets: input.wallets,
    existingMembers: input.existingMembers ?? [],
    isRegistered: lookup(input.links ?? []),
    nowMs: input.nowMs ?? AT_ACTIVATION,
  });
}

function summarize(
  steps: readonly { signer: string; targets: readonly string[] }[]
) {
  return steps.map((step) => [step.signer, [...step.targets]]);
}

describe("validateConsolidationWallets", () => {
  it("accepts two to four distinct wallets and lowercases them", () => {
    const checksummed = "0x52908400098527886E0F7030069857D2E4169EE7";
    const result = validateConsolidationWallets([` ${checksummed} `, B, ""]);

    expect(result).toEqual({
      issues: [undefined, undefined, undefined],
      wallets: [checksummed.toLowerCase(), B],
      tooFew: false,
      tooMany: false,
      isValid: true,
    });
  });

  it("flags malformed, zero, and bad-checksum addresses as invalid", () => {
    const badChecksum = "0xAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const result = validateConsolidationWallets([
      "not-a-wallet",
      "0x0000000000000000000000000000000000000000",
      badChecksum,
      A,
    ]);

    expect(result.issues).toEqual(["invalid", "invalid", "invalid", undefined]);
    expect(result.wallets).toEqual([A]);
    expect(result.tooFew).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it("flags case-insensitive duplicates after the first entry", () => {
    const checksummed = "0x52908400098527886E0F7030069857D2E4169EE7";
    const result = validateConsolidationWallets([
      checksummed,
      checksummed.toLowerCase(),
    ]);

    expect(result.issues).toEqual([undefined, "duplicate"]);
    expect(result.wallets).toEqual([checksummed.toLowerCase()]);
    expect(result.isValid).toBe(false);
  });

  it(`rejects more than ${CONSOLIDATION_WALLET_LIMIT} wallets`, () => {
    const result = validateConsolidationWallets([A, B, C, D, E]);

    expect(result.wallets).toHaveLength(5);
    expect(result.tooMany).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it("requires at least two wallets and ignores blank rows", () => {
    const result = validateConsolidationWallets([A, " ", ""]);

    expect(result.issues).toEqual([undefined, undefined, undefined]);
    expect(result.tooFew).toBe(true);
    expect(result.isValid).toBe(false);
  });
});

describe("getDirectedWalletPairs", () => {
  it("lists every ordered pair of distinct wallets", () => {
    expect(getDirectedWalletPairs([A, B, C])).toEqual([
      [A, B],
      [A, C],
      [B, A],
      [B, C],
      [C, A],
      [C, B],
    ]);
  });
});

describe("buildConsolidationPlan", () => {
  it("adds a fourth wallet: existing members register one link, the new wallet signs last", () => {
    const result = plan({
      wallets: [D, A, B, C],
      existingMembers: [A, B, C],
      links: both([A, B], [A, C], [B, C]),
    });

    expect(summarize(result.steps)).toEqual([
      [A, [D]],
      [B, [D]],
      [C, [D]],
      [D, [A, B, C]],
    ]);
    expect(result.steps.map((step) => step.isExistingMember)).toEqual([
      true,
      true,
      true,
      false,
    ]);
    expect(result.finalGroupSize).toBe(4);
    expect(result.needsFourthSlot).toBe(true);
    expect(result.outOfOrder).toBe(false);
  });

  it("builds a new group from scratch in list order with one batch per wallet", () => {
    const result = plan({ wallets: [A, B, C, D] });

    expect(summarize(result.steps)).toEqual([
      [A, [B, C, D]],
      [B, [A, C, D]],
      [C, [A, B, D]],
      [D, [A, B, C]],
    ]);
  });

  it("orders existing members first when two new wallets join a pair", () => {
    const result = plan({
      wallets: [C, A, D, B],
      existingMembers: [A, B],
      links: both([A, B]),
    });

    expect(summarize(result.steps)).toEqual([
      [A, [C, D]],
      [B, [C, D]],
      [C, [A, D, B]],
      [D, [C, A, B]],
    ]);
  });

  it("ignores existing members that are not listed", () => {
    const result = plan({
      wallets: [A, D],
      existingMembers: [A, B, C],
      links: both([A, B], [A, C], [B, C]),
    });

    expect(summarize(result.steps)).toEqual([
      [A, [D]],
      [D, [A]],
    ]);
    expect(result.needsFourthSlot).toBe(false);
  });

  it("drops directions that are already registered and wallets with nothing to do", () => {
    const result = plan({
      wallets: [A, B, D],
      existingMembers: [A, B],
      links: [...both([A, B]), [A, D]],
    });

    expect(summarize(result.steps)).toEqual([
      [B, [D]],
      [D, [A, B]],
    ]);
  });

  it("returns no steps when every pair is complete", () => {
    const result = plan({
      wallets: [A, B, C],
      existingMembers: [A, B, C],
      links: both([A, B], [A, C], [B, C]),
    });

    expect(result.steps).toEqual([]);
    expect(result.fourthSlotWait).toBe("none");
  });

  it("deduplicates wallets case-insensitively", () => {
    const result = plan({ wallets: [A, A.toUpperCase().replace("0X", "0x")] });

    expect(result.wallets).toEqual([A]);
    expect(result.steps).toEqual([]);
  });

  describe("fourth-slot activation", () => {
    it("holds only the final step before activation when it completes three links", () => {
      const result = plan({
        wallets: [A, B, C, D],
        existingMembers: [A, B, C],
        links: both([A, B], [A, C], [B, C]),
        nowMs: BEFORE_ACTIVATION,
      });

      expect(result.beforeFourthSlotActivation).toBe(true);
      expect(result.fourthSlotWait).toBe("final-step");
    });

    it("does not hold any step at or after activation", () => {
      const result = plan({
        wallets: [A, B, C, D],
        existingMembers: [A, B, C],
        links: both([A, B], [A, C], [B, C]),
        nowMs: AT_ACTIVATION,
      });

      expect(result.beforeFourthSlotActivation).toBe(false);
      expect(result.fourthSlotWait).toBe("none");
    });

    it("does not gate groups of three or fewer", () => {
      const result = plan({
        wallets: [A, B, C],
        existingMembers: [A, B],
        links: both([A, B]),
        nowMs: BEFORE_ACTIVATION,
      });

      expect(result.needsFourthSlot).toBe(false);
      expect(result.fourthSlotWait).toBe("none");
    });

    it("puts the new wallet with fewer missing links first so the last signer completes three", () => {
      const result = plan({
        wallets: [A, B, C, D],
        links: [[D, A]],
        nowMs: BEFORE_ACTIVATION,
      });

      expect(summarize(result.steps)).toEqual([
        [D, [B, C]],
        [A, [B, C, D]],
        [B, [A, C, D]],
        [C, [A, B, D]],
      ]);
      expect(result.fourthSlotWait).toBe("final-step");
    });

    it("holds every step when the new wallet already signed out of order", () => {
      const result = plan({
        wallets: [A, B, C, D],
        existingMembers: [A, B, C],
        links: [...both([A, B], [A, C], [B, C]), [D, A], [D, B], [D, C]],
        nowMs: BEFORE_ACTIVATION,
      });

      expect(summarize(result.steps)).toEqual([
        [A, [D]],
        [B, [D]],
        [C, [D]],
      ]);
      expect(result.outOfOrder).toBe(true);
      expect(result.fourthSlotWait).toBe("all-steps");
    });

    it("reports two merging pairs as unreachable before activation", () => {
      const result = plan({
        wallets: [A, B, C, D],
        existingMembers: [A, B],
        links: both([A, B], [C, D]),
        nowMs: BEFORE_ACTIVATION,
      });

      expect(result.fourthSlotWait).toBe("unreachable");
    });
  });
});

describe("resolveConsolidationProgress", () => {
  const groupLinks = both([A, B], [A, C], [B, C]);
  const addFourth = () =>
    plan({
      wallets: [A, B, C, D],
      existingMembers: [A, B, C],
      links: groupLinks,
      nowMs: BEFORE_ACTIVATION,
    });

  it("lets only the first step's signer act and blocks later steps", () => {
    const steps = resolveConsolidationProgress({
      plan: addFourth(),
      isRegistered: lookup(groupLinks),
      connectedAddress: A.toUpperCase().replace("0X", "0x"),
    });

    expect(
      steps.map(({ signer, status, block, canSign }) => ({
        signer,
        status,
        block,
        canSign,
      }))
    ).toEqual([
      { signer: A, status: "current", block: undefined, canSign: true },
      { signer: B, status: "upcoming", block: "earlier-steps", canSign: false },
      { signer: C, status: "upcoming", block: "earlier-steps", canSign: false },
      { signer: D, status: "upcoming", block: "earlier-steps", canSign: false },
    ]);
  });

  it("asks for the right wallet or a connection", () => {
    const wrongWallet = resolveConsolidationProgress({
      plan: addFourth(),
      isRegistered: lookup(groupLinks),
      connectedAddress: D,
    });
    const disconnected = resolveConsolidationProgress({
      plan: addFourth(),
      isRegistered: lookup(groupLinks),
      connectedAddress: undefined,
    });

    expect(wrongWallet[0]).toMatchObject({
      block: "wrong-wallet",
      canSign: false,
    });
    expect(disconnected[0]).toMatchObject({
      block: "disconnected",
      canSign: false,
    });
  });

  it("keeps step numbers and advances as links confirm on-chain", () => {
    const steps = resolveConsolidationProgress({
      plan: addFourth(),
      isRegistered: lookup([...groupLinks, [A, D]]),
      connectedAddress: B,
    });

    expect(steps.map((step) => [step.index, step.status])).toEqual([
      [0, "complete"],
      [1, "current"],
      [2, "upcoming"],
      [3, "upcoming"],
    ]);
    expect(steps[0]?.pendingTargets).toEqual([]);
    expect(steps[1]?.canSign).toBe(true);
  });

  it("holds the final step before activation even for its signer", () => {
    const steps = resolveConsolidationProgress({
      plan: addFourth(),
      isRegistered: lookup([...groupLinks, [A, D], [B, D], [C, D]]),
      connectedAddress: D,
    });

    expect(steps[3]).toMatchObject({
      status: "current",
      waitsForFourthSlot: true,
      block: "fourth-slot",
      canSign: false,
    });
  });

  it("opens the final step after activation", () => {
    const afterActivation = plan({
      wallets: [A, B, C, D],
      existingMembers: [A, B, C],
      links: groupLinks,
      nowMs: AT_ACTIVATION,
    });
    const steps = resolveConsolidationProgress({
      plan: afterActivation,
      isRegistered: lookup([...groupLinks, [A, D], [B, D], [C, D]]),
      connectedAddress: D,
    });

    expect(steps[3]).toMatchObject({
      status: "current",
      waitsForFourthSlot: false,
      block: undefined,
      canSign: true,
      pendingTargets: [A, B, C],
    });
  });

  it("sends only the directions still missing", () => {
    const fromScratch = plan({ wallets: [A, B, C] });
    const steps = resolveConsolidationProgress({
      plan: fromScratch,
      isRegistered: lookup([[A, C]]),
      connectedAddress: A,
    });

    expect(steps[0]).toMatchObject({
      targets: [B, C],
      pendingTargets: [B],
      canSign: true,
    });
  });

  it("holds every step when activation is unreachable", () => {
    const merging = plan({
      wallets: [A, B, C, D],
      existingMembers: [A, B],
      links: both([A, B], [C, D]),
      nowMs: BEFORE_ACTIVATION,
    });
    const steps = resolveConsolidationProgress({
      plan: merging,
      isRegistered: lookup(both([A, B], [C, D])),
      connectedAddress: A,
    });

    expect(steps.every((step) => step.waitsForFourthSlot)).toBe(true);
    expect(steps[0]).toMatchObject({ block: "fourth-slot", canSign: false });
  });
});
