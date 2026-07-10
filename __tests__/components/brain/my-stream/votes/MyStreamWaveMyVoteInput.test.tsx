import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import MyStreamWaveMyVoteInput from "@/components/brain/my-stream/votes/MyStreamWaveMyVoteInput";
import { AuthContext } from "@/components/auth/Auth";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMutation, useQueryClient } from "@tanstack/react-query";

jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

const useMutationMock = useMutation as jest.Mock;
const useQueryClientMock = useQueryClient as jest.Mock;
const mutateAsync = jest.fn();
const invalidateQueries = jest.fn();

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
  id: "d1",
  wave: { id: "wave-1", voting_credit_type: ApiWaveCreditType.Tdh },
  context_profile_context: { rating: 0, min_rating: 0, max_rating: 10 },
};

const expectMaxVotes = (value: string, label = "Max for wave") => {
  const maxLabel = screen.getByText((_, element) => {
    return (
      element?.tagName.toLowerCase() === "p" &&
      element.textContent?.replace(/\s+/g, " ").trim() === `${label} ${value}`
    );
  });

  expect(maxLabel).toBeInTheDocument();
};

describe("MyStreamWaveMyVoteInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useQueryClientMock.mockReturnValue({ invalidateQueries });
    useMutationMock.mockImplementation((config: any) => ({
      mutateAsync: async (variables: { rate: number }) => {
        mutateAsync(variables);
        const response = {
          id: "d1",
          context_profile_context: {
            rating: variables.rate,
            min_rating: 0,
            max_rating: 10,
          },
        };
        config.onSuccess?.(response, variables);
        return response;
      },
    }));
  });

  it("shows max votes from context with default wave scope", () => {
    const dropWithRating = {
      ...drop,
      context_profile_context: { rating: 2, min_rating: 0, max_rating: 10 },
    };
    render(<MyStreamWaveMyVoteInput drop={dropWithRating} />, { wrapper });
    expectMaxVotes("10");
    expect(screen.queryByText(/^Available/)).not.toBeInTheDocument();
  });

  it("shows max per drop for drop-scoped voting", () => {
    render(
      <MyStreamWaveMyVoteInput
        drop={{
          ...drop,
          wave: {
            ...drop.wave,
            voting_credit_scope: ApiWaveCreditScope.Drop,
          },
        }}
      />,
      { wrapper }
    );

    expectMaxVotes("10", "Max per drop");
    expect(screen.queryByText("Max for wave 10")).not.toBeInTheDocument();
  });

  it("uses the wave voting credit label in the input", () => {
    render(
      <MyStreamWaveMyVoteInput
        drop={{
          ...drop,
          wave: { id: "wave-1", voting_credit_type: ApiWaveCreditType.Rep },
        }}
      />,
      { wrapper }
    );

    expect(screen.getByText("Rep")).toBeInTheDocument();
    expect(screen.queryByText("TDH")).not.toBeInTheDocument();
  });

  it("keeps max visible with negative current rating", () => {
    const dropWithNegativeRating = {
      ...drop,
      context_profile_context: { rating: -2, min_rating: -10, max_rating: 10 },
    };
    render(<MyStreamWaveMyVoteInput drop={dropWithNegativeRating} />, {
      wrapper,
    });
    expectMaxVotes("10");
    expect(screen.queryByText(/^Available/)).not.toBeInTheDocument();
  });

  it("keeps an unchanged legacy negative vote when negative votes are forbidden", () => {
    const dropWithLegacyNegativeRating = {
      ...drop,
      wave: { ...drop.wave, forbid_negative_votes: true },
      context_profile_context: { rating: -5, min_rating: -10, max_rating: 10 },
    };
    render(<MyStreamWaveMyVoteInput drop={dropWithLegacyNegativeRating} />, {
      wrapper,
    });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    const submitButton = screen.getByRole("button", { name: "Submit vote" });

    expect(input.value).toBe("-5");
    expect(submitButton).toBeDisabled();

    fireEvent.blur(input);
    fireEvent.keyDown(input, { key: "Enter" });

    expect(input.value).toBe("-5");
    expect(auth.requestAuth).not.toHaveBeenCalled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("keeps a dash draft for a legacy negative vote before submitting zero", async () => {
    const dropWithLegacyNegativeRating = {
      ...drop,
      wave: { ...drop.wave, forbid_negative_votes: true },
      context_profile_context: { rating: -5, min_rating: -10, max_rating: 10 },
    };
    render(<MyStreamWaveMyVoteInput drop={dropWithLegacyNegativeRating} />, {
      wrapper,
    });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    const submitButton = screen.getByRole("button", { name: "Submit vote" });

    fireEvent.change(input, { target: { value: "-" } });

    expect(input.value).toBe("-");
    expect(submitButton).toBeDisabled();

    fireEvent.click(submitButton);

    expect(auth.requestAuth).not.toHaveBeenCalled();
    expect(mutateAsync).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "0" } });

    expect(input.value).toBe("0");
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => expect(auth.requestAuth).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith({ rate: 0 });
  });

  it("submits zero when a legacy negative vote is manually changed to zero", async () => {
    const dropWithLegacyNegativeRating = {
      ...drop,
      wave: { ...drop.wave, forbid_negative_votes: true },
      context_profile_context: { rating: -5, min_rating: -10, max_rating: 10 },
    };
    render(<MyStreamWaveMyVoteInput drop={dropWithLegacyNegativeRating} />, {
      wrapper,
    });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    const submitButton = screen.getByRole("button", { name: "Submit vote" });

    fireEvent.change(input, { target: { value: "0" } });

    expect(input.value).toBe("0");
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => expect(auth.requestAuth).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith({ rate: 0 });
  });

  it("clamps typed negative values to zero when negative votes are forbidden", () => {
    const dropWithPositiveRating = {
      ...drop,
      wave: { ...drop.wave, forbid_negative_votes: true },
      context_profile_context: { rating: 4, min_rating: -10, max_rating: 10 },
    };
    render(<MyStreamWaveMyVoteInput drop={dropWithPositiveRating} />, {
      wrapper,
    });

    const input = screen.getByRole("textbox") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "-3" } });

    expect(input.value).toBe("0");
  });

  it("keeps a positive API minimum when negative votes are forbidden", async () => {
    const dropWithPositiveMinimum = {
      ...drop,
      wave: { ...drop.wave, forbid_negative_votes: true },
      context_profile_context: { rating: 20, min_rating: 10, max_rating: 100 },
    };
    render(<MyStreamWaveMyVoteInput drop={dropWithPositiveMinimum} />, {
      wrapper,
    });

    const input = screen.getByRole("textbox") as HTMLInputElement;
    const submitButton = screen.getByRole("button", { name: "Submit vote" });

    fireEvent.change(input, { target: { value: "5" } });

    expect(input.value).toBe("10");
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => expect(auth.requestAuth).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith({ rate: 10 });
  });

  it("clamps vote value within limits and submits on click", async () => {
    render(<MyStreamWaveMyVoteInput drop={drop} />, { wrapper });
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "15" } });
    expect((input as HTMLInputElement).value).toBe("10");

    fireEvent.click(screen.getByRole("button", { name: "Submit vote" }));
    await waitFor(() => expect(auth.requestAuth).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith({ rate: 10 });
  });

  it("does not submit when voting is closed", () => {
    render(<MyStreamWaveMyVoteInput drop={drop} isVotingClosed={true} />, {
      wrapper,
    });

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();

    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Submit vote" }));

    expect(auth.requestAuth).not.toHaveBeenCalled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("updates input value immediately after successful vote", async () => {
    const dropWithRating = {
      ...drop,
      context_profile_context: { rating: 2, min_rating: 0, max_rating: 10 },
    };
    render(<MyStreamWaveMyVoteInput drop={dropWithRating} />, { wrapper });

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit vote" }));

    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("5")
    );
    expectMaxVotes("10");
    expect(screen.queryByText(/^Available/)).not.toBeInTheDocument();
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE, { wave_id: "wave-1" }],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE_DECISIONS, { waveId: "wave-1" }],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QueryKey.DROPS_LEADERBOARD, { waveId: "wave-1" }],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QueryKey.DROPS, { waveId: "wave-1" }],
    });
  });

  it("does not invalidate approval status when auth fails", async () => {
    auth.requestAuth.mockResolvedValueOnce({ success: false });

    render(<MyStreamWaveMyVoteInput drop={drop} />, { wrapper });

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit vote" }));

    await waitFor(() => expect(auth.requestAuth).toHaveBeenCalled());

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it("does not invalidate approval status when the vote update fails", async () => {
    useMutationMock.mockImplementation((config: any) => ({
      mutateAsync: async (variables: { rate: number }) => {
        mutateAsync(variables);
        const error = new Error("API Error");
        config.onError?.(error);
        throw error;
      },
    }));

    render(<MyStreamWaveMyVoteInput drop={drop} />, { wrapper });

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit vote" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ rate: 5 }));

    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it("falls back to submitted value when response context is missing", async () => {
    useMutationMock.mockImplementation((config: any) => ({
      mutateAsync: async (variables: { rate: number }) => {
        mutateAsync(variables);
        config.onSuccess?.({ id: "d1" }, variables);
        return { id: "d1" };
      },
    }));

    const dropWithRating = {
      ...drop,
      context_profile_context: { rating: 2, min_rating: 0, max_rating: 10 },
    };
    render(<MyStreamWaveMyVoteInput drop={dropWithRating} />, { wrapper });

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit vote" }));

    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("4")
    );
    expectMaxVotes("10");
    expect(screen.queryByText(/^Available/)).not.toBeInTheDocument();
  });

  it("resets draft value when live vote context changes", () => {
    const dropWithRating = {
      ...drop,
      context_profile_context: { rating: 2, min_rating: 0, max_rating: 10 },
    };

    const { rerender } = render(
      <MyStreamWaveMyVoteInput drop={dropWithRating} />,
      {
        wrapper,
      }
    );

    const input = screen.getByRole("textbox");
    expect((input as HTMLInputElement).value).toBe("2");

    fireEvent.change(input, { target: { value: "7" } });
    expect((input as HTMLInputElement).value).toBe("7");

    const updatedDrop = {
      ...drop,
      context_profile_context: { rating: 4, min_rating: 0, max_rating: 9 },
    };
    rerender(<MyStreamWaveMyVoteInput drop={updatedDrop} />);

    const rerenderedInput = screen.getByRole("textbox");
    expect((rerenderedInput as HTMLInputElement).value).toBe("4");
    expectMaxVotes("9");
    expect(screen.queryByText(/^Available/)).not.toBeInTheDocument();
  });

  it("uses optimistic value, then follows updated parent context", async () => {
    const dropWithRating = {
      ...drop,
      context_profile_context: { rating: 2, min_rating: 0, max_rating: 10 },
    };

    const { rerender } = render(
      <MyStreamWaveMyVoteInput drop={dropWithRating} />,
      {
        wrapper,
      }
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit vote" }));

    await waitFor(() => expectMaxVotes("10"));
    expect(screen.queryByText(/^Available/)).not.toBeInTheDocument();
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("5");

    const serverUpdatedDrop = {
      ...drop,
      context_profile_context: { rating: 6, min_rating: 0, max_rating: 9 },
    };
    rerender(<MyStreamWaveMyVoteInput drop={serverUpdatedDrop} />);

    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("6");
    expectMaxVotes("9");
    expect(screen.queryByText(/^Available/)).not.toBeInTheDocument();
  });

  it("explains an unchanged existing vote with zero change", () => {
    const onExplainVote = jest.fn();
    const dropWithRating = {
      ...drop,
      context_profile_context: { rating: 4, min_rating: 0, max_rating: 10 },
    };

    render(
      <MyStreamWaveMyVoteInput
        drop={dropWithRating}
        onExplainVote={onExplainVote}
      />,
      { wrapper }
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Reply with vote rationale" })
    );

    expect(onExplainVote).toHaveBeenCalledWith(4, 0);
  });

  it("explains a newly updated vote with its applied change", async () => {
    const onExplainVote = jest.fn();
    const dropWithRating = {
      ...drop,
      context_profile_context: { rating: 2, min_rating: 0, max_rating: 10 },
    };

    render(
      <MyStreamWaveMyVoteInput
        drop={dropWithRating}
        onExplainVote={onExplainVote}
      />,
      { wrapper }
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit vote" }));

    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("5")
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Reply with vote rationale" })
    );

    expect(onExplainVote).toHaveBeenCalledWith(5, 3);
  });
});
