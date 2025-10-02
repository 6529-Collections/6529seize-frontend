import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HeaderSearchButton from "@/components/header/header-search/HeaderSearchButton";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useClickAway, useKey, useKeyPressEvent } from "react-use";

jest.mock("focus-trap-react", () => jest.requireActual("focus-trap-react"));
jest.mock("react-use");

const useQueryMock = jest.fn();
const useRouterMock = jest.fn();
const usePathnameMock = jest.fn();
const useSearchParamsMock = jest.fn();
const useWavesMock = jest.fn();
const useLocalPreferenceMock = jest.fn();
const useKeyMock = useKey as jest.MockedFunction<typeof useKey>;
const useClickAwayMock = useClickAway as jest.MockedFunction<typeof useClickAway>;
const useKeyPressEventMock =
  useKeyPressEvent as jest.MockedFunction<typeof useKeyPressEvent>;

let escapeHandler: (() => void) | null = null;

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: any[]) => useQueryMock(...args),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => useRouterMock(),
  usePathname: () => usePathnameMock(),
  useSearchParams: () => useSearchParamsMock(),
}));

jest.mock("@/hooks/useWaves", () => ({
  useWaves: (...args: any[]) => useWavesMock(...args),
}));

jest.mock("@/hooks/useLocalPreference", () => ({
  __esModule: true,
  default: (...args: any[]) => useLocalPreferenceMock(...args),
}));

jest.mock("@/components/utils/animation/CommonAnimationWrapper", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/utils/animation/CommonAnimationOpacity", () => ({
  __esModule: true,
  default: ({ children, elementRole }: any) => (
    <div role={elementRole}>{children}</div>
  ),
}));

jest.mock("@/hooks/useDeviceInfo");

const useDeviceInfoMock = useDeviceInfo as jest.MockedFunction<
  typeof useDeviceInfo
>;

beforeEach(() => {
  jest.clearAllMocks();
  escapeHandler = null;
  useKeyMock.mockImplementation(() => {});
  useClickAwayMock.mockImplementation(() => {});
  useKeyPressEventMock.mockImplementation(
    (targetKey: string, handler: () => void) => {
      if (targetKey === "Escape") {
        escapeHandler = handler;
      }
    }
  );
  useQueryMock.mockImplementation(({ queryKey }) => {
    switch (queryKey[0]) {
      case QueryKey.PROFILE_SEARCH:
      case QueryKey.NFTS_SEARCH:
        return { isFetching: false, data: [] };
      default:
        return { isFetching: false, data: [] };
    }
  });
  useRouterMock.mockReturnValue({ push: jest.fn() });
  usePathnameMock.mockReturnValue("/");
  useSearchParamsMock.mockReturnValue(new URLSearchParams());
  useWavesMock.mockReturnValue({ waves: [], isFetching: false });
  useLocalPreferenceMock.mockReturnValue(["PROFILES", jest.fn()]);
  useDeviceInfoMock.mockReturnValue({ isApp: false } as any);
});

describe("HeaderSearchModal focus management", () => {
  it("keeps focus trapped within the modal while it is open", async () => {
    const user = userEvent.setup();
    render(<HeaderSearchButton />);

    const trigger = screen.getByRole("button", { name: /search/i });
    await user.click(trigger);

    const input = await screen.findByPlaceholderText("Search");
    await waitFor(() => expect(input).toHaveFocus());

    await screen.findByRole("dialog");
    const modalRoot = document.body.querySelector(
      ".tailwind-scope.tw-cursor-default.tw-relative.tw-z-1000"
    ) as HTMLElement | null;
    expect(modalRoot).not.toBeNull();

    for (let i = 0; i < 6; i += 1) {
      await user.tab();
      const activeElement = document.activeElement as HTMLElement | null;
      expect(activeElement).not.toBe(trigger);
      expect(activeElement).not.toBe(document.body);
      expect(activeElement && modalRoot?.contains(activeElement)).toBe(true);
    }

    await user.tab({ shift: true });
    const activeElement = document.activeElement as HTMLElement | null;
    expect(activeElement).not.toBe(trigger);
    expect(activeElement).not.toBe(document.body);
    expect(activeElement && modalRoot?.contains(activeElement)).toBe(true);
  });

  it("returns focus to the trigger button when the modal closes", async () => {
    const user = userEvent.setup();
    render(<HeaderSearchButton />);

    const trigger = screen.getByRole("button", { name: /search/i });
    await user.click(trigger);

    const closeButton = await screen.findByRole("button", {
      name: /close search/i,
    });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Search")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    await user.keyboard("[Space]");

    await screen.findByPlaceholderText("Search");

    expect(escapeHandler).not.toBeNull();

    act(() => {
      escapeHandler?.();
    });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Search")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });
});
