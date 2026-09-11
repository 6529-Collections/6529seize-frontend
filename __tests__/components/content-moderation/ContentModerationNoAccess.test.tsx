import ContentModerationNoAccess from "@/components/content-moderation/ContentModerationNoAccess";
import { act, render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockUseRouter = useRouter as jest.Mock;

describe("ContentModerationNoAccess", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockUseRouter.mockReturnValue({ replace: jest.fn() });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("counts down before redirecting home", () => {
    const replace = jest.fn();
    mockUseRouter.mockReturnValue({ replace });
    render(<ContentModerationNoAccess locale="en-US" />);

    expect(screen.getByText("You have no power here")).toBeVisible();
    expect(screen.getByText("Redirecting in 10")).toBeVisible();

    for (let second = 0; second < 9; second += 1) {
      act(() => jest.advanceTimersByTime(1_000));
    }
    expect(screen.getByText("Redirecting in 1")).toBeVisible();
    expect(replace).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(1_000));
    expect(replace).toHaveBeenCalledWith("/");
  });
});
