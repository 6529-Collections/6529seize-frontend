import { xtdhRetirementOf } from "@/lib/xtdh/retirement";

describe("xtdhRetirementOf", () => {
  it("keeps xTDH live until the freeze", () => {
    expect(xtdhRetirementOf("none")).toBe("live");
    expect(xtdhRetirementOf("notice")).toBe("live");
  });

  it("closes grants on the freeze day", () => {
    expect(xtdhRetirementOf("frozen")).toBe("closing");
  });

  it("retires xTDH from the switch-on", () => {
    expect(xtdhRetirementOf("moved")).toBe("retired");
  });
});
