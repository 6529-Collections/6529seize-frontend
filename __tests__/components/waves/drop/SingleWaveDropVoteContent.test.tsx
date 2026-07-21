import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SingleWaveDropVoteContent } from "@/components/waves/drop/SingleWaveDropVoteContent";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { SingleWaveDropVoteSubmissionMode } from "@/components/waves/drop/SingleWaveDropVote.types";

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: ({ flip }: any) => (
    <span data-testid="font-awesome-icon" data-flip={flip} />
  ),
}));
jest.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutateAsync: jest.fn() }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: undefined,
    isSafeWallet: false,
  }),
}));
jest.mock("@/components/waves/drop/SingleWaveDropVoteSubmit", () => {
  return React.forwardRef(function MockSubmit(props: any, ref: any) {
    React.useImperativeHandle(ref, () => ({ handleClick: jest.fn() }));
    return (
      <div
        data-testid="vote-submit"
        data-has-request-started={String(
          typeof props.onVoteRequestStarted === "function"
        )}
        data-submission-mode={props.submissionMode}
        data-submit-label={props.submitLabelOverride ?? ""}
      >
        <button
          onClick={() => {
            if (props.submitBlockReason) {
              return;
            }

            props.onVoteApplied?.({
              ...props.drop,
              context_profile_context: props.drop.context_profile_context
                ? {
                    ...props.drop.context_profile_context,
                    rating: props.newRating,
                  }
                : props.drop.context_profile_context,
            });
            props.onVoteSuccess?.();
          }}
        >
          Submit Vote
        </button>
        <span data-testid="new-rating">{String(props.newRating)}</span>
        <span data-testid="submit-block-reason">
          {props.submitBlockReason ?? ""}
        </span>
      </div>
    );
  });
});
jest.mock("@/components/waves/drop/SingleWaveDropVoteSlider", () => ({
  __esModule: true,
  default: (props: any) => {
    const numericVoteValue = Number(props.voteValue);
    const sliderValue = Number.isFinite(numericVoteValue)
      ? Math.min(Math.max(numericVoteValue, props.minValue), props.maxValue)
      : props.minValue;

    return (
      <div data-testid="vote-slider">
        <input
          data-testid="slider-input"
          type="range"
          min={props.minValue}
          max={props.maxValue}
          value={sliderValue}
          onClick={(e) =>
            props.onValueAccepted?.(Number(e.currentTarget.value))
          }
          onChange={(e) => props.setVoteValue(Number(e.target.value))}
        />
        <span data-testid="slider-value">{props.voteValue}</span>
        <span data-testid="slider-credit-type">{props.label}</span>
      </div>
    );
  },
}));
jest.mock("@/components/waves/drop/SingleWaveDropVoteInput", () => ({
  __esModule: true,
  SingleWaveDropVoteInput: (props: any) => (
    <div data-testid="vote-input">
      <input
        data-testid="numeric-input"
        type="text"
        min={props.minValue}
        max={props.maxValue}
        value={props.voteValue}
        onChange={(e) => props.setVoteValue(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && props.onSubmit()}
      />
      <span data-testid="input-credit-type">{props.label}</span>
    </div>
  ),
}));
jest.mock("@/components/waves/drop/SingleWaveDropVoteStats", () => ({
  __esModule: true,
  SingleWaveDropVoteStats: (props: any) => (
    <div data-testid="vote-stats">
      <span data-testid="current-rating">{props.currentRating}</span>
      <span data-testid="max-rating">{props.maxRating}</span>
      <span data-testid="stats-credit-type">{props.label}</span>
      <span data-testid="stats-credit-scope">{props.creditScope}</span>
    </div>
  ),
}));

export enum SingleWaveDropVoteSize {
  NORMAL = "NORMAL",
  COMPACT = "COMPACT",
  MINI = "MINI",
}

describe("SingleWaveDropVoteContent", () => {
  const mockOnVoteSuccess = jest.fn();

  const createMockDrop = (overrides: Partial<ApiDrop> = {}): ApiDrop =>
    ({
      id: "drop-123",
      serial_no: 1,
      rank: 5,
      wave: {
        id: "wave-123",
        name: "Test Wave",
        voting_credit_type: ApiWaveCreditType.Tdh,
        authenticated_user_eligible_to_chat: true,
      } as any,
      context_profile_context: { rating: 50, min_rating: 0, max_rating: 100 },
      parts: [],
      referenced_nfts: [],
      mentioned_users: [],
      metadata: [],
      author: { id: "author-123", handle: "testauthor" } as any,
      created_at: Date.now(),
      updated_at: Date.now(),
      ...overrides,
    }) as ApiDrop;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all main components", () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("vote-submit")).toBeInTheDocument();
    expect(screen.getByTestId("vote-slider")).toBeInTheDocument();
    expect(screen.getByTestId("vote-stats")).toBeInTheDocument();
    expect(screen.getByTestId("stats-credit-scope")).toHaveTextContent(
      ApiWaveCreditScope.Wave
    );
    expect(
      screen.getByRole("button", { name: /numeric/i })
    ).toBeInTheDocument();
  });

  it("allows Vote with reply to be turned on before editing", () => {
    render(
      <SingleWaveDropVoteContent
        drop={createMockDrop()}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    const rationaleSwitch = screen.getByRole("switch", {
      name: /vote with reply/i,
    });
    expect(rationaleSwitch).toHaveAccessibleName("Vote with reply");
    expect(rationaleSwitch).not.toBeChecked();
    expect(rationaleSwitch).not.toBeDisabled();
    expect(rationaleSwitch).toHaveAttribute("aria-expanded", "false");
    expect(rationaleSwitch).toHaveAccessibleDescription(
      /Editing this text turns on Vote with reply/i
    );
    expect(
      screen.queryByRole("textbox", { name: /optional rationale reply/i })
    ).not.toBeInTheDocument();

    fireEvent.click(rationaleSwitch);

    expect(rationaleSwitch).toBeChecked();
    expect(rationaleSwitch).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("textbox", { name: /optional rationale reply/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("vote-submit")).toHaveAttribute(
      "data-submit-label",
      "Vote + reply"
    );
  });

  it("preserves a rationale draft when the field is hidden and shown again", () => {
    render(
      <SingleWaveDropVoteContent
        drop={createMockDrop()}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    const rationaleSwitch = screen.getByRole("switch", {
      name: /vote with reply/i,
    });
    fireEvent.click(rationaleSwitch);

    const rationaleTextarea = screen.getByRole("textbox", {
      name: /optional rationale reply/i,
    });

    fireEvent.change(rationaleTextarea, {
      target: {
        value: `${(rationaleTextarea as HTMLTextAreaElement).value}Reason`,
      },
    });
    expect(rationaleSwitch).toBeChecked();

    fireEvent.click(rationaleSwitch);
    expect(rationaleSwitch).not.toBeChecked();
    expect(
      screen.queryByRole("textbox", { name: /optional rationale reply/i })
    ).not.toBeInTheDocument();

    fireEvent.click(rationaleSwitch);
    expect(
      (
        screen.getByRole("textbox", {
          name: /optional rationale reply/i,
        }) as HTMLTextAreaElement
      ).value
    ).toContain("Reason");
  });

  it("blocks an enabled reply after all prefilled text is deleted", () => {
    render(
      <SingleWaveDropVoteContent
        drop={createMockDrop()}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    const rationaleSwitch = screen.getByRole("switch", {
      name: "Vote with reply",
    });
    fireEvent.click(rationaleSwitch);

    const rationaleTextarea = screen.getByRole("textbox", {
      name: /optional rationale reply/i,
    });
    fireEvent.change(rationaleTextarea, { target: { value: "" } });

    expect(rationaleSwitch).toBeChecked();
    expect(screen.getByTestId("submit-block-reason")).toHaveTextContent(
      "Add rationale text or turn Vote with reply off."
    );
    expect(rationaleTextarea).toHaveAccessibleDescription(
      /Add rationale text or turn Vote with reply off/i
    );
    expect(rationaleSwitch).toHaveAccessibleDescription(
      /Add rationale text or turn Vote with reply off/i
    );
  });

  it("hides rationale controls when the voter cannot reply in the wave", () => {
    const drop = createMockDrop({
      wave: {
        id: "wave-123",
        name: "Test Wave",
        voting_credit_type: ApiWaveCreditType.Tdh,
        authenticated_user_eligible_to_chat: false,
      } as any,
    });

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(
      screen.queryByRole("textbox", { name: /optional rationale reply/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("switch", { name: /vote with reply/i })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("vote-submit")).toHaveAttribute(
      "data-submit-label",
      ""
    );
  });

  it("uses confirmed submission mode by default", () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("vote-submit")).toHaveAttribute(
      "data-submission-mode",
      SingleWaveDropVoteSubmissionMode.WAIT_FOR_CONFIRMATION
    );
    expect(screen.getByTestId("vote-submit")).toHaveAttribute(
      "data-has-request-started",
      "false"
    );
  });

  it("passes background submission mode and request-start callback", () => {
    const drop = createMockDrop();
    const onVoteRequestStarted = jest.fn();

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteRequestStarted={onVoteRequestStarted}
        submissionMode={SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH}
      />
    );

    expect(screen.getByTestId("vote-submit")).toHaveAttribute(
      "data-submission-mode",
      SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH
    );
    expect(screen.getByTestId("vote-submit")).toHaveAttribute(
      "data-has-request-started",
      "true"
    );
  });

  it("passes drop-scoped voting power to stats in normal and mini modes", () => {
    const drop = createMockDrop({
      wave: {
        id: "wave-123",
        name: "Test Wave",
        voting_credit_type: ApiWaveCreditType.Tdh,
        voting_credit_scope: ApiWaveCreditScope.Drop,
      } as any,
    });

    const { unmount } = render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("stats-credit-scope")).toHaveTextContent(
      ApiWaveCreditScope.Drop
    );

    unmount();

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.MINI}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("stats-credit-scope")).toHaveTextContent(
      ApiWaveCreditScope.Drop
    );
  });

  it("initializes with current vote value from drop context", () => {
    const drop = createMockDrop({
      context_profile_context: {
        rating: 75,
        min_rating: 0,
        max_rating: 100,
      },
    });

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("slider-value")).toHaveTextContent("75");
    expect(screen.getByTestId("new-rating")).toHaveTextContent("75");
  });

  it("keeps a legacy negative vote while using zero as the effective minimum", () => {
    const drop = createMockDrop({
      context_profile_context: {
        rating: -5,
        min_rating: -10,
        max_rating: 10,
      },
      wave: {
        id: "wave-123",
        name: "Test Wave",
        voting_credit_type: ApiWaveCreditType.Tdh,
        forbid_negative_votes: true,
      } as any,
    });

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("slider-value")).toHaveTextContent("-5");
    expect(screen.getByTestId("slider-input")).toHaveAttribute("min", "0");
    expect(screen.getByTestId("new-rating")).toHaveTextContent("-5");
    expect(screen.getByTestId("submit-block-reason")).toHaveTextContent(
      "Change this vote before submitting."
    );

    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    expect(mockOnVoteSuccess).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /numeric/i }));

    const numericInput = screen.getByTestId("numeric-input");
    expect(numericInput).toHaveAttribute("min", "0");
    expect((numericInput as HTMLInputElement).value).toBe("-5");

    fireEvent.change(numericInput, { target: { value: "0" } });

    expect(screen.getByTestId("new-rating")).toHaveTextContent("0");
    expect(screen.getByTestId("submit-block-reason").textContent).toBe("");

    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    expect(mockOnVoteSuccess).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("current-rating")).toHaveTextContent("0");
  });

  it("keeps a positive API minimum when negative votes are forbidden", () => {
    const drop = createMockDrop({
      context_profile_context: {
        rating: 5,
        min_rating: 10,
        max_rating: 100,
      },
      wave: {
        id: "wave-123",
        name: "Test Wave",
        voting_credit_type: ApiWaveCreditType.Tdh,
        forbid_negative_votes: true,
      } as any,
    });

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("slider-value")).toHaveTextContent("5");
    expect(screen.getByTestId("slider-input")).toHaveAttribute("min", "10");
    expect(screen.getByTestId("new-rating")).toHaveTextContent("5");
    expect(screen.getByTestId("submit-block-reason")).toHaveTextContent(
      "Change this vote before submitting."
    );

    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    expect(mockOnVoteSuccess).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /numeric/i }));

    const numericInput = screen.getByTestId("numeric-input");
    expect(numericInput).toHaveAttribute("min", "10");
    expect((numericInput as HTMLInputElement).value).toBe("5");

    fireEvent.change(numericInput, { target: { value: "7" } });

    expect((numericInput as HTMLInputElement).value).toBe("10");
    expect(screen.getByTestId("new-rating")).toHaveTextContent("10");
    expect(screen.getByTestId("submit-block-reason").textContent).toBe("");

    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    expect(mockOnVoteSuccess).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("current-rating")).toHaveTextContent("10");
  });

  it("accepts the slider boundary for a legacy negative vote", () => {
    const drop = createMockDrop({
      context_profile_context: {
        rating: -5,
        min_rating: -10,
        max_rating: 10,
      },
      wave: {
        id: "wave-123",
        name: "Test Wave",
        voting_credit_type: ApiWaveCreditType.Tdh,
        forbid_negative_votes: true,
      } as any,
    });

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("slider-value")).toHaveTextContent("-5");
    expect(screen.getByTestId("new-rating")).toHaveTextContent("-5");
    expect(screen.getByTestId("submit-block-reason")).toHaveTextContent(
      "Change this vote before submitting."
    );

    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    expect(mockOnVoteSuccess).not.toHaveBeenCalled();

    const sliderInput = screen.getByTestId("slider-input");
    expect((sliderInput as HTMLInputElement).value).toBe("0");

    fireEvent.click(sliderInput);

    expect(screen.getByTestId("new-rating")).toHaveTextContent("0");
    expect(screen.getByTestId("submit-block-reason").textContent).toBe("");

    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    expect(mockOnVoteSuccess).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("current-rating")).toHaveTextContent("0");
  });

  it("accepts the slider boundary for a loaded vote below a positive API minimum", () => {
    const drop = createMockDrop({
      context_profile_context: {
        rating: 5,
        min_rating: 10,
        max_rating: 100,
      },
      wave: {
        id: "wave-123",
        name: "Test Wave",
        voting_credit_type: ApiWaveCreditType.Tdh,
        forbid_negative_votes: true,
      } as any,
    });

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("slider-value")).toHaveTextContent("5");
    expect(screen.getByTestId("new-rating")).toHaveTextContent("5");
    expect(screen.getByTestId("submit-block-reason")).toHaveTextContent(
      "Change this vote before submitting."
    );

    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    expect(mockOnVoteSuccess).not.toHaveBeenCalled();

    const sliderInput = screen.getByTestId("slider-input");
    expect((sliderInput as HTMLInputElement).value).toBe("10");

    fireEvent.click(sliderInput);

    expect(screen.getByTestId("new-rating")).toHaveTextContent("10");
    expect(screen.getByTestId("submit-block-reason").textContent).toBe("");

    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    expect(mockOnVoteSuccess).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("current-rating")).toHaveTextContent("10");
  });

  it("treats empty and lone minus drafts as invalid submit values", () => {
    const drop = createMockDrop({
      context_profile_context: {
        rating: 1,
        min_rating: -10,
        max_rating: 10,
      },
    });

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /numeric/i }));

    const numericInput = screen.getByTestId("numeric-input");

    fireEvent.change(numericInput, { target: { value: "" } });

    expect(screen.getByTestId("new-rating")).toHaveTextContent("NaN");
    expect(screen.getByTestId("submit-block-reason").textContent).toBe("");

    fireEvent.change(numericInput, { target: { value: "-" } });

    expect(screen.getByTestId("new-rating")).toHaveTextContent("NaN");
    expect(screen.getByTestId("submit-block-reason").textContent).toBe("");
  });

  it("starts in slider mode by default", () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("vote-slider")).toBeInTheDocument();
    expect(screen.queryByTestId("vote-input")).not.toBeInTheDocument();
    expect(screen.getByText("Switch to numeric")).toBeInTheDocument();
  });

  it("toggles between slider and numeric input modes", () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    const toggleButton = screen.getByRole("button", { name: /numeric/i });

    // Initially in slider mode
    expect(screen.getByTestId("vote-slider")).toBeInTheDocument();
    expect(screen.getByText("Switch to numeric")).toBeInTheDocument();

    // Toggle to numeric mode
    fireEvent.click(toggleButton);

    expect(screen.getByTestId("vote-input")).toBeInTheDocument();
    expect(screen.queryByTestId("vote-slider")).not.toBeInTheDocument();
    expect(screen.getByText("Switch to slider")).toBeInTheDocument();

    // Toggle back to slider mode
    const sliderButton = screen.getByRole("button", { name: /slider/i });
    fireEvent.click(sliderButton);

    expect(screen.getByTestId("vote-slider")).toBeInTheDocument();
    expect(screen.queryByTestId("vote-input")).not.toBeInTheDocument();
    expect(screen.getByText("Switch to numeric")).toBeInTheDocument();
  });

  it("updates vote value when slider changes", () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    const sliderInput = screen.getByTestId("slider-input");
    fireEvent.change(sliderInput, { target: { value: "80" } });

    expect(screen.getByTestId("slider-value")).toHaveTextContent("80");
    expect(screen.getByTestId("new-rating")).toHaveTextContent("80");
  });

  it("updates vote value when numeric input changes", () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    // Switch to numeric mode
    const toggleButton = screen.getByRole("button", { name: /numeric/i });
    fireEvent.click(toggleButton);

    const numericInput = screen.getByTestId("numeric-input");
    fireEvent.change(numericInput, { target: { value: "85" } });

    expect(screen.getByTestId("new-rating")).toHaveTextContent("85");
  });

  it("passes correct vote bounds and label to slider component", () => {
    const drop = createMockDrop({
      context_profile_context: {
        rating: 30,
        min_rating: 10,
        max_rating: 90,
      },
      wave: {
        id: "wave-123",
        name: "Test Wave",
        voting_credit_type: ApiWaveCreditType.Rep,
      },
    });

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("slider-input")).toHaveAttribute("min", "10");
    expect(screen.getByTestId("slider-input")).toHaveAttribute("max", "90");
    expect(screen.getByTestId("slider-input")).toHaveAttribute("value", "30");
    expect(screen.getByTestId("slider-credit-type")).toHaveTextContent("Rep");
  });

  it("passes correct props to numeric input component", () => {
    const drop = createMockDrop({
      context_profile_context: {
        rating: 40,
        min_rating: 5,
        max_rating: 95,
      },
      wave: {
        id: "wave-123",
        name: "Test Wave",
        voting_credit_type: ApiWaveCreditType.Rep,
      },
    });

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    // Switch to numeric mode
    const toggleButton = screen.getByRole("button", { name: /numeric/i });
    fireEvent.click(toggleButton);

    expect(screen.getByTestId("numeric-input")).toHaveAttribute("min", "5");
    expect(screen.getByTestId("numeric-input")).toHaveAttribute("max", "95");
    expect(screen.getByTestId("numeric-input")).toHaveAttribute("value", "40");
    expect(screen.getByTestId("input-credit-type")).toHaveTextContent("Rep");
  });

  it("passes correct props to stats component", () => {
    const drop = createMockDrop({
      context_profile_context: {
        rating: 60,
        min_rating: 0,
        max_rating: 120,
      },
      wave: {
        id: "wave-123",
        name: "Test Wave",
        voting_credit_type: ApiWaveCreditType.Tdh,
      },
    });

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("current-rating")).toHaveTextContent("60");
    expect(screen.getByTestId("max-rating")).toHaveTextContent("120");
    expect(screen.getByTestId("stats-credit-type")).toHaveTextContent("TDH");
  });

  it("handles submit via numeric input enter key", async () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    // Switch to numeric mode
    const toggleButton = screen.getByRole("button", { name: /numeric/i });
    fireEvent.click(toggleButton);

    const numericInput = screen.getByTestId("numeric-input");
    fireEvent.keyPress(numericInput, { key: "Enter", code: "Enter" });

    // The submit functionality is tested via the mocked component
    expect(screen.getByTestId("vote-input")).toBeInTheDocument();
  });

  it("updates vote value when drop context changes", () => {
    const drop = createMockDrop({
      context_profile_context: {
        rating: 25,
        min_rating: 0,
        max_rating: 100,
      },
    });

    const { rerender } = render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("slider-value")).toHaveTextContent("25");

    // Update the drop with new rating
    const updatedDrop = createMockDrop({
      context_profile_context: {
        rating: 75,
        min_rating: 0,
        max_rating: 100,
      },
    });

    rerender(
      <SingleWaveDropVoteContent
        drop={updatedDrop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("slider-value")).toHaveTextContent("75");
  });

  it("handles missing context profile gracefully", () => {
    const drop = createMockDrop({
      context_profile_context: null,
    });

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("slider-value")).toHaveTextContent("0");
    expect(screen.getByTestId("new-rating")).toHaveTextContent("0");
    expect(screen.getByTestId("current-rating")).toHaveTextContent("0");
  });

  it("renders vote controls as a native group", () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(
      screen.getByRole("group", { name: "Vote controls" })
    ).toBeInTheDocument();
  });

  it("shows correct icon flip based on mode", () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.MINI}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    const icon = screen.getByTestId("font-awesome-icon");

    // Mini mode starts in numeric mode.
    expect(icon).toHaveAttribute("data-flip", "vertical");

    // Switch to slider mode
    const toggleButton = screen.getByRole("button", { name: /slider/i });
    fireEvent.click(toggleButton);

    // In slider mode, should show "horizontal" flip
    expect(icon).toHaveAttribute("data-flip", "horizontal");
  });

  it("calls onVoteSuccess when vote is submitted successfully", () => {
    const drop = createMockDrop();

    render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    const submitButton = screen.getByRole("button", { name: /submit vote/i });
    fireEvent.click(submitButton);

    expect(mockOnVoteSuccess).toHaveBeenCalled();
  });

  it("updates displayed vote stats without broadly invalidating drops", () => {
    const drop = createMockDrop();
    const invalidateDrops = jest.fn();

    render(
      <ReactQueryWrapperContext.Provider value={{ invalidateDrops } as any}>
        <SingleWaveDropVoteContent
          drop={drop}
          size={SingleWaveDropVoteSize.NORMAL}
          onVoteSuccess={mockOnVoteSuccess}
        />
      </ReactQueryWrapperContext.Provider>
    );

    expect(screen.getByTestId("current-rating")).toHaveTextContent("50");

    const sliderInput = screen.getByTestId("slider-input");
    fireEvent.change(sliderInput, { target: { value: "88" } });
    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    expect(screen.getByTestId("current-rating")).toHaveTextContent("88");
    expect(screen.getByTestId("new-rating")).toHaveTextContent("88");
    expect(invalidateDrops).not.toHaveBeenCalled();
  });

  it("works with different SingleWaveDropVoteSize values", () => {
    const drop = createMockDrop();

    const { rerender } = render(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.NORMAL}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("vote-slider")).toBeInTheDocument();

    rerender(
      <SingleWaveDropVoteContent
        drop={drop}
        size={SingleWaveDropVoteSize.COMPACT}
        onVoteSuccess={mockOnVoteSuccess}
      />
    );

    expect(screen.getByTestId("vote-slider")).toBeInTheDocument();
  });
});
