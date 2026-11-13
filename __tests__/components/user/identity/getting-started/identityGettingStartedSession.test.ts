import {
  clearIdentityGettingStartedSession,
  consumeIdentityGettingStartedArrival,
  hasIdentityGettingStartedSession,
  markIdentityGettingStartedSession,
  requestIdentityGettingStartedArrival,
} from "@/components/user/identity/getting-started/identityGettingStartedSession";

describe("identity getting-started session", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("normalizes handles and consumes each profile's arrival only once", () => {
    requestIdentityGettingStartedArrival(" ALICE ");
    requestIdentityGettingStartedArrival("bob");

    expect(consumeIdentityGettingStartedArrival("alice")).toBe(true);
    expect(consumeIdentityGettingStartedArrival(" ALICE ")).toBe(false);
    expect(consumeIdentityGettingStartedArrival("BOB")).toBe(true);
    expect(consumeIdentityGettingStartedArrival("bob")).toBe(false);
  });

  it("keeps welcome visibility independent from the arrival request", () => {
    markIdentityGettingStartedSession(" ALICE ");
    expect(hasIdentityGettingStartedSession("alice")).toBe(true);
    expect(consumeIdentityGettingStartedArrival("alice")).toBe(false);

    requestIdentityGettingStartedArrival("bob");
    expect(hasIdentityGettingStartedSession("bob")).toBe(false);
    expect(consumeIdentityGettingStartedArrival("bob")).toBe(true);
    expect(hasIdentityGettingStartedSession("alice")).toBe(true);
  });

  it("clears both markers for the normalized profile and preserves another profile", () => {
    for (const handle of ["alice", "bob"]) {
      markIdentityGettingStartedSession(handle);
      requestIdentityGettingStartedArrival(handle);
    }

    clearIdentityGettingStartedSession(" ALICE ");

    expect(hasIdentityGettingStartedSession("alice")).toBe(false);
    expect(consumeIdentityGettingStartedArrival("alice")).toBe(false);
    expect(hasIdentityGettingStartedSession("bob")).toBe(true);
    expect(consumeIdentityGettingStartedArrival("bob")).toBe(true);
  });

  it.each([null, undefined, "", "   "])(
    "ignores an empty handle %p without leaving session state",
    (handle) => {
      markIdentityGettingStartedSession(handle);
      requestIdentityGettingStartedArrival(handle);
      clearIdentityGettingStartedSession(handle);

      expect(hasIdentityGettingStartedSession(handle)).toBe(false);
      expect(consumeIdentityGettingStartedArrival(handle)).toBe(false);
      expect(sessionStorage.length).toBe(0);
    }
  );
});
