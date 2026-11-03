import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCompetitionVoteBudget } from "@/components/competitions/CompetitionVote";
import { updateCompetitionVoteInCache } from "@/components/react-query-wrapper/utils/updateCompetitionVoteInCache";
import { commonApiFetch } from "@/services/api/common-api";
import {
  invalidateCompetition,
  invalidateCompetitionWave,
} from "@/services/api/competitions-api";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiCompetitionCreditBudget } from "@/generated/models/ApiCompetitionCreditBudget";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";

let mockProfile: string | null = "alice";
let mockProxy: string | null = null;
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: mockProfile ? { id: mockProfile } : null,
    activeProfileProxy: mockProxy ? { id: mockProxy } : null,
  }),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));
jest.mock("@/hooks/competitions/useCompetitionSignature", () => ({
  useCompetitionSignatureFor: jest.fn(),
}));

const competition = { id: "competition", wave_id: "wave" } as ApiCompetition;
const identity = { waveId: "wave", competitionId: "competition" };
const initialBudget: ApiCompetitionCreditBudget = {
  competition_id: competition.id,
  profile_id: "alice",
  entry_id: "entry",
  credit_type: ApiWaveCreditType.Tdh,
  credit_scope: ApiWaveCreditScope.Wave,
  available: 100,
  spent: 10,
  remaining: 90,
  current_vote: 10,
  min_vote: -100,
  max_vote: 100,
};
let client: QueryClient;
function wrapper({ children }: { readonly children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
function mountBudget(entryId = "entry") {
  return renderHook(
    () => {
      const { data, isSuccess, isFetching, isPending } =
        useCompetitionVoteBudget(competition, entryId);
      return { data, isSuccess, isFetching, isPending };
    },
    { wrapper }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockProfile = "alice";
  mockProxy = null;
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  jest.mocked(commonApiFetch).mockImplementation(async ({ params }) => ({
    ...initialBudget,
    entry_id: params?.["entry_id"] ?? null,
  }));
});
afterEach(() => {
  client.clear();
  jest.restoreAllMocks();
});

it("reuses fresh limits on remount and reads again after the freshness window", async () => {
  const now = Date.now();
  const clock = jest.spyOn(Date, "now").mockReturnValue(now);
  const first = mountBudget();
  await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
  first.unmount();
  clock.mockReturnValue(now + 14_000);
  const fresh = mountBudget();
  expect(fresh.result.current.data).toEqual(initialBudget);
  expect(fresh.result.current.isFetching).toBe(false);
  expect(commonApiFetch).toHaveBeenCalledTimes(1);
  fresh.unmount();
  clock.mockReturnValue(now + 15_001);
  const expired = mountBudget();
  await waitFor(() => expect(expired.result.current.isFetching).toBe(false));
  expect(commonApiFetch).toHaveBeenCalledTimes(2);
});

it.each(["bob", "delegated"])(
  "isolates fresh limits when switching to %s",
  async (account) => {
    const view = mountBudget();
    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));
    let resolveBudget!: (budget: ApiCompetitionCreditBudget) => void;
    jest.mocked(commonApiFetch).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveBudget = resolve;
      })
    );
    if (account === "bob") mockProfile = "bob";
    else mockProxy = "delegated";
    view.rerender();
    expect(view.result.current.data).toBeUndefined();
    expect(view.result.current.isPending).toBe(true);
    await act(async () => {
      resolveBudget({ ...initialBudget, max_vote: 30 });
    });
    await waitFor(() => expect(view.result.current.data?.max_vote).toBe(30));
    expect(commonApiFetch).toHaveBeenCalledTimes(2);
  }
);

it.each([40, 0])(
  "applies a confirmed vote of %s immediately and refreshes other entry limits",
  async (value) => {
    const voted = mountBudget();
    const other = mountBudget("other-entry");
    await waitFor(() => expect(other.result.current.isSuccess).toBe(true));
    const confirmed = { ...initialBudget, current_vote: value };
    await act(async () => {
      await updateCompetitionVoteInCache(client, {
        ...identity,
        entryId: "entry",
        dropId: "drop",
        viewer: "alice:self",
        budget: confirmed,
        isCurrentViewer: () => true,
      });
    });
    await waitFor(() =>
      expect(voted.result.current.data?.current_vote).toBe(value)
    );
    jest.mocked(commonApiFetch).mockImplementation(async ({ params }) => ({
      ...confirmed,
      entry_id: params?.["entry_id"] ?? null,
      max_vote: params?.["entry_id"] === "entry" ? 100 : 100 - value,
    }));
    await act(async () => {
      await invalidateCompetition(client, identity);
    });
    expect(commonApiFetch).toHaveBeenCalledTimes(4);
    await waitFor(() =>
      expect(other.result.current.data?.max_vote).toBe(100 - value)
    );
  }
);

it("refreshes invalidated limits even while the row is unmounted", async () => {
  const view = mountBudget();
  await waitFor(() => expect(view.result.current.isSuccess).toBe(true));
  view.unmount();
  await invalidateCompetitionWave(client, identity.waveId);
  expect(commonApiFetch).toHaveBeenCalledTimes(1);
  jest
    .mocked(commonApiFetch)
    .mockResolvedValue({ ...initialBudget, max_vote: 50 });
  const refreshed = mountBudget();
  await waitFor(() => expect(refreshed.result.current.data?.max_vote).toBe(50));
  expect(commonApiFetch).toHaveBeenCalledTimes(2);
});
