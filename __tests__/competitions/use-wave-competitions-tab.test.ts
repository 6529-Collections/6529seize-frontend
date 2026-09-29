import { renderHook } from "@testing-library/react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { isMultiCompetitionEnabled } from "@/helpers/competition.helpers";
import {
  useCompetitionHub,
  useCompetitionList,
} from "@/hooks/competitions/useCompetitionQueries";
import { useWaveCompetitionsTab } from "@/hooks/competitions/useWaveCompetitionsTab";
import { render } from "@testing-library/react";
import { createElement } from "react";
import { TabCountBadge } from "@/components/common/TabCountBadge";

jest.mock("@/helpers/competition.helpers", () => ({
  isMultiCompetitionEnabled: jest.fn(),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionHub: jest.fn(),
  useCompetitionList: jest.fn(),
}));

const wave = { id: "wave", chat: { scope: { group: null } } } as ApiWave;

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
