import {
  buildDirectMessageIdentityCandidates,
  getDirectMessageProfileHref,
} from "@/helpers/waves/direct-message-profile.helpers";

describe("direct-message-profile.helpers", () => {
  it("returns the DM name as the profile href for a direct message", () => {
    expect(
      getDirectMessageProfileHref({
        isDirectMessage: true,
        identity: "prxt0",
        connectedProfile: {
          handle: "me",
          normalised_handle: "me",
          primary_wallet: "0xabc",
        },
        activeProfileProxyCreatedBy: null,
      })
    ).toBe("/prxt0");
  });

  it("matches self by handle, wallet, and id wallet aliases", () => {
    const candidates = buildDirectMessageIdentityCandidates({
      handle: "me",
      normalised_handle: "me",
      primary_wallet: "0xabc",
      query: "id-0xabc",
      wallets: [{ wallet: "0xdef" }],
    });

    expect(candidates.has("me")).toBe(true);
    expect(candidates.has("0xabc")).toBe(true);
    expect(candidates.has("id-0xabc")).toBe(true);
    expect(candidates.has("0xdef")).toBe(true);
    expect(candidates.has("id-0xdef")).toBe(true);
  });

  it("strips a leading @ from the DM name route target", () => {
    expect(
      getDirectMessageProfileHref({
        isDirectMessage: true,
        identity: "@prxt0",
        connectedProfile: {
          primary_wallet: "0xabc",
          query: "id-0xabc",
        },
        activeProfileProxyCreatedBy: null,
      })
    ).toBe("/prxt0");
  });

  it("does not use a group-like DM name as a profile href", () => {
    expect(
      getDirectMessageProfileHref({
        isDirectMessage: true,
        identity: "alice, bob",
        connectedProfile: {
          primary_wallet: "0xabc",
          query: "id-0xabc",
        },
        activeProfileProxyCreatedBy: null,
      })
    ).toBeNull();
  });

  it("returns null for non-DM waves", () => {
    expect(
      getDirectMessageProfileHref({
        isDirectMessage: false,
        identity: "alice",
        connectedProfile: { handle: "me" },
        activeProfileProxyCreatedBy: null,
      })
    ).toBeNull();
  });

  it("returns null when the DM name points to self by handle", () => {
    expect(
      getDirectMessageProfileHref({
        isDirectMessage: true,
        identity: "me",
        connectedProfile: { handle: "me" },
        activeProfileProxyCreatedBy: null,
      })
    ).toBeNull();
  });

  it("returns null when the DM name points to self by wallet alias", () => {
    expect(
      getDirectMessageProfileHref({
        isDirectMessage: true,
        identity: "id-0xabc",
        connectedProfile: {
          primary_wallet: "0xabc",
          query: "id-0xabc",
        },
        activeProfileProxyCreatedBy: null,
      })
    ).toBeNull();
  });
});
