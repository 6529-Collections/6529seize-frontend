import {
  assertWavesWriteAllowed,
  WavesWritePausedError,
} from "@/lib/waves-move/writeGuard";
import {
  clearWavesFreeze,
  setWavesFreezeSchedule,
  WAVES_FREEZE_MS,
} from "@/__tests__/helpers/wavesFreeze";
import {
  forgetWaveMoves,
  rememberDropWave,
  rememberWaveMove,
} from "@/lib/waves-move/scope";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        ...(globalThis as { __wavesFreeze?: object }).__wavesFreeze,
      };
    },
  };
});

const API = "https://api.example.test/api";

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

const attempt =
  ({ method, path, body }: Request) =>
  () =>
    assertWavesWriteAllowed({
      method,
      url: `${API}/${path}`,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

const COMPETITION = "v3/waves/w1/competitions/c1";

const PAUSED: readonly Request[] = [
  // Votes
  req("PUT", `${COMPETITION}/entries/e1/votes/me`, { value: 3 }),
  // Entries and polls
  req("POST", "drops", { wave_id: "w1", drop_type: "PARTICIPATORY" }),
  req("POST", "v2/drops", { wave_id: "w1", drop_type: "PARTICIPATORY" }),
  req("POST", "drops", { wave_id: "w1", drop_type: "CHAT", poll: {} }),
  req("POST", `${COMPETITION}/entries`, { parts: [] }),
  req("POST", "v2/drops/d1/poll/vote", { options: [1] }),
  // Wave REP
  req("POST", "waves/w1/rep/rating", { amount: 5, category: "Art" }),
  // Waves
  req("POST", "v3/waves", { name: "New wave" }),
  req("PATCH", "v3/waves/w1", { name: "Renamed" }),
  req("POST", "waves", { name: "New wave" }),
  req("POST", "waves/w1", { name: "Renamed" }),
  req("POST", "v2/waves/w1/metadata", { data_key: "rules" }),
  req("DELETE", "v2/waves/w1/metadata/m1"),
  // Decisions
  req("POST", "v3/waves/w1/competitions", { title: "Decision" }),
  req("PATCH", COMPETITION, { title: "Renamed" }),
  req("POST", `${COMPETITION}/actions/publish`, {}),
  req("POST", `${COMPETITION}/actions/pause`, {}),
  req("POST", `${COMPETITION}/actions/resume`, {}),
  req("POST", `${COMPETITION}/actions/archive`, {}),
  req("POST", `${COMPETITION}/actions/clone`, {}),
  req("post", "v2/drops/d1/poll/vote/"),
];

const OPEN: readonly Request[] = [
  // Chat
  req("POST", "drops", { wave_id: "w1", drop_type: "CHAT" }),
  req("POST", "drops", { wave_id: "w1" }),
  req("POST", "drops", { wave_id: "w1", drop_type: "CHAT", poll: null }),
  req("POST", "drops/d1", { parts: [] }),
  req("DELETE", "drops/d1"),
  req("POST", "drops/d1/reaction", { reaction: ":+1:" }),
  req("DELETE", "drops/d1/reaction"),
  // A rating of a chat drop looks like a vote; the vote controls decide
  req("POST", "drops/d1/ratings", { rating: 1, category: "Rep" }),
  req("POST", "waves/direct-message/new", { identity_addresses: [] }),
  // A wave's deletion looks like a direct message's; the control decides
  req("DELETE", "waves/w1"),
  // Groups also serve direct-message preferences and filters
  req("POST", "groups", { name: "Group" }),
  req("POST", "groups/g1/visible", { visible: true }),
  // Display state and personal settings
  req("POST", "waves/w1/mute", {}),
  req("DELETE", "waves/w1/mute"),
  req("POST", "waves/w1/pins", {}),
  req("POST", "waves/w1/pinned-drop", {}),
  req("POST", "waves/w1/curations", { name: "Picks" }),
  req("DELETE", "waves/w1/curations/c1"),
  req("POST", "drops/d1/curations", {}),
  req("POST", "drops/d1/bookmark"),
  req("POST", "drops/d1/collaborations", {}),
  req("POST", "notifications/wave-subscription/w1"),
  // Reads sent as POST
  req("POST", "groups/preview-members", {}),
  req("POST", "wave-group-validation", {}),
  req("POST", `${COMPETITION}/main-stage-traits/validate`, {}),
  // Identity routes belong to the identity freeze
  req("POST", "profiles/alice/rep/rating", { amount: 1 }),
  req("POST", "ratings", {}),
  // Lookalikes
  req("POST", "drops/d1/ratingsx"),
  req("POST", "v3/waves/w1/other", {}),
  req("POST", `${COMPETITION}/actions/unknown`, {}),
];

const READS: readonly Request[] = [
  req("GET", "drops/d1/ratings"),
  req("GET", "v3/waves/w1"),
  req("GET", `${COMPETITION}/credits/me`),
  req("HEAD", "groups"),
  req("OPTIONS", "waves/w1/rep/rating"),
];

describe("assertWavesWriteAllowed", () => {
  // The pages read w1 as a wave that moves, and showed drop d1 in it.
  beforeEach(() => {
    rememberWaveMove("w1", true);
    rememberDropWave("d1", "w1");
  });

  afterEach(() => {
    clearWavesFreeze();
    forgetWaveMoves();
    jest.useRealTimers();
  });

  const at = (ms: number) => {
    jest.useFakeTimers({ now: ms });
  };

  it("sends everything when no freeze is set", () => {
    at(WAVES_FREEZE_MS + 1);
    for (const request of PAUSED) {
      expect(attempt(request)).not.toThrow();
    }
  });

  it("sends everything before the freeze", () => {
    setWavesFreezeSchedule();
    at(WAVES_FREEZE_MS - 1);
    for (const request of PAUSED) {
      expect(attempt(request)).not.toThrow();
    }
  });

  it.each(PAUSED.map((request) => [request.method, request.path, request]))(
    "refuses %s %s from the freeze",
    (_method, _path, request) => {
      setWavesFreezeSchedule();
      at(WAVES_FREEZE_MS);
      expect(attempt(request)).toThrow(WavesWritePausedError);
      expect(attempt(request)).toThrow(
        "Paused for the move to the 6529 Network."
      );
    }
  );

  it.each(OPEN.map((request) => [request.method, request.path, request]))(
    "keeps sending %s %s",
    (_method, _path, request) => {
      setWavesFreezeSchedule();
      at(WAVES_FREEZE_MS);
      expect(attempt(request)).not.toThrow();
    }
  );

  it.each(READS.map((request) => [request.method, request.path, request]))(
    "keeps reading %s %s",
    (_method, _path, request) => {
      setWavesFreezeSchedule();
      at(WAVES_FREEZE_MS);
      expect(attempt(request)).not.toThrow();
    }
  );

  describe("a wave that stays on 6529.io, or one no page has read", () => {
    const writesOf = (waveId: string, dropId: string) => [
      req("POST", "drops", { wave_id: waveId, drop_type: "PARTICIPATORY" }),
      req("POST", `v2/drops/${dropId}/poll/vote`, { options: [1] }),
      req("POST", `waves/${waveId}/rep/rating`, { amount: 5 }),
      req("PATCH", `v3/waves/${waveId}`, { name: "Renamed" }),
      req("POST", `v3/waves/${waveId}/competitions`, { title: "Decision" }),
      req("POST", `v2/waves/${waveId}/metadata`, { data_key: "rules" }),
    ];

    it("keeps sending a staying wave's writes from the freeze", () => {
      rememberWaveMove("w2", false);
      rememberDropWave("d2", "w2");
      setWavesFreezeSchedule();
      at(WAVES_FREEZE_MS);
      for (const request of writesOf("w2", "d2")) {
        expect(attempt(request)).not.toThrow();
      }
    });

    it("keeps sending an unread wave's writes, and leaves them to the API", () => {
      setWavesFreezeSchedule();
      at(WAVES_FREEZE_MS);
      for (const request of writesOf("w3", "d3")) {
        expect(attempt(request)).not.toThrow();
      }
    });

    it("still refuses a new wave, which would move", () => {
      setWavesFreezeSchedule();
      at(WAVES_FREEZE_MS);
      expect(attempt(req("POST", "waves", { name: "New" }))).toThrow(
        WavesWritePausedError
      );
      expect(attempt(req("POST", "v3/waves", { name: "New" }))).toThrow(
        WavesWritePausedError
      );
    });
  });

  it("refuses as the API does, so nothing retries it", () => {
    setWavesFreezeSchedule();
    at(WAVES_FREEZE_MS);
    let thrown: unknown;
    try {
      attempt(PAUSED[0]!)();
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(WavesWritePausedError);
    expect((thrown as WavesWritePausedError).status).toBe(423);
  });

  it("ignores URLs outside the API", () => {
    setWavesFreezeSchedule();
    at(WAVES_FREEZE_MS);
    expect(() =>
      assertWavesWriteAllowed({
        method: "POST",
        url: "https://example.test/drops/d1/ratings",
      })
    ).not.toThrow();
  });

  it("treats an unreadable drop body as chat", () => {
    setWavesFreezeSchedule();
    at(WAVES_FREEZE_MS);
    expect(() =>
      assertWavesWriteAllowed({
        method: "POST",
        url: `${API}/drops`,
        body: "{not json",
      })
    ).not.toThrow();
  });
});
