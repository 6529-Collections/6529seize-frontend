import type { ConsolidationLimits } from "@/helpers/consolidationPolicy";

export type SimulatedWallet = "A" | "B" | "C" | "D";

export const SIMULATED_SIGNERS: readonly SimulatedWallet[] = [
  "A",
  "B",
  "C",
  "D",
];

const EXISTING_MEMBERS: readonly SimulatedWallet[] = ["A", "B", "C"];
const JOINING_WALLET: SimulatedWallet = "D";

/**
 * Whether the limits are the ones this fixed scenario models: three members
 * that count without the fresh-link gate, and a fourth wallet joining them.
 * Other limits would make the A, B, C and D walkthrough misleading.
 */
export function matchesSimulatedScenario(limits: ConsolidationLimits): boolean {
  return (
    limits.ungatedMaxWallets === EXISTING_MEMBERS.length &&
    limits.maxWallets === SIMULATED_SIGNERS.length
  );
}

interface Registration {
  readonly block: number;
  readonly afterStart: boolean;
}

interface ConfirmedLink {
  readonly key: string;
  readonly wallets: readonly [SimulatedWallet, SimulatedWallet];
  readonly block: number;
  readonly afterStart: boolean;
}

interface SimulatedStep {
  readonly signer: SimulatedWallet;
  readonly groups: readonly (readonly SimulatedWallet[])[];
  readonly existingMembersTogether: boolean;
}

// Wallet labels and pair keys are fixed ASCII, so plain code-unit order is
// both deterministic and what the backend's ordering amounts to here.
const compareCodeUnits = (a: string, b: string) => {
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

const pairKey = (a: SimulatedWallet, b: SimulatedWallet) =>
  [a, b].sort(compareCodeUnits).join("-");

function confirmedLinks(
  registrations: ReadonlyMap<string, Registration>
): ConfirmedLink[] {
  const links: ConfirmedLink[] = [];
  for (const from of SIMULATED_SIGNERS) {
    for (const to of SIMULATED_SIGNERS) {
      if (from >= to) continue;
      const forward = registrations.get(`${from}>${to}`);
      const backward = registrations.get(`${to}>${from}`);
      if (!forward || !backward) continue;
      links.push({
        key: pairKey(from, to),
        wallets: [from, to],
        block: Math.max(forward.block, backward.block),
        afterStart: forward.afterStart && backward.afterStart,
      });
    }
  }
  return links;
}

/**
 * Groups wallets the way the backend does (src/consolidation-tools.ts):
 * newest confirmed link first, a wallet joins only when it is linked with
 * every member, and a group grows past `limits.ungatedMaxWallets` (three
 * today) only when one member's links to all the others were registered
 * after the start date.
 */
function groupSimulatedWallets(
  links: readonly ConfirmedLink[],
  limits: ConsolidationLimits
): SimulatedWallet[][] {
  const ordered = [...links].sort(
    (a, b) => b.block - a.block || compareCodeUnits(a.key, b.key)
  );
  const byKey = new Map(ordered.map((link) => [link.key, link]));
  const isAfterStart = (a: SimulatedWallet, b: SimulatedWallet) =>
    byKey.get(pairKey(a, b))?.afterStart ?? false;
  const hasAfterStartMember = (wallets: readonly SimulatedWallet[]) =>
    wallets.some((candidate) =>
      wallets.every(
        (other) => other === candidate || isAfterStart(candidate, other)
      )
    );
  const canJoin = (group: SimulatedWallet[], wallet: SimulatedWallet) =>
    group.every((member) => byKey.has(pairKey(member, wallet))) &&
    (group.length < limits.ungatedMaxWallets ||
      hasAfterStartMember([...group, wallet]));

  const used = new Set<SimulatedWallet>();
  const groups: SimulatedWallet[][] = [];
  const queue = [...ordered];
  // The newest unused link starts a group; the first queued link that adds a
  // wallet linked with every member grows it, until the limit.
  const nextJoin = (group: SimulatedWallet[]) => {
    for (const [index, link] of queue.entries()) {
      const next = joiningWallet(group, used, ...link.wallets);
      if (next && canJoin(group, next)) return { index, next };
    }
    return null;
  };
  for (let link = queue.shift(); link; link = queue.shift()) {
    const [first, second] = link.wallets;
    if (used.has(first) || used.has(second)) continue;
    const group: SimulatedWallet[] = [first, second];
    for (
      let join = nextJoin(group);
      join && group.length < limits.maxWallets;
      join = nextJoin(group)
    ) {
      group.push(join.next);
      queue.splice(join.index, 1);
    }
    group.forEach((wallet) => used.add(wallet));
    groups.push(group);
  }
  for (const wallet of SIMULATED_SIGNERS) {
    if (!used.has(wallet)) groups.push([wallet]);
  }
  return groups.map((group) => [...group].sort(compareCodeUnits));
}

function joiningWallet(
  group: readonly SimulatedWallet[],
  used: ReadonlySet<SimulatedWallet>,
  a: SimulatedWallet,
  b: SimulatedWallet
): SimulatedWallet | null {
  if (group.includes(a) && !group.includes(b) && !used.has(b)) return b;
  if (group.includes(b) && !group.includes(a) && !used.has(a)) return a;
  return null;
}

/**
 * A, B and C are consolidated with links registered before the start date.
 * A, B and C each register one link to D, and D sends one batch to A, B and
 * C. Returns the groups after each transaction, in the given signing order.
 *
 * The scenario is fixed: three members and one joining wallet. It models the
 * current policy (`ungatedMaxWallets` 3, `maxWallets` 4); the limits only
 * decide which of these groups the backend would count. A different maximum
 * needs a new scenario, not just new limits, so the simulator is not shown
 * unless matchesSimulatedScenario holds.
 */
export function simulateAddingFourthWallet(
  order: readonly SimulatedWallet[],
  limits: ConsolidationLimits
): SimulatedStep[] {
  const registrations = new Map<string, Registration>();
  EXISTING_MEMBERS.forEach((from, i) =>
    EXISTING_MEMBERS.forEach((to) => {
      if (from !== to) {
        registrations.set(`${from}>${to}`, { block: i + 1, afterStart: false });
      }
    })
  );

  return order.map((signer, index) => {
    const registration = { block: 100 + index, afterStart: true };
    const targets =
      signer === JOINING_WALLET ? EXISTING_MEMBERS : [JOINING_WALLET];
    targets.forEach((target) =>
      registrations.set(`${signer}>${target}`, registration)
    );
    const groups = groupSimulatedWallets(confirmedLinks(registrations), limits);
    return {
      signer,
      groups,
      existingMembersTogether: groups.some((group) =>
        EXISTING_MEMBERS.every((member) => group.includes(member))
      ),
    };
  });
}
