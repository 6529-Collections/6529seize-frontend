import { renderHook } from "@testing-library/react";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useCompetitionSubmissionWave } from "@/hooks/competitions/useCompetitionSubmissionWave";
import { competitionPresentationWave } from "@/helpers/competition-presentation.helpers";
import type { CompetitionContextValue } from "@/contexts/CompetitionContext";

let mockContext: CompetitionContextValue | null = null;
let mockSelected: string | null = null;
let mockDetail: {
  data: ApiCompetition | undefined;
  error: unknown;
  isPending: boolean;
};
let mockDefault: {
  data: { competition_id: string | null };
  isFetching: boolean;
  refetch: jest.Mock;
};
const mockSelectionQuery = jest.fn();
const mockDetailQuery = jest.fn();
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => mockSelected }),
}));
jest.mock("@/contexts/CompetitionContext", () => ({
  useOptionalCompetition: () => mockContext,
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useDefaultCompetition: (...args: unknown[]) => {
    mockSelectionQuery(...args);
    return mockDefault;
  },
  useCompetitionDetail: (...args: unknown[]) => {
    mockDetailQuery(...args);
    return { ...mockDetail, refetch: jest.fn() };
  },
}));

const wave = {
  id: "wave",
  name: "Shared chat",
  wave: { type: "RANK" },
  pauses: [],
  chat: { scope: { group: null } },
  participation: {
    terms: "Obsolete parent terms",
    required_metadata: [{ name: "parent", type: "STRING" }],
  },
  voting: { creditor: { id: "parent-creditor" } },
} as unknown as ApiWave;
const competition = (id: string, capabilities: string[] = []): ApiCompetition =>
  ({
    id,
    wave_id: "wave",
    title: id,
    type: "RANK",
    lifecycle: "PUBLISHED",
    config_version: 1,
    capabilities,
    permissions: { submit: true, vote: true, view: true, administer: true },
    participation: {
      starts_at: null,
      ends_at: null,
      signature_required: true,
      terms: `${id} terms`,
      max_entries_per_participant: 5,
      required_metadata: [{ name: "native", type: "STRING" }],
      required_media: ["IMAGE"],
      submission_type: "IDENTITY",
      identity_submission_strategy: "ONLY_MYSELF",
      identity_submission_duplicates: "NEVER_ALLOW",
    },
    voting: {
      starts_at: null,
      ends_at: null,
      credit_type: "TDH",
      credit_scope: "WAVE",
      credit_creditor: null,
      credit_category: null,
      credit_nfts: [],
      signature_required: true,
      forbid_negative_votes: false,
    },
    decisions: { strategy: null, next_decision_time: null, time_lock_ms: null },
    winners: {
      max_winners: null,
      winning_min_threshold: null,
      winning_threshold_min_duration_ms: 0,
    },
  }) as unknown as ApiCompetition;

beforeEach(() => {
  jest.clearAllMocks();
  mockContext = null;
  mockSelected = null;
  mockDetail = {
    data: competition("alpha", ["MAIN_STAGE"]),
    error: null,
    isPending: false,
  };
  mockDefault = {
    data: { competition_id: "alpha" },
    isFetching: false,
    refetch: jest.fn(),
  };
});

it("handles an initial missing wave without selecting a command scope", () => {
  const { result } = renderHook(() => useCompetitionSubmissionWave(undefined));
  expect(result.current.wave).toBeNull();
  expect(result.current.pending).toBe(false);
});
it("uses the default native competition for shared-chat actions and preserves the parent name", () => {
  const { result } = renderHook(() => useCompetitionSubmissionWave(wave));
  expect(result.current.wave?.name).toBe("Shared chat");
  expect(result.current.wave?.competition.id).toBe("alpha");
  expect(result.current.wave?.participation).toMatchObject({
    terms: "alpha terms",
    signature_required: true,
    required_media: ["IMAGE"],
    required_metadata: [{ name: "native", type: "STRING" }],
    submission_strategy: {
      type: "IDENTITY",
      config: {
        who_can_be_submitted: "ONLY_MYSELF",
        duplicates: "NEVER_ALLOW",
      },
    },
  });
  expect(mockDetailQuery).toHaveBeenCalledWith(
    { waveId: "wave", competitionId: "alpha" },
    true
  );
});
it("pins the selected sibling and does not inherit the primary artwork capability", () => {
  mockSelected = "beta";
  mockDetail.data = competition("beta");
  const { result } = renderHook(() => useCompetitionSubmissionWave(wave));
  expect(result.current.wave?.competition.id).toBe("beta");
  expect(result.current.wave?.competition.capabilities).toEqual([]);
  expect(mockSelectionQuery).toHaveBeenCalledWith("wave", false);
});
it("uses a source drop's explicit competition before an enclosing sibling selection", () => {
  const alpha = competition("alpha", ["MAIN_STAGE"]);
  mockContext = {
    competition: competition("beta"),
    wave,
    hub: { id: "wave" },
  } as CompetitionContextValue;
  const { result } = renderHook(() =>
    useCompetitionSubmissionWave(competitionPresentationWave(wave, alpha))
  );
  expect(result.current.wave?.competition.id).toBe("alpha");
  expect(mockDetailQuery).toHaveBeenCalledWith(expect.anything(), false);
});
it("keeps old parent settings out of an unresolved or access-rejected command", () => {
  mockDetail = { data: undefined, error: null, isPending: true };
  const { result, rerender } = renderHook(() =>
    useCompetitionSubmissionWave(wave)
  );
  expect(result.current.wave).toBeNull();
  expect(result.current.pending).toBe(true);
  mockDetail = {
    data: competition("alpha"),
    error: { status: 403 },
    isPending: false,
  };
  rerender();
  expect(result.current.wave).toBeNull();
});
