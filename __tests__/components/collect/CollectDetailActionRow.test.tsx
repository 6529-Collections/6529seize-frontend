import CollectDetailActionRow, {
  CollectDetailLayout,
} from "@/components/collect/CollectDetailActionRow";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

let mockNative = false;
let mockIntersection: IntersectionObserverCallback;
const mockDisconnect = jest.fn();
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: mockNative }),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ spaces: { mobileNavSpace: 96 } }),
}));

beforeEach(() => {
  mockNative = false;
  jest.clearAllMocks();
  global.IntersectionObserver = jest.fn((callback) => {
    mockIntersection = callback;
    return { observe: jest.fn(), disconnect: mockDisconnect };
  }) as unknown as typeof IntersectionObserver;
});

function intersection(isIntersecting: boolean) {
  act(() =>
    mockIntersection(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver
    )
  );
}

it("keeps other inline trade surfaces unchanged", () => {
  render(
    <CollectDetailActionRow primaryAction={<button>Collect</button>}>
      <button>Offer</button>
    </CollectDetailActionRow>
  );
  expect(screen.getAllByRole("button")).toHaveLength(2);
  expect(document.querySelector("[data-collect-sticky-actions]")).toBeNull();
  expect(IntersectionObserver).not.toHaveBeenCalled();
});

it("duplicates the current actions only off screen and submits the original form", () => {
  const submit = jest.fn();
  const offer = jest.fn();
  const view = render(
    <CollectDetailLayout.Provider
      value={{
        offerAction: <button onClick={offer}>Make an offer</button>,
        marketLink: null,
      }}
    >
      <form
        id="purchase"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <CollectDetailActionRow
          primaryAction={
            <button form="purchase" type="submit">
              Collect 0.14 ETH
            </button>
          }
        >
          <button type="button" onClick={offer}>
            Make an offer
          </button>
        </CollectDetailActionRow>
      </form>
    </CollectDetailLayout.Provider>
  );
  const sticky = document.querySelector<HTMLElement>(
    "[data-collect-sticky-actions]"
  )!;
  expect(sticky).toHaveAttribute("inert");
  intersection(false);
  expect(sticky).toHaveAttribute("aria-hidden", "false");
  fireEvent.click(
    within(sticky).getByRole("button", { name: "Collect 0.14 ETH" })
  );
  expect(submit).toHaveBeenCalledTimes(1);
  fireEvent.click(
    within(sticky).getByRole("button", { name: "Make an offer" })
  );
  expect(offer).toHaveBeenCalledTimes(1);
  intersection(true);
  expect(sticky).toHaveAttribute("inert");
  view.unmount();
  expect(mockDisconnect).toHaveBeenCalled();
});

it("keeps unlisted actions above the measured native navigation without adding Collect", () => {
  mockNative = true;
  render(
    <CollectDetailLayout.Provider
      value={{ offerAction: <button>Make an offer</button>, marketLink: null }}
    >
      <CollectDetailActionRow>
        <button>Make an offer</button>
      </CollectDetailActionRow>
    </CollectDetailLayout.Provider>
  );
  intersection(false);
  const sticky = document.querySelector<HTMLElement>(
    "[data-collect-sticky-actions]"
  )!;
  expect(sticky.style.bottom).toBe("96px");
  expect(within(sticky).getAllByRole("button")).toHaveLength(1);
  expect(within(sticky).queryByRole("button", { name: /Collect/ })).toBeNull();
});

it("uses the latest intersection when scrolling changes are delivered together", () => {
  render(
    <CollectDetailLayout.Provider
      value={{ offerAction: <button>Make an offer</button>, marketLink: null }}
    >
      <CollectDetailActionRow>
        <button>Make an offer</button>
      </CollectDetailActionRow>
    </CollectDetailLayout.Provider>
  );
  const sticky = screen.getByTestId("collect-sticky-actions");

  act(() =>
    mockIntersection(
      [
        { isIntersecting: true },
        { isIntersecting: false },
      ] as IntersectionObserverEntry[],
      {} as IntersectionObserver
    )
  );
  expect(sticky).toHaveAttribute("aria-hidden", "false");
  expect(sticky).not.toHaveAttribute("inert");

  act(() =>
    mockIntersection(
      [
        { isIntersecting: false },
        { isIntersecting: true },
      ] as IntersectionObserverEntry[],
      {} as IntersectionObserver
    )
  );
  expect(sticky).toHaveAttribute("aria-hidden", "true");
  expect(sticky).toHaveAttribute("inert");
});
