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

type Request = readonly [method: string, path: string, body?: object];

const attempt =
  (...[method, path, body]: Request) =>
  () =>
    assertIdentityEditAllowed({
      method,
      url: `${API}/${path}`,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

const EDITS: ReadonlyArray<Request> = [
  ["POST", "profiles"],
  ["POST", "profiles/alice/pfp"],
  ["POST", "profiles/alice/cic/statements"],
  ["DELETE", "profiles/alice/cic/statements/42"],
  ["POST", "profiles/alice/rep/rating"],
  ["POST", "profiles/0xabc/cic/rating"],
  ["POST", "profiles/alice/wave"],
  ["DELETE", "profiles/alice/wave"],
  ["POST", "ratings"],
  ["POST", "bulk-rep"],
  ["POST", "proxies/p1/actions", { action_type: "ALLOCATE_REP", credit_amount: 5 }],
  ["POST", "proxies/p1/actions", { action_type: "ALLOCATE_CIC" }],
  ["post", "profiles/"],
];

const OTHER_WRITES: ReadonlyArray<Request> = [
  ["POST", "proxies", { target_id: "bob" }],
  ["POST", "proxies/p1/actions", { action_type: "CREATE_WAVE" }],
  ["POST", "proxies/p1/actions/a1/acceptance", { action: "REVOKE" }],
  ["PUT", "proxies/p1/actions/a1", { credit_amount: 1 }],
  ["POST", "identities/alice/subscriptions"],
  ["DELETE", "identities/alice/subscriptions"],
  ["POST", "waves/w1/rep/rating"],
  ["POST", "drops/d1/ratings"],
  ["PUT", "profile-preferences"],
  ["POST", "auth/login"],
  ["POST", "ratingsx"],
  ["POST", "ratings/extra"],
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
  it.each(EDITS)("refuses %s %s from the freeze", (...request) => {
    jest.setSystemTime(FREEZE);
    expect(attempt(...request)).toThrow(
      expect.objectContaining({
        name: "IdentityEditingPausedError",
        message: "Paused for the move to the 6529 Network.",
      })
    );
  });

  it.each(EDITS)("sends %s %s before the freeze", (...request) => {
    jest.setSystemTime(FREEZE - 1);
    expect(attempt(...request)).not.toThrow();
  });

  it.each(EDITS)("sends %s %s without a freeze", (...request) => {
    setIdentityFreezeAt(undefined);
    jest.setSystemTime(FREEZE + 1);
    expect(attempt(...request)).not.toThrow();
  });

  it.each(OTHER_WRITES)("sends %s %s while frozen", (...request) => {
    jest.setSystemTime(FREEZE + 1);
    expect(attempt(...request)).not.toThrow();
  });

  it.each(["GET", "HEAD", "OPTIONS"])("reads with %s while frozen", (method) => {
    jest.setSystemTime(FREEZE + 1);
    expect(attempt(method, "profiles/alice/rep/rating")).not.toThrow();
    expect(attempt(method, "profiles")).not.toThrow();
  });

  it("ignores the query string", () => {
    jest.setSystemTime(FREEZE + 1);
    expect(attempt("POST", "profiles?x=1")).toThrow();
  });

  it("sends a proxy action whose body it can't read", () => {
    jest.setSystemTime(FREEZE + 1);
    expect(() =>
      assertIdentityEditAllowed({
        method: "POST",
        url: `${API}/proxies/p1/actions`,
        body: "not json",
      })
    ).not.toThrow();
  });
});
