import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HeaderSearchModal from "@/components/header/header-search/HeaderSearchModal";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

let clickAwayCb: () => void;
let escapeCb: () => void;
let enterCb: () => void;

const useQueryMock = jest.fn();
const useRouter = jest.fn();
const usePathname = jest.fn();
const useSearchParams = jest.fn();
const useWaves = jest.fn();
const useLocalPreference = jest.fn();

jest.mock("react-use", () => {
  const React = require("react");
  return {
    useClickAway: (_ref: any, cb: () => void) => {
      clickAwayCb = cb;
    },
    useKeyPressEvent: (key: string, cb: () => void) => {
      if (key === "Escape") {
        escapeCb = cb;
      } else if (key === "Enter") {
        enterCb = cb;
      }
    },
    useDebounce: (fn: () => void, _delay: number, deps: any[]) => {
      React.useEffect(fn, deps);
    },
  };
});

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: any[]) => useQueryMock(...args),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => useRouter(),
  usePathname: () => usePathname(),
  useSearchParams: () => useSearchParams(),
}));
jest.mock("@/hooks/useWaves", () => ({
  useWaves: (...args: any[]) => useWaves(...args),
}));
jest.mock(
  "@/hooks/useLocalPreference",
  () =>
    (...args: any[]) =>
      useLocalPreference(...args)
);
jest.mock(
  "@/components/header/header-search/HeaderSearchModalItem",
  () => (props: any) => <div data-testid="item">{JSON.stringify(props)}</div>
);

const profile = { handle: "alice", wallet: "0x1", display: "Alice", level: 1 };

function setup() {
  const push = jest.fn();
  const onClose = jest.fn();
  useRouter.mockReturnValue({ push });
  usePathname.mockReturnValue("/");
  useSearchParams.mockReturnValue(new URLSearchParams());
  useWaves.mockReturnValue({ waves: [], isFetching: false });
  useLocalPreference.mockReturnValue(["PROFILES", jest.fn()]);
  useQueryMock.mockImplementation(({ queryKey }) => {
    if (queryKey[0] === QueryKey.PROFILE_SEARCH) {
      return { isFetching: false, data: [profile] };
    }
    return { isFetching: false, data: [] };
  });
  render(<HeaderSearchModal onClose={onClose} />);
  return { onClose, push };
}

describe("HeaderSearchModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls onClose when escape is pressed", () => {
    const { onClose } = setup();
    escapeCb();
    expect(onClose).toHaveBeenCalled();
  });

  it("renders search results when query returns items", () => {
    setup();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(screen.getByTestId("item")).toBeInTheDocument();
  });

  it("triggers onClose on click away", () => {
    const { onClose } = setup();
    clickAwayCb();
    expect(onClose).toHaveBeenCalled();
  });

  it("navigates on enter key", () => {
    const { push } = setup();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "alice" } });
    enterCb();
    expect(push).toHaveBeenCalled();
  });
});
