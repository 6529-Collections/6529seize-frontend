import { renderHook } from "@testing-library/react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { isMultiCompetitionEnabled } from "@/helpers/competition.helpers";
import {
  useCompetitionHub,
  useCompetitionList,
  useDefaultCompetition,
} from "@/hooks/competitions/useCompetitionQueries";
import { useWaveCompetitionsTab } from "@/hooks/competitions/useWaveCompetitionsTab";
import { render } from "@testing-library/react";
import { createElement } from "react";
import { TabCountBadge } from "@/components/common/TabCountBadge";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => mockAuth,
}));
let mockAuth = {
  isAuthenticated: false,
  connectedProfile: null as { id: string } | null,
};

jest.mock("@/helpers/competition.helpers", () => ({
  ...jest.requireActual("@/helpers/competition.helpers"),
  isMultiCompetitionEnabled: jest.fn(),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionHub: jest.fn(),
  useDefaultCompetition: jest.fn(),
  useCompetitionList: jest.fn(),
}));

const wave = { id: "wave", chat: { scope: { group: null } } } as ApiWave;

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth = { isAuthenticated: false, connectedProfile: null };
  (useDefaultCompetition as jest.Mock).mockReturnValue({
    isSuccess: true,
    data: { competition_id: null },
  });
});

it.each([
  { canCreate: true, visibleCount: 0, enabled: true, expected: true },
  { canCreate: false, visibleCount: 1, enabled: true, expected: true },
  { canCreate: false, visibleCount: 0, enabled: true, expected: false },
  { canCreate: true, visibleCount: 1, enabled: false, expected: false },
])(
  "tracks competition availability for $canCreate / $visibleCount / $enabled",
  ({ canCreate, visibleCount, enabled, expected }) => {
    (isMultiCompetitionEnabled as jest.Mock).mockReturnValue(enabled);
    (useCompetitionHub as jest.Mock).mockReturnValue({
      isSuccess: true,
      data: { permissions: { create_competition: canCreate } },
    });
    (useCompetitionList as jest.Mock).mockReturnValue({
      data: {
        pages: [
          {
            data: Array.from({ length: visibleCount }, () => ({
              id: "competition",
            })),
          },
        ],
      },
    });
    const { result } = renderHook(() => useWaveCompetitionsTab(wave));
    expect(result.current.hasCompetitions).toBe(expected);
  }
);

it.each([0, 3])(
  "counts only active/upcoming competitions and hides a zero badge (%s)",
  (activeCount) => {
    (isMultiCompetitionEnabled as jest.Mock).mockReturnValue(true);
    (useCompetitionHub as jest.Mock).mockReturnValue({
      isSuccess: true,
      data: { permissions: { create_competition: true } },
    });
    (useCompetitionList as jest.Mock).mockImplementation((_waveId, filter) => ({
      isSuccess: true,
      hasNextPage: false,
      data: {
        pages: [
          {
            data: Array.from(
              { length: filter === "active" ? activeCount : 7 },
              (_, id) => ({ id })
            ),
          },
        ],
      },
    }));
    const { result } = renderHook(() => useWaveCompetitionsTab(wave));
    expect(result.current.activeCount).toBe(activeCount);
    const { container } = render(
      createElement(TabCountBadge, { count: result.current.activeCount })
    );
    expect(container.textContent).toBe(
      activeCount === 0 ? "" : String(activeCount)
    );
  }
);

it("loads every active page before showing a count", () => {
  (isMultiCompetitionEnabled as jest.Mock).mockReturnValue(true);
  (useCompetitionHub as jest.Mock).mockReturnValue({
    isSuccess: true,
    data: { permissions: { create_competition: true } },
  });
  const fetchNextPage = jest.fn();
  let hasNextPage = true;
  (useCompetitionList as jest.Mock).mockImplementation((_waveId, filter) => ({
    isSuccess: true,
    hasNextPage: filter === "active" && hasNextPage,
    isFetching: false,
    isError: false,
    fetchNextPage,
    data: {
      pages: [{ data: [{ id: "first" }] }, { data: [{ id: "second" }] }],
    },
  }));
  const { result, rerender } = renderHook(() => useWaveCompetitionsTab(wave));
  expect(fetchNextPage).toHaveBeenCalledTimes(1);
  expect(result.current.activeCount).toBeUndefined();
  hasNextPage = false;
  rerender();
  expect(result.current.activeCount).toBe(2);
});

function configureSingleCompetition() {
  mockAuth = { isAuthenticated: true, connectedProfile: { id: "viewer" } };
  (isMultiCompetitionEnabled as jest.Mock).mockReturnValue(true);
  (useDefaultCompetition as jest.Mock).mockReturnValue({
    isSuccess: true,
    isFetching: false,
    isError: false,
    data: { competition_id: "sole" },
  });
  (useCompetitionHub as jest.Mock).mockReturnValue({
    isSuccess: true,
    isFetching: false,
    data: {
      permissions: { administer: false, create_competition: false },
      legacy_primary_competition_id: "sole",
    },
  });
  (useCompetitionList as jest.Mock).mockReturnValue({
    isSuccess: true,
    isFetching: false,
    isError: false,
    hasNextPage: false,
    data: { pages: [{ data: [{ id: "sole" }], has_more: false }] },
  });
}

it("continues reading default context when a wave gains a competition", () => {
  configureSingleCompetition();
  (useCompetitionList as jest.Mock).mockReturnValue({
    isSuccess: true,
    isFetching: false,
    isError: false,
    hasNextPage: false,
    data: { pages: [{ data: [], has_more: false }] },
  });
  (useDefaultCompetition as jest.Mock).mockReturnValue({
    isSuccess: true,
    data: { competition_id: null },
  });
  const { result, rerender } = renderHook(() => useWaveCompetitionsTab(wave));
  expect(useDefaultCompetition).toHaveBeenLastCalledWith("wave", true);
  expect(result.current.defaultCompetitionId).toBeNull();
  expect(result.current.hasCompetitions).toBe(false);

  (useDefaultCompetition as jest.Mock).mockReturnValue({
    isSuccess: true,
    data: { competition_id: "sole" },
  });
  rerender();
  expect(useDefaultCompetition).toHaveBeenLastCalledWith("wave", true);
  expect(result.current.defaultCompetitionId).toBe("sole");
  expect(result.current.hasCompetitions).toBe(true);
});

it.each(["legacy", "native", "UPCOMING", "COMPLETED", "ARCHIVED"])(
  "hides a proven sole default for a logged-in non-admin (%s)",
  (kind) => {
    configureSingleCompetition();
    if (kind === "native")
      (useCompetitionHub as jest.Mock).mockReturnValue({
        isSuccess: true,
        data: {
          permissions: { administer: false, create_competition: false },
          legacy_primary_competition_id: null,
        },
      });
    (useCompetitionList as jest.Mock).mockReturnValue({
      isSuccess: true,
      hasNextPage: false,
      data: {
        pages: [
          { data: [{ id: "sole", computed_phase: kind }], has_more: false },
        ],
      },
    });
    const { result } = renderHook(() => useWaveCompetitionsTab(wave));
    expect(result.current.hideCompetitionsTab).toBe(true);
    expect(result.current.hasCompetitions).toBe(true);
  }
);

it.each(["UPCOMING", "COMPLETED", "ARCHIVED"])(
  "retains the tab for an active default plus %s",
  (phase) => {
    configureSingleCompetition();
    (useCompetitionList as jest.Mock).mockImplementation((_id, filter) => ({
      isSuccess: true,
      hasNextPage: false,
      data: {
        pages: [
          {
            has_more: false,
            data:
              filter === "active"
                ? [{ id: "sole" }]
                : [{ id: "sole" }, { id: "other", computed_phase: phase }],
          },
        ],
      },
    }));
    const { result } = renderHook(() => useWaveCompetitionsTab(wave));
    expect(result.current.hideCompetitionsTab).toBe(false);
  }
);

it.each([
  {
    name: "logged out",
    auth: { isAuthenticated: false, connectedProfile: null },
  },
  {
    name: "auth unresolved",
    auth: { isAuthenticated: undefined, connectedProfile: { id: "viewer" } },
  },
  {
    name: "admin without creation rights",
    permissions: { administer: true, create_competition: false },
  },
  {
    name: "permissions unresolved",
    permissions: { create_competition: false },
  },
  { name: "hub loading", hub: { isSuccess: false } },
  { name: "default loading", selection: { isSuccess: false } },
  { name: "default error", selection: { isError: true } },
  {
    name: "no eligible default",
    selection: { data: { competition_id: null } },
  },
  {
    name: "default absent from visible list",
    selection: { data: { competition_id: "other" } },
  },
  { name: "count loading", list: { isSuccess: false } },
  { name: "count error", list: { isError: true } },
  {
    name: "next page pending",
    list: { hasNextPage: true, fetchNextPage: jest.fn() },
  },
  {
    name: "malformed next cursor",
    list: { data: { pages: [{ data: [{ id: "sole" }], has_more: true }] } },
  },
])(
  "uses established server permissions when $name",
  ({ auth, permissions, hub, selection, list }) => {
    configureSingleCompetition();
    if (auth) mockAuth = auth as typeof mockAuth;
    if (permissions || hub)
      (useCompetitionHub as jest.Mock).mockReturnValue({
        ...(useCompetitionHub as jest.Mock).getMockImplementation()!(),
        ...hub,
        ...(permissions ? { data: { permissions } } : {}),
      });
    if (selection)
      (useDefaultCompetition as jest.Mock).mockReturnValue({
        ...(useDefaultCompetition as jest.Mock).getMockImplementation()!(),
        ...selection,
      });
    if (list)
      (useCompetitionList as jest.Mock).mockReturnValue({
        ...(useCompetitionList as jest.Mock).getMockImplementation()!(),
        ...list,
      });
    const { result } = renderHook(() => useWaveCompetitionsTab(wave));
    expect(result.current.hideCompetitionsTab).toBe(
      permissions?.administer !== true
    );
  }
);

it.each([
  ["permissions", useCompetitionHub],
  ["default selection", useDefaultCompetition],
  ["competition list", useCompetitionList],
] as const)("keeps settled tabs ready while refreshing %s", (_name, query) => {
  configureSingleCompetition();
  const mockQuery = query as jest.Mock;
  const settled = mockQuery.getMockImplementation()!();
  const { result, rerender } = renderHook(() => useWaveCompetitionsTab(wave));
  const beforeRefresh = result.current;
  expect(beforeRefresh.hideCompetitionsTab).toBe(true);
  expect(beforeRefresh.isPending).toBe(false);

  mockQuery.mockReturnValue({ ...settled, isFetching: true });
  rerender();
  expect(result.current).toEqual(beforeRefresh);

  mockQuery.mockReturnValue(settled);
  rerender();
  expect(result.current).toEqual(beforeRefresh);
});

it("keeps an empty wave empty during refresh and applies newly loaded competitions", () => {
  configureSingleCompetition();
  (useDefaultCompetition as jest.Mock).mockReturnValue({
    isSuccess: true,
    data: { competition_id: null },
  });
  const list = {
    isSuccess: true,
    isFetching: false,
    hasNextPage: false,
    data: { pages: [{ data: [] as { id: string }[], has_more: false }] },
  };
  (useCompetitionList as jest.Mock).mockReturnValue(list);
  const { result, rerender } = renderHook(() => useWaveCompetitionsTab(wave));
  const empty = result.current;
  expect(empty.hasCompetitions).toBe(false);
  expect(empty.isPending).toBe(false);

  (useCompetitionList as jest.Mock).mockReturnValue({
    ...list,
    isFetching: true,
  });
  rerender();
  expect(result.current).toEqual(empty);

  list.data.pages[0]!.data.push({ id: "sole" }, { id: "new" });
  (useCompetitionList as jest.Mock).mockReturnValue(list);
  rerender();
  expect(result.current.hasCompetitions).toBe(true);
  expect(result.current.hideCompetitionsTab).toBe(false);
  expect(result.current.isPending).toBe(false);
});

it("reveals the collection when a refresh changes the list or permissions", () => {
  configureSingleCompetition();
  const { result, rerender } = renderHook(() => useWaveCompetitionsTab(wave));
  expect(result.current.hideCompetitionsTab).toBe(true);
  const list = (useCompetitionList as jest.Mock).getMockImplementation()!();
  (useCompetitionList as jest.Mock).mockReturnValue({
    ...list,
    data: {
      pages: [{ data: [{ id: "sole" }, { id: "new" }], has_more: false }],
    },
  });
  rerender();
  expect(result.current.hideCompetitionsTab).toBe(false);

  (useCompetitionList as jest.Mock).mockReturnValue(list);
  (useCompetitionHub as jest.Mock).mockReturnValue({
    isSuccess: true,
    data: { permissions: { administer: true, create_competition: false } },
  });
  rerender();
  expect(result.current.hideCompetitionsTab).toBe(false);
});

it.each([false, true])(
  "waits for an incomplete collection (fetching: %s)",
  (isFetching) => {
    configureSingleCompetition();
    (useCompetitionList as jest.Mock).mockReturnValue({
      isSuccess: true,
      isFetching,
      hasNextPage: true,
      fetchNextPage: jest.fn(),
      data: { pages: [{ data: [{ id: "sole" }], has_more: true }] },
    });
    const { result } = renderHook(() => useWaveCompetitionsTab(wave));
    expect(result.current.isPending).toBe(true);
    expect(result.current.hideCompetitionsTab).toBe(true);
  }
);

it("counts distinct IDs across completed pages without adding the legacy facade twice", () => {
  configureSingleCompetition();
  (useCompetitionList as jest.Mock).mockReturnValue({
    isSuccess: true,
    hasNextPage: false,
    data: {
      pages: [
        { data: [{ id: "sole" }], has_more: true },
        { data: [{ id: "sole" }], has_more: false },
      ],
    },
  });
  const { result } = renderHook(() => useWaveCompetitionsTab(wave));
  expect(result.current.hideCompetitionsTab).toBe(true);
});

it.each([
  ["permissions", useCompetitionHub],
  ["default selection", useDefaultCompetition],
  ["competition list", useCompetitionList],
] as const)(
  "keeps a cached sole competition hidden when %s refresh fails",
  (_name, query) => {
    configureSingleCompetition();
    const mockQuery = query as jest.Mock;
    const settled = mockQuery.getMockImplementation()!();
    const { result, rerender } = renderHook(() => useWaveCompetitionsTab(wave));
    mockQuery.mockReturnValue({
      ...settled,
      isSuccess: false,
      isError: true,
      error: { status: 503 },
    });
    rerender();
    expect(result.current.hideCompetitionsTab).toBe(true);
    expect(result.current.defaultCompetitionId).toBe("sole");
    expect(result.current.hasCompetitions).toBe(true);
    expect(result.current.isPending).toBe(false);
  }
);

it.each([
  ["permissions", useCompetitionHub],
  ["default selection", useDefaultCompetition],
  ["competition list", useCompetitionList],
] as const)(
  "retains the collection with two cached distinct records when %s refresh fails",
  (_name, query) => {
    configureSingleCompetition();
    const list = (useCompetitionList as jest.Mock).getMockImplementation()!();
    (useCompetitionList as jest.Mock).mockReturnValue({
      ...list,
      data: {
        pages: [{ data: [{ id: "sole" }, { id: "second" }], has_more: false }],
      },
    });
    const mockQuery = query as jest.Mock;
    const settled = mockQuery.getMockImplementation()!();
    const { result, rerender } = renderHook(() => useWaveCompetitionsTab(wave));
    expect(result.current.hideCompetitionsTab).toBe(false);
    mockQuery.mockReturnValue({
      ...settled,
      isSuccess: false,
      isError: true,
      error: { status: 429 },
    });
    rerender();
    expect(result.current.hideCompetitionsTab).toBe(false);
    expect(result.current.defaultCompetitionId).toBe("sole");
  }
);

it.each([401, 403, 404])(
  "does not retain a cached default ID after an access rejection (%s)",
  (status) => {
    configureSingleCompetition();
    const selection = (
      useDefaultCompetition as jest.Mock
    ).getMockImplementation()!();
    (useDefaultCompetition as jest.Mock).mockReturnValue({
      ...selection,
      isSuccess: false,
      isError: true,
      error: { status },
    });
    const { result } = renderHook(() => useWaveCompetitionsTab(wave));
    expect(result.current.defaultCompetitionId).toBeNull();
    expect(result.current.hideCompetitionsTab).toBe(true);
  }
);

it.each([
  ["permissions", useCompetitionHub],
  ["competition list", useCompetitionList],
] as const)(
  "hides cached collection records when %s rejects access",
  (_name, query) => {
    configureSingleCompetition();
    const list = (useCompetitionList as jest.Mock).getMockImplementation()!();
    (useCompetitionList as jest.Mock).mockReturnValue({
      ...list,
      data: {
        pages: [{ data: [{ id: "sole" }, { id: "second" }], has_more: false }],
      },
    });
    const mockQuery = query as jest.Mock;
    const settled = mockQuery.getMockImplementation()!();
    const { result, rerender } = renderHook(() => useWaveCompetitionsTab(wave));
    expect(result.current.hideCompetitionsTab).toBe(false);
    mockQuery.mockReturnValue({
      ...settled,
      isSuccess: false,
      isError: true,
      error: { status: 403 },
    });
    rerender();
    expect(result.current.hideCompetitionsTab).toBe(true);
  }
);

it("hides the collection before administrator rights or multiple records are known", () => {
  configureSingleCompetition();
  (useCompetitionHub as jest.Mock).mockReturnValue({ isPending: true });
  (useCompetitionList as jest.Mock).mockReturnValue({ isPending: true });
  const { result } = renderHook(() => useWaveCompetitionsTab(wave));
  expect(result.current.hideCompetitionsTab).toBe(true);
  expect(result.current.isPending).toBe(true);
});

it("shows the collection for an established administrator without visible records", () => {
  configureSingleCompetition();
  (useCompetitionHub as jest.Mock).mockReturnValue({
    data: { permissions: { administer: true, create_competition: true } },
  });
  (useCompetitionList as jest.Mock).mockReturnValue({ isPending: true });
  const { result } = renderHook(() => useWaveCompetitionsTab(wave));
  expect(result.current.hideCompetitionsTab).toBe(false);
});

it("keeps collection hidden for a non-admin with creation rights and one record", () => {
  configureSingleCompetition();
  (useCompetitionHub as jest.Mock).mockReturnValue({
    data: { permissions: { administer: false, create_competition: true } },
  });
  const { result } = renderHook(() => useWaveCompetitionsTab(wave));
  expect(result.current.hideCompetitionsTab).toBe(true);
});

it("reveals an incomplete collection as soon as two distinct records are known", () => {
  configureSingleCompetition();
  const fetchNextPage = jest.fn();
  (useCompetitionList as jest.Mock).mockImplementation((_waveId, filter) => ({
    hasNextPage: true,
    isFetching: false,
    fetchNextPage,
    data: {
      pages: [{ data: [{ id: "sole" }, { id: "second" }], has_more: true }],
    },
    isError: filter === "all",
  }));
  const { result } = renderHook(() => useWaveCompetitionsTab(wave));
  expect(result.current.hideCompetitionsTab).toBe(false);
  expect(result.current.isPending).toBe(false);
  expect(fetchNextPage).toHaveBeenCalledTimes(1);
});
