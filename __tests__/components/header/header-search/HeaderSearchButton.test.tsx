import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import HeaderSearchButton from "@/components/header/header-search/HeaderSearchButton";
import useDeviceInfo from "@/hooks/useDeviceInfo";

let keyFilter: (e: KeyboardEvent) => boolean;
let keyCb: (event: KeyboardEvent) => void;
const mockRouterReplace = jest.fn();

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
  useRouter: () => ({ replace: mockRouterReplace }),
  usePathname: () => "/waves/wave-1",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/contexts/wave/WaveChatScrollContext", () => ({
  useWaveChatScrollOptional: () => null,
}));

jest.mock("@heroicons/react/24/outline", () => ({
  MagnifyingGlassIcon: (props: any) => <svg data-testid="icon" {...props} />,
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

  it("opens modal when button is clicked and closes via onClose", () => {
    useDeviceInfoMock.mockReturnValue({ isApp: false } as any);
    render(<HeaderSearchButton wave={null} />);
    expect(screen.queryByTestId("modal")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(screen.getByTestId("modal")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("modal"));
    expect(screen.queryByTestId("modal")).toBeNull();
  });

  it("opens modal when meta+k is pressed", () => {
    useDeviceInfoMock.mockReturnValue({ isApp: false } as any);
    render(<HeaderSearchButton wave={null} />);
    expect(screen.queryByTestId("modal")).toBeNull();

    const event = new KeyboardEvent("keydown", { key: "k", metaKey: true });
    if (keyFilter(event)) {
      act(() => {
        keyCb(event);
      });
    }

    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });

  it("opens modal and prevents the browser shortcut for ctrl+k", () => {
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
    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });

  it("uses larger icon when app mode is true", () => {
    useDeviceInfoMock.mockReturnValue({ isApp: true } as any);
    render(<HeaderSearchButton wave={null} />);
    const icon = screen.getByTestId("icon");
    expect(icon).toHaveClass("tw-h-6 tw-w-6");
  });

  it("opens the scoped message search in a wave and can switch to site search", () => {
    useDeviceInfoMock.mockReturnValue({ isApp: false } as any);
    const wave = { id: "wave-1", name: "Design Wave" } as any;
    render(<HeaderSearchButton wave={wave} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Search messages in Design Wave",
      })
    );
    expect(screen.getByTestId("wave-search-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Search all 6529" }));
    expect(screen.queryByTestId("wave-search-modal")).not.toBeInTheDocument();
    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });

  it("preserves existing query parameters when opening a wave result", () => {
    useDeviceInfoMock.mockReturnValue({ isApp: false } as any);
    window.history.replaceState({}, "", "/waves/wave-1?divider=1&tab=chat");
    const wave = { id: "wave-1", name: "Design Wave" } as any;
    render(<HeaderSearchButton wave={wave} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Search messages in Design Wave",
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Open result 42" }));

    expect(mockRouterReplace).toHaveBeenCalledWith(
      "/waves/wave-1?divider=1&tab=chat&serialNo=42",
      { scroll: false }
    );
  });
});
