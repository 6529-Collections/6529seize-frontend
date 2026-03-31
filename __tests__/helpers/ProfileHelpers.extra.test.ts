import {
  getProfileConnectedStatus,
  getProfileViewerContext,
  isOwnProfileRoute,
  profileAndConsolidationsToProfileMin,
} from "@/helpers/ProfileHelpers";
import { ProfileConnectedStatus } from "@/entities/IProfile";

describe("getProfileConnectedStatus", () => {
  it("returns NOT_CONNECTED when profile missing", () => {
    expect(getProfileConnectedStatus({ profile: null, isProxy: false })).toBe(
      ProfileConnectedStatus.NOT_CONNECTED
    );
  });

  it("returns PROXY when isProxy true", () => {
    expect(
      getProfileConnectedStatus({ profile: {} as any, isProxy: true })
    ).toBe(ProfileConnectedStatus.PROXY);
  });

  it("returns NO_PROFILE when handle missing", () => {
    const profile = { handle: null } as any;
    expect(getProfileConnectedStatus({ profile, isProxy: false })).toBe(
      ProfileConnectedStatus.NO_PROFILE
    );
  });

  it("returns HAVE_PROFILE otherwise", () => {
    const profile = { handle: "user" } as any;
    expect(getProfileConnectedStatus({ profile, isProxy: false })).toBe(
      ProfileConnectedStatus.HAVE_PROFILE
    );
  });
});

describe("isOwnProfileRoute", () => {
  it("matches the connected profile by normalized handle", () => {
    expect(
      isOwnProfileRoute({
        connectedProfile: {
          normalised_handle: "alice",
          wallets: [],
        } as any,
        handleOrWallet: "Alice",
      })
    ).toBe(true);
  });

  it("matches the connected profile by wallet address", () => {
    expect(
      isOwnProfileRoute({
        connectedProfile: {
          normalised_handle: "alice",
          wallets: [{ wallet: "0xabc123" }],
        } as any,
        handleOrWallet: "0xAbC123",
      })
    ).toBe(true);
  });

  it("returns false for another profile", () => {
    expect(
      isOwnProfileRoute({
        connectedProfile: {
          normalised_handle: "alice",
          wallets: [{ wallet: "0xabc123" }],
        } as any,
        handleOrWallet: "bob",
      })
    ).toBe(false);
  });
});

describe("getProfileViewerContext", () => {
  it("returns anonymous when no viewer is connected", () => {
    expect(
      getProfileViewerContext({
        connectedProfile: null,
        handleOrWallet: "alice",
      })
    ).toBe("anonymous");
  });

  it("returns self for the connected user's profile", () => {
    expect(
      getProfileViewerContext({
        connectedProfile: {
          normalised_handle: "alice",
          wallets: [],
        } as any,
        handleOrWallet: "alice",
      })
    ).toBe("self");
  });

  it("returns other for another signed-in user's profile", () => {
    expect(
      getProfileViewerContext({
        connectedProfile: {
          normalised_handle: "alice",
          wallets: [],
        } as any,
        handleOrWallet: "bob",
      })
    ).toBe("other");
  });

  it("returns null when the profile target is missing", () => {
    expect(
      getProfileViewerContext({
        connectedProfile: null,
        handleOrWallet: "   ",
      })
    ).toBeNull();
  });
});

describe("profileAndConsolidationsToProfileMin", () => {
  it("returns null when id or handle missing", () => {
    expect(
      profileAndConsolidationsToProfileMin({
        profile: { id: "", handle: "" } as any,
      })
    ).toBeNull();
  });

  it("maps fields correctly", () => {
    const profile = {
      id: "1",
      handle: "user",
      pfp: "img",
      banner1: "b1",
      banner2: "b2",
      cic: 1,
      rep: 2,
      tdh: 3,
      level: 4,
      primary_wallet: "0x1",
    } as any;
    const res = profileAndConsolidationsToProfileMin({ profile })!;
    expect(res).toEqual({
      id: "1",
      handle: "user",
      pfp: "img",
      banner1_color: null,
      banner2_color: null,
      cic: 1,
      rep: 2,
      tdh: 3,
      tdh_rate: undefined,
      xtdh: undefined,
      xtdh_rate: undefined,
      level: 4,
      archived: false,
      primary_address: "0x1",
      active_main_stage_submission_ids: undefined,
      winner_main_stage_drop_ids: undefined,
      is_wave_creator: undefined,
      artist_of_prevote_cards: undefined,
    });
  });
});
