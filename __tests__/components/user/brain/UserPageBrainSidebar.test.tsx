import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import UserPageBrainSidebar from "@/components/user/brain/UserPageBrainSidebar";
import { ApiProfileWaveActivityType } from "@/generated/models/ApiProfileWaveActivityType";
import {
  useProfileWaveActivityWaves,
  type ProfileWaveActivityQueryState,
} from "@/hooks/useProfileWaveActivityWaves";
import type { ProfileWaveActivitySidebarItem } from "@/types/profile-wave-activity.types";
import { keepFocusedSidebarControlVisible } from "@/components/user/brain/userPageBrainSidebar.helpers";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, fill, unoptimized, ...props }: any) =>
    React.createElement("img", { alt: alt ?? "", ...props }),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, prefetch, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
jest.mock("@headlessui/react", () => ({
  DialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
}));
jest.mock("@/components/waves/drops/PreviewModalShell", () => ({
  PreviewModalShell: ({ children, isOpen }: any) =>
    isOpen ? <div role="dialog">{children(false)}</div> : null,
}));
jest.mock("@/hooks/useProfileWaveActivityWaves", () => ({
  useProfileWaveActivityWaves: jest.fn(),
}));

const mockedUseProfileWaveActivityWaves =
  useProfileWaveActivityWaves as jest.MockedFunction<
    typeof useProfileWaveActivityWaves
  >;

const baseProfile = {
  handle: "kanetix",
  display: "Kanetix",
  primary_wallet: "0xabc",
} as any;

const makeWave = (
  overrides: Partial<ProfileWaveActivitySidebarItem> = {}
): ProfileWaveActivitySidebarItem => ({
  id: "wave-1",
  name: "TDH Name Vote",
  picture: null,
  isPrivate: false,
  totalDropsCount: 12,
  latestPostTimestamp: Date.now() - 2 * 60 * 60 * 1000,
  ...overrides,
});

const makeState = (
  overrides: Partial<ProfileWaveActivityQueryState> = {}
): ProfileWaveActivityQueryState => ({
  waves: [],
  status: "success",
  isInitialLoading: false,
  isInitialError: false,
  isFetchingNextPage: false,
  isFetchNextPageError: false,
  hasNextPage: false,
  fetchNextPage: jest.fn().mockResolvedValue({ isComplete: false }),
  refetch: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

let createdState: ProfileWaveActivityQueryState;
let recentState: ProfileWaveActivityQueryState;

describe("UserPageBrainSidebar", () => {
  beforeEach(() => {
    mockedUseProfileWaveActivityWaves.mockReset();
    createdState = makeState();
    recentState = makeState();
    mockedUseProfileWaveActivityWaves.mockImplementation(({ activityType }) =>
      activityType === ApiProfileWaveActivityType.Created
        ? createdState
        : recentState
    );
  });

  it("loads CREATED and RECENT independently and allows overlap", () => {
    const sharedWave = makeWave({ name: "Shared Wave" });
    createdState = makeState({ waves: [sharedWave] });
    recentState = makeState({ waves: [sharedWave] });

    render(<UserPageBrainSidebar profile={baseProfile} />);

    const createdSection = screen.getByRole("region", {
      name: "Created Waves",
    });
    const recentSection = screen.getByRole("region", {
      name: "Recently Active In",
    });

    expect(within(createdSection).getByText("Shared Wave")).toBeInTheDocument();
    expect(within(recentSection).getByText("Shared Wave")).toBeInTheDocument();
    expect(
      within(createdSection).getByText("12 total wave posts")
    ).toBeInTheDocument();
    expect(within(recentSection).queryByText("12 total wave posts")).toBeNull();
    expect(screen.queryByText(/By latest post/)).toBeNull();
    expect(screen.queryByText("Most Active In")).toBeNull();
    expect(mockedUseProfileWaveActivityWaves).toHaveBeenCalledTimes(2);
    expect(mockedUseProfileWaveActivityWaves).toHaveBeenNthCalledWith(1, {
      identity: "kanetix",
      activityType: ApiProfileWaveActivityType.Created,
      limit: 20,
    });
    expect(mockedUseProfileWaveActivityWaves).toHaveBeenNthCalledWith(2, {
      identity: "kanetix",
      activityType: ApiProfileWaveActivityType.Recent,
      limit: 5,
    });
  });

  it("exposes the desktop lists as one keyboard-scrollable region", () => {
    createdState = makeState({ waves: [makeWave()] });
    recentState = makeState({
      waves: [makeWave({ id: "wave-2", name: "Recent Wave" })],
    });

    render(<UserPageBrainSidebar profile={baseProfile} />);

    const scrollRegion = screen.getByTestId("brain-sidebar-desktop");

    expect(scrollRegion).toHaveAccessibleName("Brain waves");
    expect(scrollRegion.tagName).toBe("SECTION");
    expect(scrollRegion).toHaveAttribute("tabindex", "0");
    expect(scrollRegion).toHaveAttribute(
      "data-brain-sidebar-scroll-region"
    );
    expect(scrollRegion).toHaveClass(
      "lg:tw-max-h-[calc(100dvh-4rem)]",
      "lg:tw-overflow-y-auto",
      "lg:tw-overscroll-y-contain"
    );
    expect(
      screen.getByTestId("brain-sidebar-mobile-strip")
    ).not.toHaveAttribute("tabindex");

    Object.defineProperties(scrollRegion, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 200 },
    });
    scrollRegion.scrollTop = 100;

    expect(
      fireEvent.wheel(scrollRegion, { cancelable: true, deltaY: 40 })
    ).toBe(false);
    expect(
      fireEvent.keyDown(scrollRegion, { cancelable: true, key: "PageDown" })
    ).toBe(false);

    scrollRegion.scrollTop = 50;
    expect(
      fireEvent.wheel(scrollRegion, { cancelable: true, deltaY: 40 })
    ).toBe(true);
    expect(
      fireEvent.keyDown(scrollRegion, { cancelable: true, key: "PageDown" })
    ).toBe(false);
    expect(scrollRegion.scrollTop).toBe(100);
  });

  it("keeps a successful recent section when created waves fail", () => {
    createdState = makeState({
      status: "error",
      isInitialError: true,
    });
    recentState = makeState({
      waves: [makeWave({ id: "wave-2", name: "Recent Wave" })],
    });

    render(<UserPageBrainSidebar profile={baseProfile} />);

    const createdSection = screen.getByRole("region", {
      name: "Created Waves",
    });
    const recentSection = screen.getByRole("region", {
      name: "Recently Active In",
    });
    expect(
      within(createdSection).getByText("Created waves could not be loaded.")
    ).toBeInTheDocument();
    expect(
      within(createdSection).getByRole("button", { name: "Retry" })
    ).toBeInTheDocument();
    expect(within(recentSection).getByText("Recent Wave")).toBeInTheDocument();
  });

  it("hides an empty created section and keeps the recent empty state", () => {
    render(<UserPageBrainSidebar profile={baseProfile} />);

    expect(
      screen.queryByRole("region", { name: "Created Waves" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("No accessible created waves.")
    ).not.toBeInTheDocument();
    expect(
      within(
        screen.getByRole("region", { name: "Recently Active In" })
      ).getByText("No recent wave posts.")
    ).toBeInTheDocument();
  });

  it("uses the primary wallet when the profile has no handle", () => {
    render(
      <UserPageBrainSidebar
        profile={{ ...baseProfile, handle: null, primary_wallet: "0xdef" }}
      />
    );

    expect(mockedUseProfileWaveActivityWaves).toHaveBeenNthCalledWith(1, {
      identity: "0xdef",
      activityType: ApiProfileWaveActivityType.Created,
      limit: 20,
    });
    expect(mockedUseProfileWaveActivityWaves).toHaveBeenNthCalledWith(2, {
      identity: "0xdef",
      activityType: ApiProfileWaveActivityType.Recent,
      limit: 5,
    });
  });

  it("keeps the created expand control focused through both transitions", () => {
    createdState = makeState({
      waves: [
        makeWave(),
        makeWave({ id: "wave-2", name: "Second Wave" }),
        makeWave({ id: "wave-3", name: "Third Wave" }),
        makeWave({ id: "wave-4", name: "Fourth Wave" }),
        makeWave({ id: "wave-5", name: "Fifth Wave" }),
        makeWave({ id: "wave-6", name: "Hidden Wave" }),
      ],
    });

    render(<UserPageBrainSidebar profile={baseProfile} />);
    const createdSection = screen.getByRole("region", {
      name: "Created Waves",
    });
    const toggle = within(createdSection).getByRole("button", {
      name: "Show more",
    });
    toggle.scrollIntoView = jest.fn();
    toggle.focus();

    fireEvent.click(toggle);
    expect(
      within(createdSection).getByRole("button", { name: "Show less" })
    ).toBe(toggle);
    expect(globalThis.document.activeElement).toBe(toggle);
    expect(toggle.scrollIntoView).not.toHaveBeenCalled();
    expect(within(createdSection).getByText("Hidden Wave")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(
      within(createdSection).getByRole("button", { name: "Show more" })
    ).toBe(toggle);
    expect(globalThis.document.activeElement).toBe(toggle);
    expect(toggle.scrollIntoView).not.toHaveBeenCalled();
    expect(within(createdSection).queryByText("Hidden Wave")).toBeNull();
  });

  it("keeps a focused load-more control visible after a non-final page", () => {
    recentState = makeState({
      waves: [makeWave({ id: "wave-2", name: "Recent Wave" })],
      hasNextPage: true,
    });

    const { rerender } = render(<UserPageBrainSidebar profile={baseProfile} />);
    const recentSection = screen.getByRole("region", {
      name: "Recently Active In",
    });
    const loadMore = within(recentSection).getByRole("button", {
      name: "Load more",
    });
    const scrollRegion = screen.getByTestId("brain-sidebar-desktop");
    loadMore.scrollIntoView = jest.fn();
    scrollRegion.scrollTop = 64;
    scrollRegion.getBoundingClientRect = jest.fn(
      () => ({ top: 100, bottom: 300 }) as DOMRect
    );
    loadMore.getBoundingClientRect = jest.fn(
      () => ({ top: 320, bottom: 350 }) as DOMRect
    );
    loadMore.focus();

    recentState = makeState({
      waves: [makeWave({ id: "wave-2", name: "Recent Wave" })],
      hasNextPage: true,
      isFetchingNextPage: true,
    });
    rerender(<UserPageBrainSidebar profile={baseProfile} />);

    expect(loadMore).toHaveAttribute("aria-busy", "true");
    expect(loadMore).toHaveAttribute("aria-disabled", "true");
    expect(loadMore).not.toBeDisabled();
    expect(globalThis.document.activeElement).toBe(loadMore);

    recentState = makeState({
      waves: [
        makeWave({ id: "wave-2", name: "Recent Wave" }),
        makeWave({ id: "wave-3", name: "Another Recent Wave" }),
      ],
      hasNextPage: true,
    });
    rerender(<UserPageBrainSidebar profile={baseProfile} />);

    expect(globalThis.document.activeElement).toBe(loadMore);
    expect(loadMore.scrollIntoView).not.toHaveBeenCalled();
    expect(scrollRegion.scrollTop).toBe(114);
  });

  it("retains native control positioning outside the desktop sidebar", () => {
    const control = globalThis.document.createElement("button");
    control.scrollIntoView = jest.fn();

    keepFocusedSidebarControlVisible(control);

    expect(control.scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      inline: "nearest",
    });
  });

  it("blocks repeated load-more activations until the request settles", async () => {
    let resolveNextPage:
      | ((result: { readonly isComplete: boolean }) => void)
      | undefined;
    const fetchNextPage = jest.fn(
      async () =>
        await new Promise<{ readonly isComplete: boolean }>((resolve) => {
          resolveNextPage = resolve;
        })
    );
    recentState = makeState({
      waves: [makeWave({ id: "wave-2", name: "Recent Wave" })],
      hasNextPage: true,
      fetchNextPage,
    });

    render(<UserPageBrainSidebar profile={baseProfile} />);
    const loadMore = within(
      screen.getByRole("region", { name: "Recently Active In" })
    ).getByRole("button", { name: "Load more" });

    fireEvent.click(loadMore);
    fireEvent.click(loadMore);

    expect(fetchNextPage).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveNextPage?.({ isComplete: false });
      await Promise.resolve();
    });

    fireEvent.click(loadMore);
    expect(fetchNextPage).toHaveBeenCalledTimes(2);
  });

  it("uses truthful mobile and modal copy while more created pages exist", () => {
    createdState = makeState({
      waves: [
        makeWave(),
        makeWave({ id: "wave-2", name: "Second Wave" }),
        makeWave({ id: "wave-3", name: "Third Wave" }),
        makeWave({ id: "wave-4", name: "Fourth Wave" }),
      ],
      hasNextPage: true,
    });

    render(<UserPageBrainSidebar profile={baseProfile} />);
    const mobileStrip = screen.getByTestId("brain-sidebar-mobile-strip");
    const moreButton = within(mobileStrip).getByRole("button", {
      name: "View more created waves",
    });

    expect(moreButton).toHaveTextContent("More");
    expect(moreButton).not.toHaveTextContent("+3");
    fireEvent.click(moreButton);

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", {
        name: "Created waves by kanetix",
      })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Showing 4 loaded waves")
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Fourth Wave")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Load more" })
    ).toBeInTheDocument();
  });

  it("moves focus to completion after the final recent cursor page", async () => {
    let resolveNextPage:
      | ((result: { readonly isComplete: boolean }) => void)
      | undefined;
    const fetchNextPage = jest.fn(
      async () =>
        await new Promise<{ readonly isComplete: boolean }>((resolve) => {
          resolveNextPage = resolve;
        })
    );
    recentState = makeState({
      waves: [makeWave({ id: "wave-2", name: "Recent Wave" })],
      hasNextPage: true,
      fetchNextPage,
    });

    const { rerender } = render(<UserPageBrainSidebar profile={baseProfile} />);
    const recentSection = screen.getByRole("region", {
      name: "Recently Active In",
    });
    const loadMore = within(recentSection).getByRole("button", {
      name: "Load more",
    });
    const scrollRegion = screen.getByTestId("brain-sidebar-desktop");
    scrollRegion.scrollTop = 64;
    loadMore.focus();
    fireEvent.click(loadMore);

    recentState = makeState({
      waves: [
        makeWave({ id: "wave-2", name: "Recent Wave" }),
        makeWave({ id: "wave-3", name: "Final Recent Wave" }),
      ],
      fetchNextPage,
    });
    rerender(<UserPageBrainSidebar profile={baseProfile} />);

    await act(async () => {
      resolveNextPage?.({ isComplete: true });
      await Promise.resolve();
    });

    const completion = within(recentSection).getByRole("status");
    expect(scrollRegion.scrollTop).toBe(64);
    expect(completion).toHaveTextContent("All waves loaded.");
    expect(globalThis.document.activeElement).toBe(completion);
    expect(
      within(recentSection).queryByRole("button", { name: "Load more" })
    ).toBeNull();
    expect(
      within(recentSection).getByText("Final Recent Wave")
    ).toBeInTheDocument();

    const finalWaveLink = within(recentSection).getByRole("link", {
      name: /Final Recent Wave/,
    });
    finalWaveLink.focus();
    recentState = makeState({
      waves: [
        makeWave({ id: "wave-2", name: "Recent Wave" }),
        makeWave({ id: "wave-3", name: "Final Recent Wave" }),
      ],
      isFetchNextPageError: true,
      fetchNextPage,
    });
    rerender(<UserPageBrainSidebar profile={baseProfile} />);
    recentState = makeState({
      waves: [
        makeWave({ id: "wave-2", name: "Recent Wave" }),
        makeWave({ id: "wave-3", name: "Final Recent Wave" }),
      ],
      fetchNextPage,
    });
    rerender(<UserPageBrainSidebar profile={baseProfile} />);

    expect(globalThis.document.activeElement).toBe(finalWaveLink);
    expect(within(recentSection).getByRole("status")).toHaveTextContent(
      "All waves loaded."
    );
  });

  it("does not move focus when the user leaves a final-page control", async () => {
    let resolveNextPage:
      | ((result: { readonly isComplete: boolean }) => void)
      | undefined;
    const fetchNextPage = jest.fn(
      async () =>
        await new Promise<{ readonly isComplete: boolean }>((resolve) => {
          resolveNextPage = resolve;
        })
    );
    recentState = makeState({
      waves: [makeWave({ id: "wave-2", name: "Recent Wave" })],
      hasNextPage: true,
      fetchNextPage,
    });

    const renderSidebar = () => (
      <>
        <button type="button">Outside control</button>
        <UserPageBrainSidebar profile={baseProfile} />
      </>
    );
    const { rerender } = render(renderSidebar());
    const recentSection = screen.getByRole("region", {
      name: "Recently Active In",
    });
    const loadMore = within(recentSection).getByRole("button", {
      name: "Load more",
    });
    loadMore.focus();
    fireEvent.click(loadMore);

    const outsideControl = screen.getByRole("button", {
      name: "Outside control",
    });
    outsideControl.focus();

    recentState = makeState({
      waves: [
        makeWave({ id: "wave-2", name: "Recent Wave" }),
        makeWave({ id: "wave-3", name: "Final Recent Wave" }),
      ],
      fetchNextPage,
    });
    rerender(renderSidebar());

    await act(async () => {
      resolveNextPage?.({ isComplete: true });
      await Promise.resolve();
    });

    expect(within(recentSection).getByRole("status")).toHaveTextContent(
      "All waves loaded."
    );
    expect(globalThis.document.activeElement).toBe(outsideControl);
  });
});
