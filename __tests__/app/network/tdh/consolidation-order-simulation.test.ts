import {
  SIMULATED_SIGNERS,
  type SimulatedWallet,
  simulateAddingFourthWallet,
} from "@/app/network/tdh/consolidation/consolidation-order-simulation";

function permutations(
  wallets: readonly SimulatedWallet[]
): SimulatedWallet[][] {
  if (wallets.length <= 1) return [[...wallets]];
  return wallets.flatMap((wallet, index) =>
    permutations([...wallets.slice(0, index), ...wallets.slice(index + 1)]).map(
      (rest) => [wallet, ...rest]
    )
  );
}

const ALL_ORDERS = permutations(SIMULATED_SIGNERS);

describe("simulateAddingFourthWallet", () => {
  it("keeps A, B and C together at every step when D signs last", () => {
    const steps = simulateAddingFourthWallet(["B", "A", "C", "D"]);
    expect(steps.map((step) => step.existingMembersTogether)).toEqual([
      true,
      true,
      true,
      true,
    ]);
    expect(steps.at(-1)?.groups).toEqual([["A", "B", "C", "D"]]);
  });

  it("splits the group while D's links arrive when D signs first", () => {
    const steps = simulateAddingFourthWallet(["D", "A", "B", "C"]);
    expect(steps.map((step) => step.groups)).toEqual([
      [["A", "B", "C"], ["D"]],
      [
        ["A", "D"],
        ["B", "C"],
      ],
      [["A", "B", "D"], ["C"]],
      [["A", "B", "C", "D"]],
    ]);
    expect(steps.filter((step) => !step.existingMembersTogether)).toHaveLength(
      2
    );
  });

  it("is safe in exactly the six orders where D signs last", () => {
    const safe = ALL_ORDERS.filter((order) =>
      simulateAddingFourthWallet(order).every(
        (step) => step.existingMembersTogether
      )
    );
    expect(ALL_ORDERS).toHaveLength(24);
    expect(safe).toHaveLength(6);
    expect(safe.every((order) => order.at(-1) === "D")).toBe(true);
  });

  it("always ends with all four wallets in one group", () => {
    for (const order of ALL_ORDERS) {
      expect(simulateAddingFourthWallet(order).at(-1)?.groups).toEqual([
        ["A", "B", "C", "D"],
      ]);
    }
  });

  it("returns one step per signature so far", () => {
    expect(simulateAddingFourthWallet([])).toEqual([]);
    expect(simulateAddingFourthWallet(["A", "B"])).toHaveLength(2);
  });
});
