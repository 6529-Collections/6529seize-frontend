import { getSocketIdentityKey } from "@/services/websocket/socketIdentity";
import { fakeJwt } from "../../helpers/fakeJwt";

describe("getSocketIdentityKey", () => {
  it("keeps the key across a rotated token for the same wallet and role", () => {
    const first = fakeJwt({ id: "a", sub: "0xAbC", role: "p1", exp: 1 });
    const rotated = fakeJwt({ id: "b", sub: "0xabc", role: "p1", exp: 2 });

    expect(getSocketIdentityKey(rotated)).toBe(getSocketIdentityKey(first));
  });

  it("changes the key for another wallet or another role", () => {
    const wallet = getSocketIdentityKey(fakeJwt({ sub: "0xabc" }));

    expect(getSocketIdentityKey(fakeJwt({ sub: "0xdef" }))).not.toBe(wallet);
    expect(
      getSocketIdentityKey(fakeJwt({ sub: "0xabc", role: "p2" }))
    ).not.toBe(wallet);
  });

  it("gives anonymous sockets one key and unreadable tokens their own", () => {
    expect(getSocketIdentityKey(null)).toBe(getSocketIdentityKey(undefined));
    expect(getSocketIdentityKey("opaque-a")).not.toBe(
      getSocketIdentityKey("opaque-b")
    );
    expect(getSocketIdentityKey("opaque-a")).not.toContain("opaque-a");
    expect(getSocketIdentityKey(fakeJwt({ role: "p1" }))).not.toBe(
      getSocketIdentityKey(fakeJwt({ role: "p1", exp: 2 }))
    );
  });
});
