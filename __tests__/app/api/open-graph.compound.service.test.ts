import { createCompoundPlan } from "@/app/api/open-graph/compound/service";

describe("createCompoundPlan", () => {
  const txHash = `0x${"a".repeat(64)}`;

  it("creates a tx plan for the main Etherscan domain", () => {
    const plan = createCompoundPlan(new URL(`https://etherscan.io/tx/${txHash}`));

    expect(plan).not.toBeNull();
    expect(plan?.cacheKey).toBe(`compound:tx:${txHash}`);
  });

  it("creates a tx plan for Etherscan subdomains", () => {
    const plan = createCompoundPlan(new URL(`https://www.etherscan.io/tx/${txHash}`));

    expect(plan).not.toBeNull();
    expect(plan?.cacheKey).toBe(`compound:tx:${txHash}`);
  });

  it("returns null for hosts that only end with the Etherscan domain text", () => {
    const plan = createCompoundPlan(new URL(`https://maliciousetherscan.io/tx/${txHash}`));

    expect(plan).toBeNull();
  });

  it("creates a market plan for the Compound app domain", () => {
    const plan = createCompoundPlan(new URL("https://app.compound.finance/markets/usdc"));

    expect(plan).not.toBeNull();
    expect(plan?.cacheKey).toBe(
      "compound:market:v2:0x39aa39c021dfbae8fac545936693ac917d5e7563"
    );
  });

  it("returns null for hosts that only end with the Compound app domain text", () => {
    const plan = createCompoundPlan(
      new URL("https://maliciousapp.compound.finance/markets/usdc")
    );

    expect(plan).toBeNull();
  });
});
