import { fireEvent, render, screen } from "@testing-library/react";
import BrainMobileWaves from "@/components/brain/mobile/BrainMobileWaves";
import {
  MEMES_WAVE_DOCK_ONLY_SCROLL_CLEARANCE_CLASS_NAME,
  MEMES_WAVE_FLOATING_FOOTER_SCROLL_CLEARANCE_CLASS_NAME,
} from "@/components/brain/left-sidebar/waves/MemesWaveFooter.constants";
import { t } from "@/i18n/messages";

let receivedRef: any;
let receivedFooterProps: any;
type MockFooterStats = {
  readonly isAvailable: boolean;
  readonly isReady: boolean;
  readonly leftThisRoundCount: number;
  readonly uncastPower: number | null;
  readonly unratedCount: number;
  readonly votingLabel: string | null;
};
const unavailableFooterStats: MockFooterStats = {
  isAvailable: false,
  isReady: false,
  leftThisRoundCount: 0,
  uncastPower: null,
  unratedCount: 0,
  votingLabel: null,
};
const availableFooterStats: MockFooterStats = {
  isAvailable: true,
  isReady: true,
  leftThisRoundCount: 1,
  uncastPower: 100,
  unratedCount: 1,
  votingLabel: "TDH",
};
let mockFooterStats: MockFooterStats = unavailableFooterStats;

const setBrowserLanguages = (languages: readonly string[]) => {
  Object.defineProperty(globalThis.navigator, "languages", {
    configurable: true,
    value: languages,
  });
};

beforeEach(() => {
  setBrowserLanguages(["en-US"]);
  mockFooterStats = unavailableFooterStats;
});

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
  MemesWaveFooterView: (props: {
    readonly floating?: boolean;
    readonly onOpenQuickVote: () => void;
    readonly onPrefetchQuickVote?: () => void;
    readonly stats: typeof unavailableFooterStats;
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

jest.mock("@/hooks/useMemesWaveFooterStats", () => ({
  useMemesWaveFooterStats: () => mockFooterStats,
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ mobileWavesViewStyle: { height: "42px" } }),
}));

test("applies style, forwards scroll ref, and passes the quick-vote opener", () => {
  const onOpenQuickVote = jest.fn();
  const { container, rerender } = render(
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
  expect(receivedFooterProps.floating).toBe(true);
  expect(receivedFooterProps.stats).toBe(unavailableFooterStats);

  mockFooterStats = availableFooterStats;
  rerender(<BrainMobileWaves onOpenQuickVote={onOpenQuickVote} />);

  expect(receivedRef.current).toHaveClass(
    MEMES_WAVE_FLOATING_FOOTER_SCROLL_CLEARANCE_CLASS_NAME
  );
  expect(receivedFooterProps.stats).toBe(availableFooterStats);

  fireEvent.click(screen.getByTestId("footer"));

  expect(onOpenQuickVote).toHaveBeenCalledTimes(1);
});

test("uses browser locale for the profile feed link", async () => {
  setBrowserLanguages(["fr-FR"]);

  render(<BrainMobileWaves onOpenQuickVote={jest.fn()} />);

  expect(
    await screen.findByText(t("fr-FR", "waves.mobile.profileFeed.title"))
  ).toBeInTheDocument();
  expect(
    screen.getByText(t("fr-FR", "waves.mobile.profileFeed.subtitle"))
  ).toBeInTheDocument();
});
