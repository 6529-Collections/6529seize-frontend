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

interface Request {
  readonly method: string;
  readonly path: string;
  readonly body?: object | undefined;
}

const req = (method: string, path: string, body?: object): Request => ({
  method,
  path,
  body,
});

const attempt = (method: string, path: string, body?: object) => () =>
  assertIdentityEditAllowed({
    method,
    url: `${API}/${path}`,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const EDITS: readonly Request[] = [
  req("POST", "profiles"),
  req("POST", "profiles/alice/pfp"),
  req("POST", "profiles/alice/cic/statements"),
  req("DELETE", "profiles/alice/cic/statements/42"),
  req("POST", "profiles/alice/rep/rating"),
  req("POST", "profiles/0xabc/cic/rating"),
  req("POST", "profiles/alice/wave"),
  req("DELETE", "profiles/alice/wave"),
  req("POST", "ratings"),
  req("POST", "bulk-rep"),
  req("POST", "proxies/p1/actions", { action_type: "ALLOCATE_REP", credit_amount: 5 }),
  req("POST", "proxies/p1/actions", { action_type: "ALLOCATE_CIC" }),
  req("post", "profiles/"),
];

const OTHER_WRITES: readonly Request[] = [
  req("POST", "proxies", { target_id: "bob" }),
  req("POST", "proxies/p1/actions", { action_type: "CREATE_WAVE" }),
  req("POST", "proxies/p1/actions/a1/acceptance", { action: "REVOKE" }),
  req("PUT", "proxies/p1/actions/a1", { credit_amount: 1 }),
  req("POST", "identities/alice/subscriptions"),
  req("DELETE", "identities/alice/subscriptions"),
  req("POST", "waves/w1/rep/rating"),
  req("POST", "drops/d1/ratings"),
  req("PUT", "profile-preferences"),
  req("POST", "auth/login"),
  req("POST", "ratingsx"),
  req("POST", "ratings/extra"),
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
  it.each(EDITS)("refuses $method $path from the freeze", ({ method, path, body }) => {
    jest.setSystemTime(FREEZE);
    expect(attempt(method, path, body)).toThrow(
      expect.objectContaining({
        name: "IdentityEditingPausedError",
        message: "Paused for the move to the 6529 Network.",
      })
    );
  });

  it.each(EDITS)("sends $method $path before the freeze", ({ method, path, body }) => {
    jest.setSystemTime(FREEZE - 1);
    expect(attempt(method, path, body)).not.toThrow();
  });

  it.each(EDITS)("sends $method $path without a freeze", ({ method, path, body }) => {
    setIdentityFreezeAt(undefined);
    jest.setSystemTime(FREEZE + 1);
    expect(attempt(method, path, body)).not.toThrow();
  });

  it.each(OTHER_WRITES)("sends $method $path while frozen", ({ method, path, body }) => {
    jest.setSystemTime(FREEZE + 1);
    expect(attempt(method, path, body)).not.toThrow();
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
