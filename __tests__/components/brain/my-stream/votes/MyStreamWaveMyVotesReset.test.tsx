import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import MyStreamWaveMyVotesReset from "@/components/brain/my-stream/votes/MyStreamWaveMyVotesReset";
import { AuthContext } from "@/components/auth/Auth";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMutation, useQueryClient } from "@tanstack/react-query";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));
jest.mock(
  "@/components/brain/my-stream/votes/MyStreamWaveMyVotesResetProgress",
  () => (p: any) => (
    <div
      data-testid="progress"
      data-is-resetting={String(p.isResetting)}
      data-reset-progress={String(p.resetProgress)}
      data-total-count={String(p.totalCount)}
    />
  )
);
jest.mock("@/components/utils/button/SecondaryButton", () => (p: any) => (
  <button onClick={p.onClicked} disabled={p.disabled}>
    {p.children}
  </button>
));
jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(async () => ({})),
}));

const useMutationMock = useMutation as jest.Mock;
const useQueryClientMock = useQueryClient as jest.Mock;
const invalidateQueries = jest.fn().mockResolvedValue(undefined);
const setQueriesData = jest.fn();

const auth = { setToast: jest.fn(), connectedProfile: { handle: "me" } } as any;
const rqContext = { onDropRateChange: jest.fn() } as any;

beforeEach(() => {
  jest.clearAllMocks();
  useQueryClientMock.mockReturnValue({ invalidateQueries, setQueriesData });
  useMutationMock.mockImplementation((config: any) => ({
    mutateAsync: async (param: any) => {
      const result = { id: param.dropId, wave: { id: "wave-1" } };
      // Simulate the onSuccess callback
      if (config.onSuccess) {
        config.onSuccess(result);
      }
      return result;
    },
  }));
});

test("returns null when no drops", () => {
  const { container } = render(
    <AuthContext.Provider value={auth}>
      <ReactQueryWrapperContext.Provider value={rqContext}>
        <MyStreamWaveMyVotesReset
          waveId="wave-1"
          haveDrops={false}
          selected={new Set()}
          allItemsSelected={false}
          onToggleSelectAll={jest.fn()}
          removeSelected={jest.fn()}
          onResettingChange={jest.fn()}
        />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
  expect(container.firstChild).toBeNull();
});

test("returns null when voting is closed", () => {
  const { container } = render(
    <AuthContext.Provider value={auth}>
      <ReactQueryWrapperContext.Provider value={rqContext}>
        <MyStreamWaveMyVotesReset
          waveId="wave-1"
          haveDrops
          isVotingClosed={true}
          selected={new Set(["a"])}
          allItemsSelected={false}
          onToggleSelectAll={jest.fn()}
          removeSelected={jest.fn()}
          onResettingChange={jest.fn()}
        />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
  expect(container.firstChild).toBeNull();
});

test("shows wave available votes when provided", () => {
  render(
    <AuthContext.Provider value={auth}>
      <ReactQueryWrapperContext.Provider value={rqContext}>
        <MyStreamWaveMyVotesReset
          waveId="wave-1"
          haveDrops
          availableVotes={10463}
          selected={new Set()}
          allItemsSelected={false}
          onToggleSelectAll={jest.fn()}
          removeSelected={jest.fn()}
          onResettingChange={jest.fn()}
        />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );

  expect(screen.getByText(/Available in wave/)).toBeInTheDocument();
  expect(screen.getByText("10,463")).toBeInTheDocument();
});

test("hides available votes when missing", () => {
  render(
    <AuthContext.Provider value={auth}>
      <ReactQueryWrapperContext.Provider value={rqContext}>
        <MyStreamWaveMyVotesReset
          waveId="wave-1"
          haveDrops
          selected={new Set()}
          allItemsSelected={false}
          onToggleSelectAll={jest.fn()}
          removeSelected={jest.fn()}
          onResettingChange={jest.fn()}
        />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );

  expect(screen.queryByText(/Available/)).not.toBeInTheDocument();
});

test("resets votes for selected drops", async () => {
  const removeSelected = jest.fn();
  const onResettingChange = jest.fn();
  const selected = new Set(["a", "b"]);
  render(
    <AuthContext.Provider value={auth}>
      <ReactQueryWrapperContext.Provider value={rqContext}>
        <MyStreamWaveMyVotesReset
          waveId="wave-1"
          haveDrops
          availableVotes={7}
          selected={selected}
          allItemsSelected={false}
          onToggleSelectAll={jest.fn()}
          removeSelected={removeSelected}
          onResettingChange={onResettingChange}
        />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );
  fireEvent.click(screen.getAllByRole("button")[1]);

  await waitFor(() =>
    expect(onResettingChange).toHaveBeenNthCalledWith(2, false)
  );

  expect(onResettingChange).toHaveBeenNthCalledWith(1, true);
  expect(onResettingChange).toHaveBeenCalledTimes(2);
  expect(removeSelected).toHaveBeenCalledTimes(2);
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: [QueryKey.WAVE, { wave_id: "wave-1" }],
  });
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: [QueryKey.WAVE_DECISIONS, { waveId: "wave-1" }],
  });
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: [QueryKey.DROPS_LEADERBOARD, { waveId: "wave-1" }],
    refetchType: "none",
  });
  expect(invalidateQueries).not.toHaveBeenCalledWith({
    queryKey: [QueryKey.DROPS, { waveId: "wave-1" }],
  });
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: [QueryKey.DROP_VOTERS, { dropId: "a" }],
  });
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: [QueryKey.DROP_VOTE_LOGS, { dropId: "b" }],
  });
  // onDropRateChange is handled by React Query elsewhere, not directly by this component
});

test("cleans up and invalidates once when a later reset fails", async () => {
  useMutationMock.mockImplementation((config: any) => {
    let callCount = 0;

    return {
      mutateAsync: async (param: any) => {
        callCount += 1;

        if (callCount === 2) {
          const error = new Error("API Error");
          config.onError?.(error);
          throw error;
        }

        const result = { id: param.dropId, wave: { id: "wave-1" } };
        config.onSuccess?.(result);
        return result;
      },
    };
  });

  const removeSelected = jest.fn();
  const onResettingChange = jest.fn();
  const selected = new Set(["a", "b"]);

  render(
    <AuthContext.Provider value={auth}>
      <ReactQueryWrapperContext.Provider value={rqContext}>
        <MyStreamWaveMyVotesReset
          waveId="wave-1"
          haveDrops
          availableVotes={7}
          selected={selected}
          allItemsSelected={false}
          onToggleSelectAll={jest.fn()}
          removeSelected={removeSelected}
          onResettingChange={onResettingChange}
        />
      </ReactQueryWrapperContext.Provider>
    </AuthContext.Provider>
  );

  fireEvent.click(screen.getAllByRole("button")[1]);

  await waitFor(() =>
    expect(onResettingChange).toHaveBeenNthCalledWith(2, false)
  );

  expect(removeSelected).toHaveBeenCalledTimes(1);
  expect(onResettingChange).toHaveBeenCalledTimes(2);
  expect(removeSelected).toHaveBeenCalledWith("a");
  expect(removeSelected).not.toHaveBeenCalledWith("b");
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: [QueryKey.WAVE, { wave_id: "wave-1" }],
  });
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: [QueryKey.WAVE_DECISIONS, { waveId: "wave-1" }],
  });
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: [QueryKey.DROPS_LEADERBOARD, { waveId: "wave-1" }],
    refetchType: "none",
  });
  expect(invalidateQueries).not.toHaveBeenCalledWith({
    queryKey: [QueryKey.DROPS, { waveId: "wave-1" }],
  });
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: [QueryKey.DROP_VOTERS, { dropId: "a" }],
  });
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: [QueryKey.DROP_VOTE_LOGS, { dropId: "a" }],
  });
  expect(screen.getByTestId("progress")).toHaveAttribute(
    "data-is-resetting",
    "false"
  );
  expect(screen.getByTestId("progress")).toHaveAttribute(
    "data-reset-progress",
    "0"
  );
  expect(screen.getByTestId("progress")).toHaveAttribute(
    "data-total-count",
    "0"
  );
});
