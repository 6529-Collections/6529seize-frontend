import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import DropListItemRateGiveSubmit from "@/components/drops/view/item/rate/give/DropListItemRateGiveSubmit";
import { AuthContext } from "@/components/auth/Auth";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { DropVoteState } from "@/hooks/drops/types";
import { useMyStream } from "@/contexts/wave/MyStreamContext";

jest.useFakeTimers();

jest.mock("next/dynamic", () => {
  return function dynamic(importFunc: any) {
    const Component = (props: any) => {
      const mod = require("@/components/drops/view/item/rate/give/clap/DropListItemRateGiveClap");
      const Actual = mod.default || mod;
      return <Actual {...props} />;
    };
    return Component;
  };
});

jest.mock(
  "@/components/drops/view/item/rate/give/clap/DropListItemRateGiveClap",
  () => (props: any) => (
    <button data-testid="clap" onClick={props.onSubmit}>
      clap
    </button>
  )
);

jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: jest.fn(),
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(() => ({
    applyOptimisticDropUpdate: jest.fn(() => ({ rollback: jest.fn() })),
  })),
}));

const mutateAsync = jest.fn();
const useMutationMock = useMutation as jest.Mock;
const useQueryClientMock = useQueryClient as jest.Mock;
const invalidateQueries = jest.fn().mockResolvedValue(undefined);
const setQueriesData = jest.fn();
(useDropInteractionRules as jest.Mock).mockReturnValue({
  voteState: DropVoteState.CAN_VOTE,
});
(useMyStream as jest.Mock).mockReturnValue({
  applyOptimisticDropUpdate: jest.fn(() => ({ rollback: jest.fn() })),
});

const auth = {
  requestAuth: jest.fn().mockResolvedValue({ success: true }),
  setToast: jest.fn(),
  connectedProfile: { handle: "me" },
} as any;
const wrapper = ({ children }: any) => (
  <AuthContext.Provider value={auth}>
    <ReactQueryWrapperContext.Provider value={{ onDropRateChange: jest.fn() }}>
      {children}
    </ReactQueryWrapperContext.Provider>
  </AuthContext.Provider>
);

const drop: any = {
  id: "1",
  wave: { id: "wave-1" },
  context_profile_context: { rating: 0 },
};

describe("DropListItemRateGiveSubmit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.requestAuth.mockResolvedValue({ success: true });
    useQueryClientMock.mockReturnValue({ invalidateQueries, setQueriesData });
    useMutationMock.mockImplementation((config: any) => ({
      mutateAsync: async (variables: any) => {
        mutateAsync(variables);
        config.onSuccess?.(drop, variables);
        config.onSettled?.();
        return {};
      },
    }));
  });

  it("debounces submit and calls mutation", async () => {
    render(
      <DropListItemRateGiveSubmit
        rate={1}
        drop={drop}
        canVote
        onSuccessfulRateChange={() => {}}
      />,
      { wrapper }
    );
    fireEvent.click(screen.getByTestId("clap"));

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    expect(auth.requestAuth).toHaveBeenCalled();
    expect(mutateAsync).toHaveBeenCalled();
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
      queryKey: [QueryKey.DROP_VOTERS, { dropId: "1" }],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QueryKey.DROP_VOTE_LOGS, { dropId: "1" }],
    });
  });

  it("does not invalidate approval status when auth fails", async () => {
    auth.requestAuth.mockResolvedValueOnce({ success: false });
    render(
      <DropListItemRateGiveSubmit
        rate={1}
        drop={drop}
        canVote
        onSuccessfulRateChange={() => {}}
      />,
      { wrapper }
    );
    fireEvent.click(screen.getByTestId("clap"));

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    expect(auth.requestAuth).toHaveBeenCalled();
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it("does not invalidate approval status when the rate update fails", async () => {
    useMutationMock.mockImplementation((config: any) => ({
      mutateAsync: async (variables: any) => {
        mutateAsync(variables);
        config.onError?.(new Error("API Error"));
        config.onSettled?.();
        return {};
      },
    }));

    render(
      <DropListItemRateGiveSubmit
        rate={1}
        drop={drop}
        canVote
        onSuccessfulRateChange={() => {}}
      />,
      { wrapper }
    );
    fireEvent.click(screen.getByTestId("clap"));

    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    expect(mutateAsync).toHaveBeenCalled();
    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});
