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
  fresh?: readonly Link[];
  nowMs?: number;
}) {
  return buildConsolidationPlan({
    wallets: input.wallets,
    existingMembers: input.existingMembers ?? [],
    isRegistered: lookup(input.links ?? []),
    isFresh: lookup(input.fresh ?? []),
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
    expect(result.freshWallets).toEqual([D]);
    expect(result.reregistersStaleLinks).toBe(false);
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
    expect(result.freshWallets).toEqual([A, B, C, D]);
  });

  it("orders existing members first when two new wallets join a pair", () => {
    const pair = both([A, B]);
    const result = plan({
      wallets: [C, A, D, B],
      existingMembers: [A, B],
      links: pair,
      fresh: pair,
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
    expect(result.freshWallets).toEqual([]);
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

  describe("groups of two or three", () => {
    it("use on-chain status only and never register a link again", () => {
      const result = plan({
        wallets: [A, B, C],
        existingMembers: [A, B],
        links: [...both([A, B]), [A, C]],
        nowMs: AT_ACTIVATION,
      });

      expect(summarize(result.steps)).toEqual([
        [B, [C]],
        [C, [A, B]],
      ]);
      expect(result.freshWallets).toEqual([]);
      expect(result.reregistersStaleLinks).toBe(false);
      expect(result.fourthSlotWait).toBe("none");
    });

    it("are not held before activation", () => {
      const result = plan({
        wallets: [A, B, C],
        existingMembers: [A, B],
        links: both([A, B]),
        nowMs: BEFORE_ACTIVATION,
      });

      expect(result.needsFourthSlot).toBe(false);
      expect(result.fourthSlotWait).toBe("none");
    });

    it("flag a new wallet that registered before an existing member", () => {
      const result = plan({
        wallets: [A, B, C],
        existingMembers: [A, B],
        links: [...both([A, B]), [C, A]],
      });

      expect(summarize(result.steps)).toEqual([
        [A, [C]],
        [B, [C]],
        [C, [B]],
      ]);
      expect(result.outOfOrder).toBe(true);
    });
  });

  describe("four-wallet groups", () => {
    it("hold every step before activation", () => {
      const result = plan({
        wallets: [A, B, C, D],
        existingMembers: [A, B, C],
        links: both([A, B], [A, C], [B, C]),
        nowMs: BEFORE_ACTIVATION,
      });

      expect(result.beforeFourthSlotActivation).toBe(true);
      expect(result.fourthSlotWait).toBe("all-steps");
    });

    it("hold nothing at or after activation", () => {
      const result = plan({
        wallets: [A, B, C, D],
        existingMembers: [A, B, C],
        links: both([A, B], [A, C], [B, C]),
        nowMs: AT_ACTIVATION,
      });

      expect(result.beforeFourthSlotActivation).toBe(false);
      expect(result.fourthSlotWait).toBe("none");
    });

    it("register a member's older link to the joining wallet again in that member's step", () => {
      const result = plan({
        wallets: [A, B, C, D],
        existingMembers: [A, B, C],
        links: [...both([A, B], [A, C], [B, C]), [A, D]],
      });

      expect(summarize(result.steps)).toEqual([
        [A, [D]],
        [B, [D]],
        [C, [D]],
        [D, [A, B, C]],
      ]);
      expect(result.reregistersStaleLinks).toBe(true);
      expect(result.outOfOrder).toBe(false);
    });

    it("register an older confirmed pair with the joining wallet again on both sides", () => {
      const result = plan({
        wallets: [A, B, C, D],
        existingMembers: [A, B, C],
        links: both([A, B], [A, C], [B, C], [A, D]),
      });

      expect(summarize(result.steps)).toEqual([
        [A, [D]],
        [B, [D]],
        [C, [D]],
        [D, [A, B, C]],
      ]);
      expect(result.reregistersStaleLinks).toBe(true);
      expect(result.outOfOrder).toBe(true);
    });

    it("skip directions already registered from activation", () => {
      const fresh: Link[] = [
        [A, D],
        [D, A],
      ];
      const result = plan({
        wallets: [A, B, C, D],
        existingMembers: [A, B, C],
        links: [...both([A, B], [A, C], [B, C]), ...fresh],
        fresh,
      });

      expect(summarize(result.steps)).toEqual([
        [B, [D]],
        [C, [D]],
        [D, [B, C]],
      ]);
      expect(result.reregistersStaleLinks).toBe(false);
    });

    it("do not trust a recorded time for a direction that is no longer registered", () => {
      const result = plan({
        wallets: [A, B, C, D],
        existingMembers: [A, B, C],
        links: both([A, B], [A, C], [B, C]),
        fresh: [[A, D]],
      });

      expect(summarize(result.steps)[0]).toEqual([A, [D]]);
    });

    it("leave links between existing members alone", () => {
      const result = plan({
        wallets: [A, B, C, D],
        existingMembers: [A, B, C],
        links: both([A, B], [A, C], [B, C]),
        fresh: [],
      });

      expect(result.steps.flatMap((step) => step.targets)).toEqual([
        D,
        D,
        D,
        A,
        B,
        C,
      ]);
    });

    it("require every link to be fresh when fewer than three current members are listed", () => {
      const result = plan({
        wallets: [A, B, C, D],
        existingMembers: [A, B],
        links: both([A, B], [C, D]),
      });

      expect(result.freshWallets).toEqual([A, B, C, D]);
      expect(summarize(result.steps)).toEqual([
        [A, [B, C, D]],
        [B, [A, C, D]],
        [C, [A, B, D]],
        [D, [A, B, C]],
      ]);
      expect(result.reregistersStaleLinks).toBe(true);
    });

    it("need no fresh links when all four wallets are already consolidated", () => {
      const result = plan({
        wallets: [A, B, C, D],
        existingMembers: [A, B, C, D],
        links: both([A, B], [A, C], [B, C], [A, D], [B, D]),
      });

      expect(result.freshWallets).toEqual([]);
      expect(summarize(result.steps)).toEqual([
        [C, [D]],
        [D, [C]],
      ]);
    });

    it("let the joining wallet with fewer links left sign first", () => {
      const fresh: Link[] = [[D, A]];
      const result = plan({
        wallets: [A, B, C, D],
        links: fresh,
        fresh,
      });

      expect(summarize(result.steps)).toEqual([
        [D, [B, C]],
        [A, [B, C, D]],
        [B, [A, C, D]],
        [C, [A, B, D]],
      ]);
    });
  });
});

describe("resolveConsolidationProgress", () => {
  const groupLinks = both([A, B], [A, C], [B, C]);
  const addFourth = (nowMs = AT_ACTIVATION) =>
    plan({
      wallets: [A, B, C, D],
      existingMembers: [A, B, C],
      links: groupLinks,
      nowMs,
    });

  function progress(input: {
    plan: ReturnType<typeof plan>;
    links: readonly Link[];
    fresh?: readonly Link[];
    recorded?: readonly Link[];
    connectedAddress: string | undefined;
  }) {
    return resolveConsolidationProgress({
      plan: input.plan,
      isRegistered: lookup(input.links),
      isFresh: lookup(input.fresh ?? []),
      recordedLinkKeys: new Set(
        (input.recorded ?? []).map(([from, to]) => toDirectedLinkKey(from, to))
      ),
      connectedAddress: input.connectedAddress,
    });
  }

  it("lets only the first step's signer act and blocks later steps", () => {
    const steps = progress({
      plan: addFourth(),
      links: groupLinks,
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
    const wrongWallet = progress({
      plan: addFourth(),
      links: groupLinks,
      connectedAddress: D,
    });
    const disconnected = progress({
      plan: addFourth(),
      links: groupLinks,
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

  it("keeps step numbers and advances once links are registered and recorded", () => {
    const steps = progress({
      plan: addFourth(),
      links: [...groupLinks, [A, D]],
      fresh: [[A, D]],
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

  it("keeps asking for a registered link that is not fresh yet unless it was just confirmed", () => {
    const notRecorded = progress({
      plan: addFourth(),
      links: [...groupLinks, [A, D]],
      connectedAddress: A,
    });
    const recorded = progress({
      plan: addFourth(),
      links: [...groupLinks, [A, D]],
      recorded: [[A, D]],
      connectedAddress: A,
    });

    expect(notRecorded[0]).toMatchObject({
      status: "current",
      pendingTargets: [D],
      canSign: true,
    });
    expect(recorded[0]).toMatchObject({
      status: "recording",
      pendingTargets: [],
      canSign: false,
    });
    expect(recorded[1]).toMatchObject({
      status: "current",
      block: "wrong-wallet",
    });
  });

  it("sends a just-confirmed link again if it is no longer registered", () => {
    const steps = progress({
      plan: addFourth(),
      links: groupLinks,
      recorded: [[A, D]],
      connectedAddress: A,
    });

    expect(steps[0]).toMatchObject({ status: "current", pendingTargets: [D] });
  });

  it("holds every four-wallet step before activation, even for its signer", () => {
    const steps = progress({
      plan: addFourth(BEFORE_ACTIVATION),
      links: groupLinks,
      connectedAddress: A,
    });

    expect(steps.every((step) => step.waitsForFourthSlot)).toBe(true);
    expect(steps[0]).toMatchObject({
      status: "current",
      block: "fourth-slot",
      canSign: false,
    });
  });

  it("opens the final step after activation with every link to send", () => {
    const fresh: Link[] = [
      [A, D],
      [B, D],
      [C, D],
    ];
    const steps = progress({
      plan: addFourth(),
      links: [...groupLinks, ...fresh],
      fresh,
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

  it("sends only the directions still missing for smaller groups", () => {
    const fromScratch = plan({ wallets: [A, B, C] });
    const steps = progress({
      plan: fromScratch,
      links: [[A, C]],
      connectedAddress: A,
    });

    expect(steps[0]).toMatchObject({
      targets: [B, C],
      pendingTargets: [B],
      canSign: true,
    });
  });
});
