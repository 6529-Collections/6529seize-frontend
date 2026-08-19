import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { AuthContext } from "@/components/auth/Auth";
import WaveHeaderOptions from "@/components/waves/header/options/WaveHeaderOptions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";

let clickAway: (event: Event) => void;
let escCb: () => void;
const mockMobileWrapper = jest.fn();

jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock(
  "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper",
  () => ({
    __esModule: true,
    default: (props: any) => {
      mockMobileWrapper(props);
      return props.isOpen ? (
        <div role="dialog" aria-label={props.label}>
          {props.children}
        </div>
      ) : null;
    },
  })
);

jest.mock("@/components/utils/animation/CommonAnimationWrapper", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

jest.mock("@/components/utils/animation/CommonAnimationOpacity", () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));

jest.mock(
  "@/components/waves/header/options/delete/WaveDeleteModal",
  () => (props: any) => (
    <div role="dialog" aria-label="Delete wave confirmation">
      <button type="button" onClick={props.closeModal}>
        Cancel deletion
      </button>
    </div>
  )
);

jest.mock("react-use", () => ({
  useClickAway: (_ref: any, cb: (event: Event) => void) => {
    clickAway = cb;
  },
  useKeyPressEvent: (_k: string, cb: () => void) => {
    escCb = cb;
  },
}));

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: any) => (
    <div data-animate-presence>{children}</div>
  ),
  LazyMotion: ({ children }: any) => <>{children}</>,
  domAnimation: {},
  m: { div: (props: any) => <div {...props} /> },
  motion: { div: (props: any) => <div {...props} /> },
}));

jest.mock(
  "@/components/waves/header/options/delete/WaveDelete",
  () => (props: any) => (
    <button
      type="button"
      data-testid="delete"
      data-mobile={String(props.isMobile)}
      onClick={props.onDeleteRequest}
    >
      Delete
    </button>
  )
);

jest.mock(
  "@/components/waves/header/options/profile-wave/WaveProfileWaveAction",
  () => (props: any) => (
    <div
      data-testid="profile-wave"
      data-wave={props.wave.id}
      data-mobile={String(props.isMobile)}
    />
  )
);

const useIsMobileLayoutViewportMock =
  useIsMobileLayoutViewport as jest.MockedFunction<
    typeof useIsMobileLayoutViewport
  >;

const wave = {
  id: "w1",
  metrics: { muted: false },
  chat: { scope: { group: { is_direct_message: false } } },
  parent_wave: null,
  wave: { authenticated_user_eligible_for_admin: false },
} as any;

const createWrapper = (auth: any = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const authValue = {
    connectedProfile: null,
    activeProfileProxy: null,
    ...auth,
  };

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  );
};

test("opens and closes options", async () => {
  useIsMobileLayoutViewportMock.mockReturnValue(false);
  const user = userEvent.setup();
  const { rerender } = render(
    <WaveHeaderOptions wave={wave} showOwnerActions={true} />,
    {
      wrapper: createWrapper(),
    }
  );
  const btn = screen.getByRole("button");
  expect(btn).toHaveClass("tw-size-8", "desktop-hover:hover:tw-bg-iron-700");
  expect(btn).not.toHaveClass("tw-size-9");
  await user.click(btn);
  expect(screen.getByTestId("delete")).toHaveAttribute("data-mobile", "false");
  expect(screen.getByTestId("profile-wave")).toHaveAttribute("data-wave", "w1");
  expect(screen.queryByText("Mute")).not.toBeInTheDocument();
  clickAway({ target: document.body } as unknown as Event);
  rerender(<WaveHeaderOptions wave={wave} showOwnerActions={true} />);
  expect(screen.queryByTestId("delete")).toBeNull();
  await user.click(btn);
  escCb();
  rerender(<WaveHeaderOptions wave={wave} showOwnerActions={true} />);
  expect(screen.queryByTestId("delete")).toBeNull();
});

test("uses a bottom sheet on mobile and waits for it to close before deletion confirmation", async () => {
  useIsMobileLayoutViewportMock.mockReturnValue(true);
  const user = userEvent.setup();

  render(<WaveHeaderOptions wave={wave} showOwnerActions={true} />, {
    wrapper: createWrapper(),
  });

  const trigger = screen.getByRole("button", { name: "Open options" });
  expect(trigger).toHaveAttribute("aria-haspopup", "dialog");

  await user.click(trigger);

  expect(
    screen.getByRole("dialog", { name: "Wave options" })
  ).toBeInTheDocument();
  expect(screen.getByTestId("delete")).toHaveAttribute("data-mobile", "true");
  expect(screen.getByTestId("profile-wave")).toHaveAttribute(
    "data-mobile",
    "true"
  );

  await user.click(screen.getByTestId("delete"));

  expect(
    screen.queryByRole("dialog", { name: "Wave options" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("dialog", { name: "Delete wave confirmation" })
  ).not.toBeInTheDocument();

  const lastMobileWrapperCall =
    mockMobileWrapper.mock.calls[mockMobileWrapper.mock.calls.length - 1][0];
  act(() => lastMobileWrapperCall.onAfterLeave());

  expect(
    screen.getByRole("dialog", { name: "Delete wave confirmation" })
  ).toBeInTheDocument();
});

test("renders nothing when owner actions are hidden", () => {
  useIsMobileLayoutViewportMock.mockReturnValue(false);
  const { container } = render(
    <WaveHeaderOptions wave={wave} showOwnerActions={false} />,
    { wrapper: createWrapper({ connectedProfile: { handle: "alice" } }) }
  );

  expect(container).toBeEmptyDOMElement();
  expect(screen.queryByRole("button", { name: /open options/i })).toBeNull();
  expect(screen.queryByTestId("delete")).toBeNull();
});
