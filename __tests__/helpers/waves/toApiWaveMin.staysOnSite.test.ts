import type { ApiWave } from "@/generated/models/ApiWave";
import { toApiWaveMin } from "@/helpers/waves/wave.helpers";

const wave = (extra: Record<string, unknown>) =>
  ({
    id: "w1",
    name: "Wave",
    picture: null,
    description_drop: { id: "d0" },
    last_drop_time: 0,
    author: { handle: "author" },
    voting: {
      authenticated_user_eligible: true,
      scope: { group: null },
      period: null,
      credit_type: "TDH",
      forbid_negative_votes: false,
      credit_nfts: [],
      credit_scope: "WAVE",
    },
    participation: {
      authenticated_user_eligible: true,
      scope: { group: null },
      submission_strategy: null,
    },
    chat: {
      authenticated_user_eligible: true,
      scope: { group: null },
      links_disabled: false,
    },
    visibility: { scope: { group: null } },
    wave: {
      authenticated_user_eligible_for_admin: false,
      admin_group: { group: null },
      admin_drop_deletion_enabled: false,
    },
    pinned: false,
    identity_wave: false,
    ...extra,
  }) as unknown as ApiWave;

describe("toApiWaveMin and the move to the 6529 Network", () => {
  it.each([true, false])(
    "keeps the API's stays_on_site (%s) on a drop's rebuilt wave",
    (staysOnSite) => {
      expect(
        toApiWaveMin(wave({ stays_on_site: staysOnSite })) as unknown as Record<
          string,
          unknown
        >
      ).toMatchObject({ stays_on_site: staysOnSite });
    }
  );

  it("carries whether the wave is a direct message, from its chat group", () => {
    const dm = wave({
      chat: {
        authenticated_user_eligible: true,
        scope: { group: { id: "g1", is_direct_message: true } },
        links_disabled: false,
      },
    });
    expect(toApiWaveMin(dm).is_direct_message).toBe(true);
    expect(toApiWaveMin(wave({})).is_direct_message).toBe(false);
  });

  it("adds nothing when the API doesn't send it", () => {
    expect(toApiWaveMin(wave({}))).not.toHaveProperty("stays_on_site");
  });
});

describe("withStaysOnSite", () => {
  it("copies the API's word only when it is a boolean", () => {
    const { withStaysOnSite } = jest.requireActual("@/lib/waves-move/scope");
    expect(withStaysOnSite({ id: "w1" }, { stays_on_site: true })).toEqual({
      id: "w1",
      stays_on_site: true,
    });
    expect(withStaysOnSite({ id: "w1" }, { stays_on_site: "yes" })).toEqual({
      id: "w1",
    });
    expect(withStaysOnSite({ id: "w1" }, null)).toEqual({ id: "w1" });
  });
});
