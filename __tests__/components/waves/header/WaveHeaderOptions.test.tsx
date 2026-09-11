import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { createMockAuthContext } from "@/__tests__/utils/testContexts";
import { AuthContext } from "@/components/auth/Auth";
import WaveHeaderOptions from "@/components/waves/header/options/WaveHeaderOptions";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { AuthContextType } from "@/components/auth/Auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { WaveDeleteFlowProvider } from "@/components/waves/header/options/delete/WaveDeleteFlowContext";

type MobileWrapperMockProps = {
  readonly isOpen: boolean;
  readonly label?: string | undefined;
  readonly children: ReactNode;
  readonly onAfterLeave?: (() => void) | undefined;
};

type DeleteModalMockProps = {
  readonly isOpen: boolean;
  readonly closeModal: () => void;
};

type DeleteActionMockProps = {
  readonly isMobile?: boolean | undefined;
  readonly onDeleteRequest: () => void;
};

type ProfileWaveActionMockProps = {
  readonly wave: ApiWave;
  readonly isMobile?: boolean | undefined;
};

let clickAway: (event: Event) => void;
let escCb: () => void;
const mockMobileWrapper = jest.fn<void, [MobileWrapperMockProps]>();

jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock(
  "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper",
  () => ({
    __esModule: true,
    default: (props: MobileWrapperMockProps) => {
      mockMobileWrapper(props);
      return props.isOpen ? (
        <div role="dialog" aria-label={props.label}>
          {props.children}
        </div>
      ) : null;
    },
  })
);

jest.mock(
  "@/components/waves/header/options/delete/WaveDeleteModal",
  () => (props: DeleteModalMockProps) =>
    props.isOpen ? (
      <div role="dialog" aria-label="Delete wave confirmation">
        <button type="button" onClick={props.closeModal}>
          Cancel deletion
        </button>
      </div>
    ) : null
);

jest.mock("react-use", () => ({
  useClickAway: (_ref: unknown, cb: (event: Event) => void) => {
    clickAway = cb;
  },
  useKeyPressEvent: (_k: string, cb: () => void) => {
    escCb = cb;
  },
}));

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { readonly children: ReactNode }) => (
    <div data-animate-presence>{children}</div>
  ),
  LazyMotion: ({ children }: { readonly children: ReactNode }) => (
    <>{children}</>
  ),
  domAnimation: {},
  m: {
    div: (props: ComponentPropsWithoutRef<"div">) => <div {...props} />,
  },
  motion: {
    div: (props: ComponentPropsWithoutRef<"div">) => <div {...props} />,
  },
}));

jest.mock(
  "@/components/waves/header/options/delete/WaveDelete",
  () => (props: DeleteActionMockProps) => (
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
  () => (props: ProfileWaveActionMockProps) => (
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
} as unknown as ApiWave;

const createWrapper = (auth: Partial<AuthContextType> = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const authValue = createMockAuthContext({
    connectedProfile: null,
    activeProfileProxy: null,
    ...auth,
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <WaveDeleteFlowProvider>{children}</WaveDeleteFlowProvider>
      </AuthContext.Provider>
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

  const onAfterLeave = mockMobileWrapper.mock.calls.at(-1)?.[0].onAfterLeave;
  if (!onAfterLeave) {
    throw new Error("Expected the mobile options sheet to expose onAfterLeave");
  }
  act(onAfterLeave);

  expect(
    screen.getByRole("dialog", { name: "Delete wave confirmation" })
  ).toBeInTheDocument();
});

test("opens deletion confirmation if the viewport leaves mobile while deletion is pending", async () => {
  useIsMobileLayoutViewportMock.mockReturnValue(true);
  const user = userEvent.setup();

  const { rerender } = render(
    <WaveHeaderOptions
      key="mobile-options"
      wave={wave}
      showOwnerActions={true}
    />,
    {
      wrapper: createWrapper(),
    }
  );

  await user.click(screen.getByRole("button", { name: "Open options" }));
  await user.click(screen.getByTestId("delete"));

  const onAfterLeave = mockMobileWrapper.mock.calls.at(-1)?.[0].onAfterLeave;
  if (!onAfterLeave) {
    throw new Error("Expected the mobile options sheet to expose onAfterLeave");
  }

  useIsMobileLayoutViewportMock.mockReturnValue(false);
  rerender(
    <WaveHeaderOptions
      key="desktop-options"
      wave={wave}
      showOwnerActions={true}
    />
  );

  expect(
    screen.getByRole("dialog", { name: "Delete wave confirmation" })
  ).toBeInTheDocument();

  act(onAfterLeave);

  expect(
    screen.getAllByRole("dialog", { name: "Delete wave confirmation" })
  ).toHaveLength(1);
});

test("renders nothing when owner actions are hidden", () => {
  useIsMobileLayoutViewportMock.mockReturnValue(false);
  const { container } = render(
    <WaveHeaderOptions wave={wave} showOwnerActions={false} />,
    { wrapper: createWrapper() }
  );

  expect(container).toBeEmptyDOMElement();
  expect(screen.queryByRole("button", { name: /open options/i })).toBeNull();
  expect(screen.queryByTestId("delete")).toBeNull();
});
