import { chainTdhDayText } from "@/lib/tdh-chain/tdhDay";

describe("chainTdhDayText", () => {
  it("says nothing for a day 6529.io computed", () => {
    expect(
      chainTdhDayText("en-US", { block_number: 1, source: "SITE" })
    ).toBeNull();
    expect(
      chainTdhDayText("en-US", { block_number: 1, source: "CHAIN" })
    ).toBeNull();
  });

  it("names the day and the network for a day from the 6529 Network", () => {
    expect(
      chainTdhDayText("en-US", {
        block_number: 24012345,
        source: "CHAIN",
        cycle_day: 20782,
      })
    ).toEqual({
      label: "TDH day",
      value: "25 Nov 2026, from the 6529 Network",
      detail:
        "Holdings at Ethereum block 24012345, the last block before 25 Nov 2026 00:00 UTC. Validators agreed on this day's TDH on the 6529 Network.",
    });
  });
});
