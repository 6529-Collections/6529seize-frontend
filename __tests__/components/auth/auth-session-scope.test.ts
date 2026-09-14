import {
  getAuthSessionRole,
  isDirectProfileAuthSession,
  resolveActiveProfileProxy,
} from "@/components/auth/auth-session-scope";
import { getAuthJwt } from "@/services/auth/auth.utils";
import { getRole } from "@/services/auth/jwt-validation.utils";

jest.mock("@/services/auth/auth.utils", () => ({ getAuthJwt: jest.fn() }));
jest.mock("@/services/auth/jwt-validation.utils", () => ({
  getRole: jest.fn(),
}));
jest.mock("@/utils/error-sanitizer", () => ({ logErrorSecurely: jest.fn() }));

beforeEach(() => {
  jest.resetAllMocks();
});

it("keeps an unavailable or unreadable token distinct from a direct session", () => {
  jest.mocked(getAuthJwt).mockReturnValue(null);
  expect(getAuthSessionRole()).toBeUndefined();
  expect(getRole).not.toHaveBeenCalled();
  jest.mocked(getAuthJwt).mockReturnValue("unreadable");
  jest.mocked(getRole).mockImplementation(() => {
    throw new Error("Malformed token");
  });
  expect(getAuthSessionRole()).toBeUndefined();
});

it.each([null, "delegating-profile"])(
  "returns the current explicit role %s before the proxy lookup",
  (role) => {
    jest.mocked(getAuthJwt).mockReturnValue("session");
    jest.mocked(getRole).mockReturnValue(role);
    expect(getAuthSessionRole()).toBe(role);
  }
);

it("recognizes an omitted legacy role only after decoding a present token", () => {
  const actualGetRole = jest.requireActual<
    typeof import("@/services/auth/jwt-validation.utils")
  >("@/services/auth/jwt-validation.utils").getRole;
  jest.mocked(getRole).mockImplementation(actualGetRole);
  const payload = btoa(JSON.stringify({ sub: "0x1", exp: 2_000_000_000 }));
  jest.mocked(getAuthJwt).mockReturnValue(`e30.${payload}.signature`);
  expect(getAuthSessionRole()).toBeNull();

  jest.mocked(getAuthJwt).mockReturnValue("not-a-token");
  expect(getAuthSessionRole()).toBeUndefined();
});

describe("direct profile session scope", () => {
  it.each([
    ["own profile role", "profile-1", "profile-1", false, true],
    ["legacy null role", null, "profile-1", false, true],
    [
      "foreign role before proxy lookup",
      "profile-2",
      "profile-1",
      false,
      false,
    ],
    ["unavailable token", undefined, "profile-1", false, false],
    ["unresolved profile", "profile-1", undefined, false, false],
    ["unresolved token and profile", undefined, undefined, false, false],
    ["legacy token without profile", null, null, false, false],
    ["empty profile", null, "", false, false],
    ["active proxy with own role", "profile-1", "profile-1", true, false],
    ["active proxy with legacy role", null, "profile-1", true, false],
  ] as const)(
    "handles %s",
    (_case, authRole, profileId, hasActiveProxy, expected) => {
      expect(
        isDirectProfileAuthSession({ authRole, profileId, hasActiveProxy })
      ).toBe(expected);
    }
  );
});

describe("active proxy resolution", () => {
  const proxy = { id: "proxy-2", created_by: { id: "profile-2" } };
  const receivedProfileProxies = [
    { id: "proxy-3", created_by: { id: "profile-3" } },
    proxy,
  ];

  it("preserves the matching received proxy and its identity", () => {
    expect(
      resolveActiveProfileProxy({
        address: "0x1",
        authRole: "profile-2",
        receivedProfileProxies,
      })
    ).toBe(proxy);
  });

  it.each([
    [null, "profile-2"],
    [undefined, "profile-2"],
    ["0x1", null],
    ["0x1", undefined],
    ["0x1", "own-profile"],
  ] as const)(
    "clears the proxy for address %s and role %s",
    (address, authRole) => {
      expect(
        resolveActiveProfileProxy({ address, authRole, receivedProfileProxies })
      ).toBeUndefined();
    }
  );

  it("keeps a foreign-role session without loaded proxies unresolved", () => {
    expect(
      resolveActiveProfileProxy({
        address: "0x1",
        authRole: "profile-2",
        receivedProfileProxies: undefined,
      })
    ).toBeUndefined();
  });
});
