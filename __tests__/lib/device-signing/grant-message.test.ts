import {
  formatGrantExpiryDate,
  getDeviceKeyFingerprint,
  isAllowedGrantDomain,
  isExpectedDeviceGrantMessage,
  parseDeviceGrantMessage,
  renderDeviceGrantStatement,
  renderLegacyDeviceGrantStatement,
} from "@/lib/device-signing/grant-message";
import { buildVectorGrantMessage, VECTORS } from "./device-signing-test-utils";

let mockDevLike = true;
jest.mock("@/config/devAuth", () => ({
  isDevLikeEnv: () => mockDevLike,
}));

const SIGNER = "0x1111111111111111111111111111111111111111";
const SCOPES = ["post", "edit", "delete", "react"];
// One day before the vector grant expires.
const NOW_MS = (VECTORS.grantExpiresAtSeconds - 24 * 60 * 60) * 1000;
// The ERC-4361 statement charset (siwe-parser ABNF, RFC 3986 reserved and
// unreserved characters plus space): no newline, no non-ASCII.
const ERC_4361_STATEMENT = /^[a-zA-Z0-9 !#$&'()*+,./:;=?@[\]_~-]+$/;

const SHAPES = [
  ["current", VECTORS.grantStatement],
  ["legacy", VECTORS.legacyGrantStatement],
] as const;

const check = (
  message: string,
  overrides: Partial<Parameters<typeof isExpectedDeviceGrantMessage>[0]> = {}
) =>
  isExpectedDeviceGrantMessage({
    message,
    signerAddress: SIGNER,
    deviceKeyHex: VECTORS.deviceKey,
    scopes: SCOPES,
    nowMs: NOW_MS,
    ...overrides,
  });

const parseWith = (
  statement: string,
  resource: string = VECTORS.grantResource
) =>
  parseDeviceGrantMessage(
    buildVectorGrantMessage({ statement, resources: [resource] })
  );

const render = (
  scopes: string[],
  expiresAtSeconds: number = VECTORS.grantExpiresAtSeconds
) =>
  renderDeviceGrantStatement({
    deviceKeyHex: VECTORS.deviceKey,
    scopes,
    expiresAtSeconds,
  });

const utcSeconds = (...parts: [number, number, number, number, number]) =>
  Date.UTC(...parts) / 1000;

describe("device grant sign-in message check", () => {
  it.each(SHAPES)(
    "accepts the %s challenge that grants exactly this key to this wallet",
    (_name, statement) => {
      const message = buildVectorGrantMessage({ statement });
      expect(check(message)).toBe(true);
      expect(
        check(message, {
          signerAddress: SIGNER.toUpperCase().replace("0X", "0x"),
        })
      ).toBe(true);
    }
  );

  it.each(SHAPES)(
    "rejects a %s challenge for another key, wallet or scope set",
    (_name, statement) => {
      const message = buildVectorGrantMessage({ statement });
      expect(check(message, { deviceKeyHex: `0x${"ab".repeat(32)}` })).toBe(
        false
      );
      expect(
        check(message, {
          signerAddress: "0x2222222222222222222222222222222222222222",
        })
      ).toBe(false);
      expect(check(message, { scopes: ["post"] })).toBe(false);
    }
  );

  it("rejects an expired or implausibly long grant", () => {
    const message = buildVectorGrantMessage();
    expect(
      check(message, { nowMs: VECTORS.grantExpiresAtSeconds * 1000 })
    ).toBe(false);
    expect(
      check(message, {
        nowMs: VECTORS.grantExpiresAtSeconds * 1000 - 200 * 86_400_000,
      })
    ).toBe(false);
  });

  it.each(["https://ipfs.6529.io", "https://media.6529.io", "evil.example"])(
    "never signs a challenge for %s",
    (origin) => {
      const message = buildVectorGrantMessage().replace(
        "https://staging.6529.io wants you",
        `${origin} wants you`
      );
      expect(parseDeviceGrantMessage(message)).not.toBeNull();
      expect(check(message)).toBe(false);
    }
  );

  it("rejects ordinary challenges, extra resources and reordered scopes", () => {
    expect(check(buildVectorGrantMessage({ resources: [] }))).toBe(false);
    expect(
      check(
        buildVectorGrantMessage({
          resources: [VECTORS.grantResource, "https://example.com"],
        })
      )
    ).toBe(false);
    expect(
      parseWith(
        VECTORS.grantStatement,
        VECTORS.grantResource.replace("post.edit", "edit.post")
      )
    ).toBeNull();
  });
});

describe("device grant domains", () => {
  afterEach(() => {
    mockDevLike = true;
  });

  it.each(["6529.io", "staging.6529.io", "STAGING.6529.io"])(
    "accepts the app host %s in every build",
    (domain) => {
      mockDevLike = false;
      expect(isAllowedGrantDomain(domain)).toBe(true);
    }
  );

  it.each([
    "ipfs.6529.io",
    "media.6529.io",
    "www.6529.io",
    "x.staging.6529.io",
    "6529.io:8443",
    "evil.example",
    "evil.example/6529.io",
    "user@6529.io",
    "6529.io.",
  ])("rejects %s", (domain) => {
    expect(isAllowedGrantDomain(domain)).toBe(false);
  });

  it.each(["localhost", "localhost:3001", "127.0.0.1:3000", "[::1]:3001", "dev.localhost"])(
    "accepts the local host %s only outside production builds",
    (domain) => {
      expect(isAllowedGrantDomain(domain)).toBe(true);
      mockDevLike = false;
      expect(isAllowedGrantDomain(domain)).toBe(false);
    }
  );

  it("rejects look-alike local hosts", () => {
    expect(isAllowedGrantDomain("localhost.evil.example")).toBe(false);
    expect(isAllowedGrantDomain("evillocalhost")).toBe(false);
  });
});

describe("device grant statement tampering", () => {
  it.each([
    ["scopes", "posts, edits, deletes and", "posts, edits and"],
    ["key", "d75a9801...f707511a", "d75a9801...f707511b"],
    ["expiry date", "16 Apr 2027", "17 Apr 2027"],
    ["expiry date padding", "16 Apr 2027", "16 Apr 2027 12:00 UTC"],
    ["capabilities", "It can't move funds", "It can move funds"],
    ["trailing text", "f707511a)", "f707511a). Also vote."],
    ["trailing period", "f707511a)", "f707511a)."],
    ["leading text", "Sign in to 6529", "Hi. Sign in to 6529"],
    ["trailing space", "f707511a)", "f707511a) "],
    ["curly apostrophe", "can't", "can\u2019t"],
    ["Unicode ellipsis", "d75a9801...f707511a", "d75a9801\u2026f707511a"],
    ["lowercase key label", "(Device key", "(device key"],
    [
      "legacy minute format",
      "until 16 Apr 2027.",
      "until 2027-04-16 12:00 UTC.",
    ],
  ])("rejects the current statement with edited %s", (_name, from, to) => {
    const statement = VECTORS.grantStatement.replace(from, to);
    expect(statement).not.toBe(VECTORS.grantStatement);
    expect(parseWith(statement)).toBeNull();
  });

  it.each([
    ["scopes", "post, edit, delete and", "post, edit and"],
    ["key", "d75a9801...f707511a", "d75a9801...f707511b"],
    ["expiry minute", "12:00 UTC", "12:01 UTC"],
    ["trailing text", "approve tokens.", "approve tokens. Also vote."],
    ["new date format", "2027-04-16 12:00 UTC", "16 Apr 2027"],
  ])("rejects the legacy statement with edited %s", (_name, from, to) => {
    const statement = VECTORS.legacyGrantStatement.replace(from, to);
    expect(statement).not.toBe(VECTORS.legacyGrantStatement);
    expect(parseWith(statement)).toBeNull();
  });

  it.each(SHAPES)(
    "rejects a %s statement whose resource grants other terms",
    (_name, statement) => {
      const resource = VECTORS.grantResource;
      for (const tampered of [
        resource.replace("post.edit.delete.react", "post.edit.delete"),
        resource.replace(
          "post.edit.delete.react",
          "post.edit.delete.react.vote"
        ),
        resource.replace("d75a9801", "d75a9802"),
        resource.replace("f707511a:", "f707511b:"),
        resource.replace(
          ":1807876800",
          `:${VECTORS.grantExpiresAtSeconds + 86_400}`
        ),
      ]) {
        expect(tampered).not.toBe(resource);
        expect(parseWith(statement, tampered)).toBeNull();
      }
    }
  );

  it("binds the expiry minute in the resource; only the legacy statement repeats it", () => {
    const sameDay = VECTORS.grantResource.replace(
      ":1807876800",
      `:${VECTORS.grantExpiresAtSeconds + 60}`
    );
    expect(parseWith(VECTORS.grantStatement, sameDay)?.expiresAtSeconds).toBe(
      VECTORS.grantExpiresAtSeconds + 60
    );
    expect(parseWith(VECTORS.legacyGrantStatement, sameDay)).toBeNull();
  });
});

describe("device grant statement wording", () => {
  it("renders the approved statement for the default scopes", () => {
    expect(
      render(
        ["post", "edit", "delete", "react"],
        utcSeconds(2027, 3, 29, 0, 30)
      )
    ).toBe(
      "Sign in to 6529 and turn on signed messages on this device until 29 Apr 2027. This device will sign your posts, edits, deletes and reactions so anyone can verify they came from your wallet. It can't move funds, change your handle, add devices or act as an admin. No transaction, no gas, no token approvals. (Device key d75a9801...f707511a)"
    );
  });

  it.each([
    [["post"], "This device will sign your posts so anyone"],
    [["post", "edit"], "This device will sign your posts and edits so anyone"],
    [
      ["post", "react"],
      "This device will sign your posts and reactions so anyone",
    ],
    [
      ["post", "edit", "delete", "react", "vote"],
      "This device will sign your posts, edits, deletes, reactions and votes so anyone",
    ],
  ])("names what the device signs for %j", (scopes, expected) => {
    expect(render(scopes)).toContain(expected);
  });

  it("keeps every statement to one ERC-4361 line", () => {
    for (const scopes of [
      ["post"],
      ["post", "edit", "delete", "react"],
      ["post", "edit", "delete", "react", "vote"],
    ]) {
      expect(render(scopes)).toMatch(ERC_4361_STATEMENT);
      expect(
        renderLegacyDeviceGrantStatement({
          deviceKeyHex: VECTORS.deviceKey,
          scopes,
          expiresAtSeconds: VECTORS.grantExpiresAtSeconds,
        })
      ).toMatch(ERC_4361_STATEMENT);
    }
  });

  it("keeps the legacy wording byte for byte", () => {
    const renderLegacy = (scopes: string[]) =>
      renderLegacyDeviceGrantStatement({
        deviceKeyHex: VECTORS.deviceKey,
        scopes,
        expiresAtSeconds: VECTORS.grantExpiresAtSeconds,
      });
    expect(renderLegacy(SCOPES)).toBe(VECTORS.legacyGrantStatement);
    expect(renderLegacy(["post"])).toContain("It may post. ");
    expect(renderLegacy(["post", "edit"])).toContain("It may post and edit. ");
    expect(renderLegacy(["post", "edit", "delete", "react", "vote"])).toContain(
      "It may post, edit, delete, react and vote. "
    );
  });

  it("fingerprints the key with the first and last eight hex characters", () => {
    expect(getDeviceKeyFingerprint(VECTORS.deviceKey)).toBe(
      "d75a9801...f707511a"
    );
  });
});

describe("device grant expiry date", () => {
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  it.each([
    [utcSeconds(2026, 10, 5, 9, 0), "5 Nov 2026"],
    [utcSeconds(2027, 3, 29, 0, 30), "29 Apr 2027"],
    [utcSeconds(2027, 0, 1, 0, 0), "1 Jan 2027"],
    [utcSeconds(2026, 11, 31, 23, 59), "31 Dec 2026"],
    [utcSeconds(2028, 1, 29, 12, 0), "29 Feb 2028"],
  ])("formats %d as %s", (expiresAtSeconds, expected) => {
    expect(formatGrantExpiryDate(expiresAtSeconds)).toBe(expected);
  });

  it("names every month with its English abbreviation", () => {
    MONTHS.forEach((month, index) => {
      expect(formatGrantExpiryDate(utcSeconds(2027, index, 10, 12, 0))).toBe(
        `10 ${month} 2027`
      );
    });
  });

  it("names the UTC date whatever the viewer's time zone", () => {
    // Jest runs in UTC, so answer the local getters as a viewer elsewhere
    // would; code that read local getters would name the wrong day.
    const asViewer = (offsetHours: number) => {
      const shift = (date: Date) =>
        new Date(date.getTime() + offsetHours * 60 * 60 * 1000);
      return [
        jest.spyOn(Date.prototype, "getFullYear").mockImplementation(function (
          this: Date
        ) {
          return shift(this).getUTCFullYear();
        }),
        jest.spyOn(Date.prototype, "getMonth").mockImplementation(function (
          this: Date
        ) {
          return shift(this).getUTCMonth();
        }),
        jest.spyOn(Date.prototype, "getDate").mockImplementation(function (
          this: Date
        ) {
          return shift(this).getUTCDate();
        }),
      ];
    };
    const westSpies = asViewer(-7);
    try {
      expect(formatGrantExpiryDate(utcSeconds(2027, 3, 29, 0, 30))).toBe(
        "29 Apr 2027"
      );
    } finally {
      westSpies.forEach((spy) => spy.mockRestore());
    }
    const eastSpies = asViewer(14);
    try {
      expect(formatGrantExpiryDate(utcSeconds(2026, 11, 31, 23, 59))).toBe(
        "31 Dec 2026"
      );
    } finally {
      eastSpies.forEach((spy) => spy.mockRestore());
    }
  });
});
