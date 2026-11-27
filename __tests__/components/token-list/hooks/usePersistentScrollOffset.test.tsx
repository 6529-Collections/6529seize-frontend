import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { ReadonlyURLSearchParams } from "next/navigation";
import { usePersistentScrollOffset } from "@/components/token-list/hooks/usePersistentScrollOffset";
import { PhoneNavigationScreenContext } from "@/contexts/PhoneNavigationScreenContext";

const mockSetPosition = jest.fn();
jest.mock("@/contexts/ScrollPositionContext", () => ({
  useScrollPositionContext: () => ({
    getPosition: () => 42,
    setPosition: mockSetPosition,
  }),
}));

function ScrollProbe() {
  const ref = useRef<HTMLDivElement>(null);
  const initialOffset = usePersistentScrollOffset("feed", ref);
  return (
    <div ref={ref} data-testid="scroll">
      {initialOffset}
    </div>
  );
}

beforeEach(() => jest.clearAllMocks());

it("saves the last visible position and ignores hidden-screen scroll events", () => {
  const route = {
    pathname: "/waves",
    searchParams: new ReadonlyURLSearchParams(""),
  };
  const view = (active: boolean) => (
    <PhoneNavigationScreenContext.Provider value={{ ...route, active }}>
      <ScrollProbe />
    </PhoneNavigationScreenContext.Provider>
  );
  const { rerender } = render(view(true));
  const scroll = screen.getByTestId("scroll");
  expect(scroll).toHaveTextContent("42");
  scroll.scrollTop = 250;
  fireEvent.scroll(scroll);
  expect(mockSetPosition).toHaveBeenLastCalledWith("feed", 250);
  rerender(view(false));
  expect(mockSetPosition).toHaveBeenLastCalledWith("feed", 250);
  mockSetPosition.mockClear();
  scroll.scrollTop = 100;
  fireEvent.scroll(scroll);
  expect(mockSetPosition).not.toHaveBeenCalled();
  rerender(view(true));
  scroll.scrollTop = 300;
  fireEvent.scroll(scroll);
  expect(mockSetPosition).toHaveBeenLastCalledWith("feed", 300);
});

it("keeps ordinary web scroll persistence and saves on unmount", () => {
  const { unmount } = render(<ScrollProbe />);
  const scroll = screen.getByTestId("scroll");
  Object.defineProperty(scroll, "scrollTop", {
    get: () => (scroll.isConnected ? 500 : 0),
  });
  fireEvent.scroll(scroll);
  expect(mockSetPosition).toHaveBeenLastCalledWith("feed", 500);
  mockSetPosition.mockClear();
  unmount();
  expect(mockSetPosition).toHaveBeenCalledWith("feed", 500);
});
