import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import DropListItemRateGive from "@/components/drops/view/item/rate/give/DropListItemRateGive";
import { AuthContext } from "@/components/auth/Auth";
import { ProfileConnectedStatus } from "@/entities/IProfile";

const submitMock = jest.fn((props: any) => (
  <div data-testid="submit" data-rate={props.rate} />
));
jest.mock(
  "@/components/drops/view/item/rate/give/DropListItemRateGiveSubmit",
  () => (props: any) => submitMock(props)
);

const dropInteractionMock = { canVote: true };
jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: () => dropInteractionMock,
}));

const baseDrop = {
  id: "d1",
  wave: { forbid_negative_votes: false },
  context_profile_context: { rating: 0, max_rating: 5, min_rating: -5 },
} as any;

const createDrop = (overrides: any = {}) => ({
  ...baseDrop,
  ...overrides,
  wave: {
    ...baseDrop.wave,
    ...overrides.wave,
  },
  context_profile_context: {
    ...baseDrop.context_profile_context,
    ...overrides.context_profile_context,
  },
});

const renderComponent = (dropOverrides: any = {}) =>
  render(
    <AuthContext.Provider
      value={{ connectionStatus: ProfileConnectedStatus.HAVE_PROFILE } as any}
    >
      <DropListItemRateGive drop={createDrop(dropOverrides)} />
    </AuthContext.Provider>
  );

describe("DropListItemRateGive", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    dropInteractionMock.canVote = true;
    submitMock.mockClear();
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("increases rate while mouse is held down", () => {
    renderComponent();
    const incBtn = screen.getByLabelText("Choose positive votes");
    act(() => {
      fireEvent.mouseDown(incBtn);
      jest.advanceTimersByTime(500);
    });
    expect(screen.getByTestId("submit").getAttribute("data-rate")).toBe("3");
    act(() => {
      fireEvent.mouseUp(incBtn);
      jest.advanceTimersByTime(1000);
    });
    // no further changes after mouse up
    expect(screen.getByTestId("submit").getAttribute("data-rate")).toBe("3");
  });

  it("does not allow rating when voting disabled", () => {
    dropInteractionMock.canVote = false;
    renderComponent();
    expect(screen.getByTestId("submit").getAttribute("data-rate")).toBe("0");
  });

  it("does not allow decreasing below zero when negative votes are forbidden", () => {
    renderComponent({
      wave: { forbid_negative_votes: true },
      context_profile_context: { rating: 0, max_rating: 5, min_rating: -5 },
    });
    const decBtn = screen.getByLabelText("Decrease vote");
    expect(decBtn).not.toBeDisabled();
    act(() => {
      fireEvent.mouseDown(decBtn);
      fireEvent.mouseUp(decBtn);
    });
    expect(screen.getByTestId("submit").getAttribute("data-rate")).toBe("0");
    expect(decBtn).toBeDisabled();
  });

  it("stops held decrease timer at zero when negative votes are forbidden", () => {
    renderComponent({
      wave: { forbid_negative_votes: true },
      context_profile_context: { rating: 0, max_rating: 5, min_rating: -5 },
    });

    const decBtn = screen.getByLabelText("Decrease vote");

    act(() => {
      fireEvent.mouseDown(decBtn);
    });

    expect(screen.getByTestId("submit").getAttribute("data-rate")).toBe("0");
    expect(decBtn).toBeDisabled();
    expect(jest.getTimerCount()).toBe(0);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("submit").getAttribute("data-rate")).toBe("0");
  });

  it("allows decreasing a pending positive vote when negative votes are forbidden", () => {
    renderComponent({
      wave: { forbid_negative_votes: true },
      context_profile_context: { rating: 0, max_rating: 5, min_rating: -5 },
    });

    const incBtn = screen.getByLabelText("Choose positive votes");
    act(() => {
      fireEvent.mouseDown(incBtn);
      jest.advanceTimersByTime(500);
      fireEvent.mouseUp(incBtn);
    });
    expect(screen.getByTestId("submit").getAttribute("data-rate")).toBe("3");

    const decBtn = screen.getByLabelText("Decrease vote");
    expect(decBtn).not.toBeDisabled();
    act(() => {
      fireEvent.mouseDown(decBtn);
      fireEvent.mouseUp(decBtn);
    });
    expect(screen.getByTestId("submit").getAttribute("data-rate")).toBe("2");
  });
});
