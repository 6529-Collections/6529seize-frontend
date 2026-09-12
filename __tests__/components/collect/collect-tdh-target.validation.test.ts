import {
  parseCollectTdhTarget,
  parseCollectTdhTargetBudget,
} from "@/components/collect/collect-tdh-target.validation";

it("preserves exact integer targets including zero and the projector's safe integer boundary", () => {
  expect(parseCollectTdhTarget("0")).toBe("0");
  expect(parseCollectTdhTarget(" 001000 ")).toBe("1000");
  expect(parseCollectTdhTarget(String(Number.MAX_SAFE_INTEGER))).toBe(
    String(Number.MAX_SAFE_INTEGER)
  );
});
it.each(["", "-1", "1.5", "1e6", "1,000", "Infinity", "9007199254740992"])(
  "rejects ambiguous or unrepresentable target %s",
  (value) => expect(parseCollectTdhTarget(value)).toBeNull()
);
it("treats a blank budget as unbounded and preserves exact wei precision", () => {
  expect(parseCollectTdhTargetBudget(" ")).toBeUndefined();
  expect(parseCollectTdhTargetBudget("0")).toBe("0");
  expect(parseCollectTdhTargetBudget("0.000000000000000001")).toBe("1");
  expect(parseCollectTdhTargetBudget("1.000000000000000001")).toBe(
    "1000000000000000001"
  );
});
it.each([
  "-1",
  "1e3",
  "0.0000000000000000001",
  "01",
  "999999999999999999999999999999999999999999999999999999999999999999999999999999",
])("rejects invalid or overflowing budget %s", (value) =>
  expect(parseCollectTdhTargetBudget(value)).toBeNull()
);
