import { act, fireEvent, render, screen } from "@testing-library/react";
import BrainMobileWaves from "@/components/brain/mobile/BrainMobileWaves";
import {
  MEMES_WAVE_DOCK_ONLY_SCROLL_CLEARANCE_CLASS_NAME,
  MEMES_WAVE_FLOATING_FOOTER_SCROLL_CLEARANCE_CLASS_NAME,
} from "@/components/brain/left-sidebar/waves/MemesWaveFooter.constants";

let receivedRef: any;
let receivedFooterProps: any;

jest.mock(
  "@/components/brain/left-sidebar/waves/BrainLeftSidebarWaves",
  () => ({
    __esModule: true,
    default: ({ scrollContainerRef }: any) => {
      receivedRef = scrollContainerRef;
      return <div data-testid="waves" />;
    },
  })
);

jest.mock("@/components/brain/left-sidebar/waves/MemesWaveFooter", () => ({
  __esModule: true,
  default: (props: {
    readonly bottomNavCompact?: boolean;
    readonly floating?: boolean;
    readonly onAvailabilityChange?: (isAvailable: boolean) => void;
    readonly onOpenQuickVote: () => void;
    readonly onPrefetchQuickVote?: () => void;
  }) => {
    receivedFooterProps = props;
    return (
      <button
        type="button"
        data-testid="footer"
        onClick={props.onOpenQuickVote}
      >
        footer
      </button>
    );
  },
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ mobileWavesViewStyle: { height: "42px" } }),
}));

test("applies style, forwards scroll ref, and passes the quick-vote opener", () => {
  const onOpenQuickVote = jest.fn();
  const { container } = render(
    <BrainMobileWaves onOpenQuickVote={onOpenQuickVote} />
  );
  const root = container.firstElementChild as HTMLElement;
  const scrollContainer = root.querySelector(
    '[data-mobile-bottom-nav-scroll-target="true"]'
  ) as HTMLElement;

  expect(root.style.height).toBe("42px");
  expect(root).toHaveClass("tw-flex", "tw-h-full", "tw-min-h-0");
  expect(scrollContainer).toBeInTheDocument();
  expect(root.lastElementChild).toBe(screen.getByTestId("footer"));
  expect(
    screen.getByRole("link", { name: /profile waves feed/i })
  ).toHaveAttribute("href", "/waves?view=profile-feed");
  expect(receivedRef).toBeDefined();
  expect(receivedRef.current).toBe(scrollContainer);
  expect(receivedRef.current).toContainElement(screen.getByTestId("waves"));
  expect(receivedRef.current).toHaveClass(
    MEMES_WAVE_DOCK_ONLY_SCROLL_CLEARANCE_CLASS_NAME
  );
  expect(receivedFooterProps.bottomNavCompact).toBe(false);
  expect(receivedFooterProps.floating).toBe(true);

  act(() => {
    receivedFooterProps.onAvailabilityChange?.(true);
  });

  expect(receivedRef.current).toHaveClass(
    MEMES_WAVE_FLOATING_FOOTER_SCROLL_CLEARANCE_CLASS_NAME
  );

  fireEvent.click(screen.getByTestId("footer"));

  expect(onOpenQuickVote).toHaveBeenCalledTimes(1);
});

test("passes the compact dock state to the floating footer", () => {
  render(<BrainMobileWaves bottomNavCompact onOpenQuickVote={jest.fn()} />);

  expect(receivedFooterProps.bottomNavCompact).toBe(true);
});
