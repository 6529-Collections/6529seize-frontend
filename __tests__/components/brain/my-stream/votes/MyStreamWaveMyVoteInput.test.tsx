import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import MyStreamWaveMyVoteInput from "@/components/brain/my-stream/votes/MyStreamWaveMyVoteInput";
import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
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
  context_profile_context: { rating: 0, min_rating: 0, max_rating: 10 },
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

  it("shows max votes from context", () => {
    const dropWithRating = {
      ...drop,
      context_profile_context: { rating: 2, min_rating: 0, max_rating: 10 },
    };
    render(<MyStreamWaveMyVoteInput drop={dropWithRating} />, { wrapper });
    expect(screen.getByText(/Max\s*10/)).toBeInTheDocument();
    expect(screen.queryByText(/^Available/)).not.toBeInTheDocument();
  });

  it("keeps max visible with negative current rating", () => {
    const dropWithNegativeRating = {
      ...drop,
      context_profile_context: { rating: -2, min_rating: -10, max_rating: 10 },
    };
    render(<MyStreamWaveMyVoteInput drop={dropWithNegativeRating} />, {
      wrapper,
    });
    expect(screen.getByText(/Max\s*10/)).toBeInTheDocument();
    expect(screen.queryByText(/^Available/)).not.toBeInTheDocument();
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
    expect(screen.getByText(/Max\s*10/)).toBeInTheDocument();
    expect(screen.queryByText(/^Available/)).not.toBeInTheDocument();
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["DROPS_LEADERBOARD"],
    });
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
    expect(screen.getByText(/Max\s*10/)).toBeInTheDocument();
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
    expect(screen.getByText(/Max\s*9/)).toBeInTheDocument();
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

    await waitFor(() =>
      expect(screen.getByText(/Max\s*10/)).toBeInTheDocument()
    );
    expect(screen.queryByText(/^Available/)).not.toBeInTheDocument();
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("5");

    const serverUpdatedDrop = {
      ...drop,
      context_profile_context: { rating: 6, min_rating: 0, max_rating: 9 },
    };
    rerender(<MyStreamWaveMyVoteInput drop={serverUpdatedDrop} />);

    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("6");
    expect(screen.getByText(/Max\s*9/)).toBeInTheDocument();
    expect(screen.queryByText(/^Available/)).not.toBeInTheDocument();
  });
});
