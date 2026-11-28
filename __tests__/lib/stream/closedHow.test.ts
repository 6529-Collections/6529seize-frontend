import { closedHow } from "@/lib/stream/reads";

describe("closedHow", () => {
  it("is null without events since the latest start", () => {
    expect(closedHow([], [], 100n)).toBeNull();
    expect(closedHow([{ blockNumber: 90n }], [{ blockNumber: 95n }], 100n)).toBeNull();
  });
  it("names a refusal or a rescue after the latest start, rescue first", () => {
    expect(closedHow([{ blockNumber: 110n }], [], 100n)).toBe("refused");
    expect(closedHow([], [{ blockNumber: 100n }], 100n)).toBe("rescued");
    expect(closedHow([{ blockNumber: 110n }], [{ blockNumber: 120n }], 100n)).toBe("rescued");
  });
});
