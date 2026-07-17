import { getAwsRumPageId } from "@/utils/monitoring/mobileLaunchTimingSanitizers";

const WAVE_ID = `${"a".repeat(8)}-${"b".repeat(4)}-4${"c".repeat(3)}-a${"d".repeat(3)}-${"e".repeat(12)}`;
const OTHER_WAVE_ID = `${"f".repeat(8)}-${"1".repeat(4)}-4${"2".repeat(3)}-a${"3".repeat(3)}-${"4".repeat(12)}`;
const WALLET = `0x${"1".repeat(40)}`;

describe("getAwsRumPageId", () => {
  it.each([
    ["/", "/"],
    ["/notifications", "/notifications"],
    ["/waves", "/waves"],
    [`/waves/${WAVE_ID}`, "/waves/[wave]"],
    [`/messages/${WAVE_ID}`, "/messages/[wave]"],
    [`/tools/app-wallets/${WALLET}`, "/tools/app-wallets/[app-wallet-address]"],
    ["/alice", "/[user]"],
    ["/alice/rep", "/[user]/[...cmsPath]"],
    [`/${WALLET}`, "/[user]"],
    [`/${WALLET}/collected`, "/[user]/collected"],
    [`/${WALLET}/private-cms-page`, "/[user]/[...cmsPath]"],
  ])("normalizes %s to the stable page ID %s", (route, expectedPageId) => {
    expect(getAwsRumPageId(route)).toBe(expectedPageId);
  });

  it.each(["/author", "/notifications", "/rep", "/waves"])(
    "keeps the known static root %s literal",
    (route) => {
      expect(getAwsRumPageId(route)).toBe(route);
    }
  );

  it("strips query strings and hashes before creating the page ID", () => {
    expect(
      getAwsRumPageId(
        `https://6529.io/waves/${WAVE_ID}?drop=${OTHER_WAVE_ID}&wallet=${WALLET}#${OTHER_WAVE_ID}`
      )
    ).toBe("/waves/[wave]");
  });

  it("uses bounded fallbacks for unknown routes", () => {
    expect(getAwsRumPageId(`/waves/${WAVE_ID}/unexpected/${WALLET}`)).toBe(
      "/waves"
    );
    expect(getAwsRumPageId(`/api/private/${WALLET}`)).toBe("/unknown");
    expect(getAwsRumPageId("/unknown-profile/private-cms-page")).toBe(
      "/[user]/[...cmsPath]"
    );
  });

  it("never includes raw identifiers in the page ID payload", () => {
    const pageIds = [
      getAwsRumPageId(`/waves/${WAVE_ID}?drop=${OTHER_WAVE_ID}`),
      getAwsRumPageId(`/${WALLET}/collected#${WAVE_ID}`),
      getAwsRumPageId(`/tools/app-wallets/${WALLET}`),
      getAwsRumPageId("/alice"),
    ];
    const payload = JSON.stringify(pageIds);

    expect(payload).not.toContain(WAVE_ID);
    expect(payload).not.toContain(OTHER_WAVE_ID);
    expect(payload).not.toContain(WALLET);
    expect(payload).not.toContain("alice");
    expect(payload).not.toContain("?");
    expect(payload).not.toContain("#");
  });
});
