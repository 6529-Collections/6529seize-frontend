import { collectRuleErrorMessage } from "@/components/collect/collect-rules.helpers";
import { PersonalRecordsError } from "@/lib/personal-records/personal-records-errors";

const apiError = (status: number, body: unknown) => ({
  status,
  response: { status, headers: new Headers(), body },
});

describe("collectRuleErrorMessage", () => {
  it("shows a signed record's refusal as the person can act on it", () => {
    expect(
      collectRuleErrorMessage(
        new PersonalRecordsError("Settings are paused for a few minutes.", {
          reason: "paused",
        })
      )
    ).toBe("Settings are paused for a few minutes.");
  });

  it("shows a pending purchase to recover, with the nonce it names", () => {
    const message =
      "The rule's last purchase was sent at nonce 5 and isn't mined. Reconcile it; if it was dropped, send a replacement at nonce 5 from the funding wallet, then reconcile.";
    expect(
      collectRuleErrorMessage(
        apiError(409, { error: message, code: "RULE_PENDING" })
      )
    ).toBe(message);
    expect(
      collectRuleErrorMessage(
        apiError(409, JSON.stringify({ error: message, code: "RULE_PENDING" }))
      )
    ).toBe(message);
  });

  it("leaves anything else to the generic message", () => {
    expect(
      collectRuleErrorMessage(
        apiError(409, { error: "The rule changed.", code: "RULE_CHANGED" })
      )
    ).toBeNull();
    expect(collectRuleErrorMessage(new Error("network"))).toBeNull();
    expect(
      collectRuleErrorMessage(apiError(409, { code: "RULE_PENDING" }))
    ).toBeNull();
  });
});
