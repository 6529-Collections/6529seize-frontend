import { getE2eeEligibilityKey } from "@/components/e2ee/new/eligibilityCopy";
import { t } from "@/i18n/messages";

const copy = (...args: Parameters<typeof getE2eeEligibilityKey>) =>
  t("en-US", getE2eeEligibilityKey(...args));

describe("getE2eeEligibilityKey", () => {
  it("names the recipient's rule when the API reports it", () => {
    expect(copy("POLICY", "DM_RECIPIENT_GROUP_MEMBERS_ONLY")).toBe(
      "Only accepts messages from members of a group they chose"
    );
    expect(copy("POLICY", "DM_RECIPIENT_PEOPLE_I_FOLLOW_ONLY")).toBe(
      "Only accepts messages from people they follow"
    );
  });

  it("keeps a recipient's block indistinguishable from a closed inbox", () => {
    expect(copy("POLICY", "DM_RECIPIENT_NOT_ACCEPTING")).toBe(
      copy("POLICY", null)
    );
    expect(copy("POLICY", "DM_RECIPIENT_NOT_ACCEPTING")).toBe(
      "Doesn’t accept messages from you"
    );
  });

  it("describes BLOCKED as the viewer's own block", () => {
    expect(copy("BLOCKED", "DM_SENDER_BLOCKED_RECIPIENT")).toBe(
      "You blocked them. Unblock to message."
    );
  });

  it.each([
    ["OK", "Can receive encrypted messages"],
    ["NO_DEVICES", "Hasn’t turned on encrypted messages yet"],
    ["checking", "Checking…"],
  ] as const)("keeps the %s copy", (status, expected) => {
    expect(copy(status, null)).toBe(expected);
  });
});
