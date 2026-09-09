import {
  calculateTdhExample,
  TDH_EXAMPLE_CARDS,
} from "@/app/network/tdh/tdh-example.helpers";

describe("TDH example calculation", () => {
  it("uses the fixed sample cards and intact collection boost", () => {
    expect(TDH_EXAMPLE_CARDS).toHaveLength(3);
    expect(calculateTdhExample(0, false)).toMatchObject({
      boost: 1.03,
      baseTotal: 2159,
      rows: [{ base: 200 }, { base: 788 }, { base: 1171 }],
      total: 2224,
    });
    expect(calculateTdhExample(30, false)).toMatchObject({
      boost: 1.03,
      baseTotal: 3784,
      total: 3897,
    });
  });

  it("removes Nakamoto and its boost when sold before the snapshot", () => {
    const today = calculateTdhExample(0, true);
    const future = calculateTdhExample(30, true);

    expect(today).toMatchObject({ boost: 1.02, total: 1398 });
    expect(future).toMatchObject({ boost: 1.02, total: 2653 });
    expect(today.rows.map(({ id }) => id)).toEqual(["firstGm", "gradient"]);
    expect(future.rows.map(({ id }) => id)).toEqual(["firstGm", "gradient"]);
  });
});
