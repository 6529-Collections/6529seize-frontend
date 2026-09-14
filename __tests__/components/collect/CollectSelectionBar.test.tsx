import CollectSelectionBar from "@/components/collect/CollectSelectionBar";
import type { CollectSelectedListing } from "@/components/collect/collect-selection.helpers";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import { ApiMarketTradeOrderSideEnum } from "@/generated/models/ApiMarketTradeOrder";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false, isIos: false }),
}));
jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: () => false,
}));
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => false,
}));

const contract = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
const zero = "0x0000000000000000000000000000000000000000";
const item: CollectSelectedListing = {
  asset: {
    asset_key: `1:${contract}:56`,
    chain_id: 1,
    contract,
    token_id: "56",
    name: "Artwork",
    family: ApiCollectFamily.Memes,
    image_url: null,
    artist_ids: [],
    season: 1,
    traits: [],
    hodl_rate: 1,
    tdh_eligible: true,
  },
  quantity: "1",
  order: {
    asset_key: `1:${contract}:56`,
    identity: {
      protocol_address: "0x0000000000000068f116a894984e2db1123eb395",
      order_hash: `0x${"a".repeat(64)}`,
    },
    maker: "0x1111111111111111111111111111111111111111",
    side: ApiMarketTradeOrderSideEnum.Listing,
    quantity: "1",
    purchase_quantity: "1",
    quantity_step: "1",
    available_quantity: "1",
    currency: zero,
    total_wei: "100000000000000000",
    net_wei: "100000000000000000",
    fees: [],
    start_time: "1",
    end_time: "9999999999",
    recipient: zero,
  },
};
const review = jest.fn(),
  clear = jest.fn(),
  offers = jest.fn();
let anchorLeft = 16,
  anchorWidth = 358,
  frameHeight = 128;
const observers: { notify: () => void; disconnect: jest.Mock }[] = [];
const OriginalResizeObserver = globalThis.ResizeObserver;

beforeEach(() => {
  jest.clearAllMocks();
  anchorLeft = 16;
  anchorWidth = 358;
  frameHeight = 128;
  observers.length = 0;
  globalThis.ResizeObserver = class {
    disconnect = jest.fn();
    observe = jest.fn();
    unobserve = jest.fn();
    constructor(callback: ResizeObserverCallback) {
      observers.push({
        notify: () => callback([], this),
        disconnect: this.disconnect,
      });
    }
  };
  jest
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: HTMLElement) {
      if (this.getAttribute("data-mobile-bottom-nav-dock") === "true")
        return new DOMRect(16, 680, 358, 64);
      if (this.classList.contains("tw-fixed"))
        return new DOMRect(anchorLeft, 600, anchorWidth, frameHeight);
      return new DOMRect(anchorLeft, 2400, anchorWidth, 0);
    });
});
afterEach(() => {
  jest.restoreAllMocks();
  globalThis.ResizeObserver = OriginalResizeObserver;
});

function Bar({ active = true }: { readonly active?: boolean }) {
  return (
    <div data-testid="scrolling-content">
      <CollectSelectionBar
        active={active}
        items={[item]}
        onReview={review}
        onClear={clear}
        onPlanOffers={offers}
      />
    </div>
  );
}

it("escapes the scrolling content while remaining in the app modal boundary, with measured clearance", () => {
  const { container } = render(<Bar />);
  const section = screen.getByRole("region", { name: "Selected NFTs" });
  expect(container).toContainElement(section);
  expect(screen.getByTestId("scrolling-content")).not.toContainElement(section);
  const frame = section.parentElement!;
  const anchor = screen.getByTestId("scrolling-content")
    .firstElementChild as HTMLElement;
  expect(frame.style.left).toBe("16px");
  expect(frame.style.width).toBe("358px");
  expect(anchor.style.height).toBe("144px");
  act(() => {
    anchorLeft = 280;
    anchorWidth = 650;
    frameHeight = 176;
    observers.forEach(({ notify }) => notify());
  });
  expect(frame.style.left).toBe("280px");
  expect(frame.style.width).toBe("650px");
  expect(anchor.style.height).toBe("192px");
  expect(review).not.toHaveBeenCalled();
});

it("removes the portalled controls when the offer workspace is active and cleans up on navigation", () => {
  const { rerender, unmount } = render(<Bar />);
  expect(screen.getByRole("button", { name: "Review purchase" })).toBeVisible();
  rerender(<Bar active={false} />);
  expect(
    screen.queryByRole("region", { name: "Selected NFTs" })
  ).not.toBeInTheDocument();
  rerender(<Bar />);
  expect(screen.getByRole("button", { name: "Review purchase" })).toBeVisible();
  unmount();
  expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
  expect(
    observers.every(({ disconnect }) => disconnect.mock.calls.length > 0)
  ).toBe(true);
});

it("keeps all actions explicit and preserves the unavailable-price guard", () => {
  const { rerender } = render(<Bar />);
  fireEvent.click(screen.getByRole("button", { name: "Plan offers" }));
  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  fireEvent.click(screen.getByRole("button", { name: "Review purchase" }));
  expect(offers).toHaveBeenCalledTimes(1);
  expect(clear).toHaveBeenCalledTimes(1);
  expect(review).toHaveBeenCalledTimes(1);
  rerender(
    <CollectSelectionBar
      items={[{ ...item, quantity: "0" }]}
      onReview={review}
      onClear={clear}
    />
  );
  expect(
    screen.getByRole("button", { name: "Review purchase" })
  ).toBeDisabled();
});

it("stays above the existing mobile navigation dock", () => {
  render(
    <>
      <div data-mobile-bottom-nav-root="true">
        <div data-mobile-bottom-nav-dock="true" />
      </div>
      <Bar />
    </>
  );
  const frame = screen.getByRole("region", {
    name: "Selected NFTs",
  }).parentElement!;
  expect(frame.style.bottom).toBe(`${globalThis.innerHeight - 680 + 12}px`);
});

it("is inert behind the real review dialog and restores keyboard focus on close", async () => {
  function Flow() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <CollectSelectionBar
          items={[item]}
          onReview={() => setOpen(true)}
          onClear={clear}
        />
        <MobileWrapperDialog
          title="Purchase review"
          isOpen={open}
          onClose={() => setOpen(false)}
          tabletModal
          hideOnDesktopHover={false}
          enableDragToClose={false}
        >
          <button onClick={() => setOpen(false)}>Close review</button>
        </MobileWrapperDialog>
      </>
    );
  }
  const user = userEvent.setup();
  const { container } = render(<Flow />);
  const trigger = screen.getByRole("button", { name: "Review purchase" });
  await user.click(trigger);
  await screen.findByRole("dialog", { name: "Purchase review" });
  expect(container.inert).toBe(true);
  expect(container).toContainElement(trigger);
  await user.click(screen.getByRole("button", { name: "Close review" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  );
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(container.inert).not.toBe(true);
});
