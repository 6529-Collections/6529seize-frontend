import NotFound from "@/components/not-found/NotFound";
import { markPageNotFound } from "@/services/analytics/telemetry/collector";
import { act, render } from "@testing-library/react";

jest.mock("@/services/analytics/telemetry/collector", () => ({
  markPageNotFound: jest.fn(),
}));
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({ setTitle: jest.fn() }),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: () => null,
}));

const mockMark = jest.mocked(markPageNotFound);

beforeEach(() => {
  jest.useFakeTimers();
  mockMark.mockClear();
  window.history.replaceState(null, "", "/about/not-a-page");
});

afterEach(() => jest.useRealTimers());

describe("NotFound telemetry marker", () => {
  it("marks the page view of a 404 that stays on screen", () => {
    render(<NotFound />);
    expect(mockMark).not.toHaveBeenCalled();
    act(() => jest.runOnlyPendingTimers());
    expect(mockMark).toHaveBeenCalledWith("/about/not-a-page");
  });

  it("does not mark a page that replaces the 404 right away", () => {
    const { unmount } = render(<NotFound />);
    unmount();
    act(() => jest.runOnlyPendingTimers());
    expect(mockMark).not.toHaveBeenCalled();
  });
});
