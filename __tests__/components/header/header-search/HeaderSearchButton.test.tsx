import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
  within,
} from "@testing-library/react";
import HeaderSearchButton from "@/components/header/header-search/HeaderSearchButton";
import { requestSiteSearch } from "@/hooks/useSiteSearchRequest";
import useDeviceInfo from "@/hooks/useDeviceInfo";

let keyFilter: (e: KeyboardEvent) => boolean;
let keyCb: (event: KeyboardEvent) => void;
const mockRouterReplace = jest.fn();
const mockRouterPush = jest.fn();

jest.mock("react-use", () => ({
  useKey: (
    filter: (e: KeyboardEvent) => boolean,
    cb: (event: KeyboardEvent) => void
  ) => {
    keyFilter = filter;
    keyCb = cb;
  },
}));

jest.mock("@/components/utils/animation/CommonAnimationWrapper", () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="wrapper">{children}</div>,
}));

jest.mock("@/components/utils/animation/CommonAnimationOpacity", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock("@/components/header/header-search/HeaderSearchModal", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="modal" onClick={() => props.onClose()}></div>
  ),
}));

jest.mock("@/components/waves/drops/search/WaveDropsSearchModal", () => ({
  __esModule: true,
  default: (props: any) =>
    props.isOpen ? (
      <div data-testid="wave-search-modal">
        <button onClick={props.onSearchAll}>Search all 6529</button>
        <button onClick={() => props.onSelectSerialNo(42)}>
          Open result 42
        </button>
        <button onClick={props.onClose}>Close wave search</button>
      </div>
    ) : null,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace, push: mockRouterPush }),
  usePathname: () => "/waves/wave-1",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/contexts/wave/WaveChatScrollContext", () => ({
  useWaveChatScrollOptional: () => null,
}));

jest.mock("@heroicons/react/24/outline", () => ({
  MagnifyingGlassIcon: (props: any) => <svg data-testid="icon" {...props} />,
  EllipsisVerticalIcon: (props: any) => <svg {...props} />,
}));

jest.mock("@/hooks/useDeviceInfo");

const useDeviceInfoMock = useDeviceInfo as jest.MockedFunction<
  typeof useDeviceInfo
>;

describe("HeaderSearchButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState({}, "", "/");
    keyFilter = () => false;
    keyCb = () => undefined;
  });

  it("opens modal when button is clicked and closes via onClose", async () => {
    useDeviceInfoMock.mockReturnValue({ isApp: false } as any);
    render(<HeaderSearchButton wave={null} />);
    expect(screen.queryByTestId("modal")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(await screen.findByTestId("modal")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("modal"));
    expect(screen.queryByTestId("modal")).toBeNull();
  });

  it("keeps Search visible and secondary actions in More", async () => {
    useDeviceInfoMock.mockReturnValue({ isApp: true } as any);
    render(
      <HeaderSearchButton
        wave={null}
        additionalMenuItems={[
          {
            id: "profile-feed",
            label: "Profile Waves Feed",
            href: "/waves?view=profile-feed",
          },
        ]}
      />
    );
    expect(screen.getByRole("button", { name: "Search 6529" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(
      await screen.findByRole("menuitem", { name: "Profile Waves Feed" })
    ).toHaveAttribute("href", "/waves?view=profile-feed");
    expect(screen.queryByRole("menuitem", { name: "Search 6529" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    fireEvent.click(screen.getByRole("button", { name: "Search 6529" }));
    expect(await screen.findByTestId("modal")).toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("keeps search directly visible beside the native More sheet and restores focus", async () => {
    useDeviceInfoMock.mockReturnValue({ isApp: true } as any);
    render(
      <HeaderSearchButton
        wave={null}
        morePresentation="sheet"
        additionalMenuItems={[
          {
            id: "profile-feed",
            label: "Profile Waves Feed",
            href: "/waves?view=profile-feed",
          },
        ]}
      />
    );
    const search = screen.getByRole("button", { name: "Search 6529" });
    expect(search).toBeVisible();
    expect(search).toHaveClass("tw-size-11");
    expect(search.querySelector("svg")).toHaveAttribute("stroke-width", "1.5");
    const more = screen.getByRole("button", { name: "More" });
    fireEvent.click(more);
    const sheet = await screen.findByRole("dialog");
    expect(sheet).toBeVisible();
    expect(
      within(sheet).queryByRole("button", { name: "Search 6529" })
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(sheet).not.toBeInTheDocument());
    fireEvent.click(search);
    expect(await screen.findByTestId("modal")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("modal"));
    await waitFor(() => expect(search).toHaveFocus());
  });

  it("opens the profile feed from the native Waves sheet", async () => {
    useDeviceInfoMock.mockReturnValue({ isApp: true } as any);
    const onSelect = jest.fn();
    render(
      <HeaderSearchButton
        wave={null}
        morePresentation="sheet"
        additionalMenuItems={[
          {
            id: "profile-feed",
            label: "Profile Waves Feed",
            href: "/waves?view=profile-feed",
            onSelect,
          },
        ]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Profile Waves Feed" })
    );
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(mockRouterPush).toHaveBeenCalledWith("/waves?view=profile-feed");
  });

  it("opens modal when meta+k is pressed", async () => {
    useDeviceInfoMock.mockReturnValue({ isApp: false } as any);
    render(<HeaderSearchButton wave={null} />);
    expect(screen.queryByTestId("modal")).toBeNull();

    const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
    if (keyFilter(event)) {
      act(() => {
        keyCb(event);
      });
    }

    expect(await screen.findByTestId("modal")).toBeInTheDocument();
  });

  it("opens modal and prevents the browser shortcut for ctrl+k", async () => {
    useDeviceInfoMock.mockReturnValue({ isApp: false } as any);
    render(<HeaderSearchButton wave={null} />);

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      cancelable: true,
    });
    if (keyFilter(event)) {
      act(() => {
        keyCb(event);
      });
    }

    expect(event.defaultPrevented).toBe(true);
    expect(await screen.findByTestId("modal")).toBeInTheDocument();
  });

  it("opens the modal on a site-search request (the desktop app's Ctrl/Cmd+F)", async () => {
    useDeviceInfoMock.mockReturnValue({ isApp: false } as any);
    render(<HeaderSearchButton wave={null} />);
    expect(screen.queryByTestId("modal")).toBeNull();

    act(() => {
      requestSiteSearch();
    });

    expect(await screen.findByTestId("modal")).toBeInTheDocument();
  });

  it("opens site search, not the wave search, on a site-search request in a wave", async () => {
    useDeviceInfoMock.mockReturnValue({ isApp: false } as any);
    const wave = { id: "wave-1", name: "Design Wave" } as any;
    render(<HeaderSearchButton wave={wave} />);

    act(() => {
      requestSiteSearch();
    });

    expect(await screen.findByTestId("modal")).toBeInTheDocument();
    expect(screen.queryByTestId("wave-search-modal")).not.toBeInTheDocument();
  });

  it("uses a stronger icon stroke when app mode is true", () => {
    useDeviceInfoMock.mockReturnValue({ isApp: true } as any);
    render(<HeaderSearchButton wave={null} />);
    const icon = screen.getByTestId("icon");
    expect(icon).toHaveClass("tw-size-5");
    expect(icon).toHaveAttribute("stroke-width", "2");
  });

  it("opens the scoped message search in a wave and can switch to site search", async () => {
    useDeviceInfoMock.mockReturnValue({ isApp: false } as any);
    const wave = { id: "wave-1", name: "Design Wave" } as any;
    render(<HeaderSearchButton wave={wave} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Search messages in Design Wave",
      })
    );
    expect(await screen.findByTestId("wave-search-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Search all 6529" }));
    expect(screen.queryByTestId("wave-search-modal")).not.toBeInTheDocument();
    expect(await screen.findByTestId("modal")).toBeInTheDocument();
  });

  it("preserves existing query parameters when opening a wave result", async () => {
    useDeviceInfoMock.mockReturnValue({ isApp: false } as any);
    window.history.replaceState({}, "", "/waves/wave-1?divider=1&tab=chat");
    const wave = { id: "wave-1", name: "Design Wave" } as any;
    render(<HeaderSearchButton wave={wave} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Search messages in Design Wave",
      })
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Open result 42" })
    );

    expect(mockRouterReplace).toHaveBeenCalledWith(
      "/waves/wave-1?divider=1&tab=chat&serialNo=42",
      { scroll: false }
    );
  });
});
