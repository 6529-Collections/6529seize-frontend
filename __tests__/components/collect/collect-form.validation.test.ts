import {
  isPositiveEthAmount,
  validateCollectGoal,
  validateCollectTrade,
} from "@/components/collect/collect-form.validation";
import type {
  CollectGoalDraft,
  CollectTradeDraft,
} from "@/components/collect/collect.types";

const recipient = "0x1111111111111111111111111111111111111111";
const trade: CollectTradeDraft = {
  quantity: "2",
  unitPriceEth: "0.0123",
  expiryHours: "168",
  recipient,
};
const goal: CollectGoalDraft = {
  intent: "season",
  definitionId: "season-1",
  targetCount: "2",
  budgetEth: "0.5",
  horizonDays: "30",
  includeCollaborations: false,
};

describe("Collect exact input validation", () => {
  it.each([
    "0",
    "0.0",
    "1e3",
    "0x1",
    "-1",
    "1,5",
    " 1",
    "01",
    "1.",
    ".1",
    "1.0000000000000000001",
    "Infinity",
    "1.2.3",
  ])("rejects ambiguous ETH amount %s", (amount) => {
    expect(isPositiveEthAmount(amount)).toBe(false);
  });

  it.each([
    "1",
    "0.000000000000000001",
    "123456789123456789.123456789123456789",
  ])(
    "accepts an exact decimal amount without float conversion: %s",
    (amount) => {
      expect(isPositiveEthAmount(amount)).toBe(true);
    }
  );

  it("permits a third-party receiver without binding it to the payer", () => {
    expect(validateCollectTrade(trade, "buy", "2")).toBeNull();
  });

  it.each(["", "punk6529.eth", "0x0000000000000000000000000000000000000000"])(
    "blocks unresolved or zero destination %s",
    (address) => {
      expect(
        validateCollectTrade({ ...trade, recipient: address }, "buy", "2")
      ).toBe("recipient");
    }
  );

  it("rejects excess quantity instead of silently buying all available editions", () => {
    expect(validateCollectTrade({ ...trade, quantity: "3" }, "buy", "2")).toBe(
      "quantity"
    );
    expect(
      validateCollectTrade({ ...trade, quantity: "2.1" }, "buy", "3")
    ).toBe("quantity");
  });

  it("compares large integer quantities exactly", () => {
    expect(
      validateCollectTrade(
        { ...trade, quantity: "9007199254740993" },
        "buy",
        "9007199254740992"
      )
    ).toBe("quantity");
  });

  it("requires explicit listing price and supported expiry", () => {
    expect(
      validateCollectTrade({ ...trade, unitPriceEth: "" }, "list", "3")
    ).toBe("price");
    expect(
      validateCollectTrade({ ...trade, expiryHours: "0" }, "offer", "3")
    ).toBe("expiry");
  });

  it("builds the second set from a versioned definition and exact budget", () => {
    expect(validateCollectGoal(goal)).toBeNull();
    expect(validateCollectGoal({ ...goal, definitionId: "" })).toBe(
      "definition"
    );
    expect(validateCollectGoal({ ...goal, targetCount: "1.5" })).toBe(
      "quantity"
    );
    expect(validateCollectGoal({ ...goal, budgetEth: "0" })).toBe("budget");
  });
});
