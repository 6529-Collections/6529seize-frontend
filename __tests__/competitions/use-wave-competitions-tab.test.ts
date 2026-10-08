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
  "shows the competitions tab for $canCreate / $visibleCount / $enabled",
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
  { name: "hub refreshing", hub: { isFetching: true } },
  { name: "default loading", selection: { isSuccess: false } },
  { name: "default refreshing", selection: { isFetching: true } },
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
  { name: "count refreshing", list: { isFetching: true } },
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
    expect(result.current.hideCompetitionsTab).toBe(Boolean(auth));
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
