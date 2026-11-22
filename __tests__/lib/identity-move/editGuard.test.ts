import { assertIdentityEditAllowed } from "@/lib/identity-move/editGuard";
import { setIdentityFreezeAt } from "@/__tests__/helpers/identityFreeze";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        NEXT_PUBLIC_IDENTITY_FREEZE_AT: (
          globalThis as { __identityFreezeAt?: string }
        ).__identityFreezeAt,
      };
    },
  };
});

const API = "https://api.example.test/api";
const FREEZE = Date.UTC(2026, 10, 24, 0, 0, 0);

const attempt = (method: string, path: string) => () =>
  assertIdentityEditAllowed({ method, url: `${API}/${path}` });

const EDITS: ReadonlyArray<readonly [string, string]> = [
  ["POST", "profiles"],
  ["POST", "profiles/alice/pfp"],
  ["POST", "profiles/alice/cic/statements"],
  ["DELETE", "profiles/alice/cic/statements/42"],
  ["POST", "profiles/alice/rep/rating"],
  ["POST", "profiles/0xabc/cic/rating"],
  ["POST", "ratings"],
  ["POST", "bulk-rep"],
  ["POST", "proxies"],
  ["POST", "proxies/p1/actions"],
  ["POST", "proxies/p1/actions/a1/acceptance"],
  ["PUT", "proxies/p1/actions/a1"],
  ["post", "profiles/"],
];

const OTHER_WRITES: ReadonlyArray<readonly [string, string]> = [
  ["POST", "profiles/alice/wave"],
  ["POST", "identities/alice/subscriptions"],
  ["DELETE", "identities/alice/subscriptions"],
  ["POST", "waves/w1/rep/rating"],
  ["POST", "drops/d1/ratings"],
  ["PUT", "profile-preferences"],
  ["POST", "auth/login"],
  ["POST", "profiles/alice/cic/statements/42/extra"],
  ["POST", "profiles/alice/rep/categories"],
  ["POST", "ratingsx"],
];

beforeEach(() => {
  jest.useFakeTimers();
  setIdentityFreezeAt("2026-11-24T00:00:00Z");
});

afterEach(() => {
  jest.useRealTimers();
  setIdentityFreezeAt(undefined);
});

describe("identity edits during the move", () => {
  it.each(EDITS)("refuses %s %s from the freeze", (method, path) => {
    jest.setSystemTime(FREEZE);
    expect(attempt(method, path)).toThrow(
      expect.objectContaining({
        name: "IdentityEditingPausedError",
        message: "Paused for the move to the 6529 Network.",
      })
    );
  });

  it.each(EDITS)("sends %s %s before the freeze", (method, path) => {
    jest.setSystemTime(FREEZE - 1);
    expect(attempt(method, path)).not.toThrow();
  });

  it.each(EDITS)("sends %s %s without a freeze", (method, path) => {
    setIdentityFreezeAt(undefined);
    jest.setSystemTime(FREEZE + 1);
    expect(attempt(method, path)).not.toThrow();
  });

  it.each(OTHER_WRITES)("sends %s %s while frozen", (method, path) => {
    jest.setSystemTime(FREEZE + 1);
    expect(attempt(method, path)).not.toThrow();
  });

  it.each(["GET", "HEAD", "OPTIONS"])("reads with %s while frozen", (method) => {
    jest.setSystemTime(FREEZE + 1);
    expect(attempt(method, "profiles/alice/rep/rating")).not.toThrow();
    expect(attempt(method, "proxies")).not.toThrow();
  });

  it("ignores the query string", () => {
    jest.setSystemTime(FREEZE + 1);
    expect(attempt("POST", "profiles?x=1")).toThrow();
  });
});
