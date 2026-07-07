import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { AuthContext } from "@/components/auth/Auth";
import WaveHeaderOptions from "@/components/waves/header/options/WaveHeaderOptions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

let clickAway: (event: Event) => void;
let escCb: () => void;

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
  motion: { div: (props: any) => <div {...props} /> },
}));

jest.mock(
  "@/components/waves/header/options/delete/WaveDelete",
  () => (props: any) => <div data-testid="delete" data-wave={props.wave.id} />
);

jest.mock(
  "@/components/waves/header/options/profile-wave/WaveProfileWaveAction",
  () => (props: any) => (
    <div data-testid="profile-wave" data-wave={props.wave.id} />
  )
);

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
  const user = userEvent.setup();
  const { rerender } = render(<WaveHeaderOptions wave={wave} />, {
    wrapper: createWrapper(),
  });
  const btn = screen.getByRole("button");
  expect(btn).toHaveClass("tw-size-8", "desktop-hover:hover:tw-bg-iron-700");
  expect(btn).not.toHaveClass("tw-size-9");
  await user.click(btn);
  expect(screen.getByTestId("delete")).toHaveAttribute("data-wave", "w1");
  expect(screen.getByTestId("profile-wave")).toHaveAttribute("data-wave", "w1");
  expect(screen.queryByText("Mute")).not.toBeInTheDocument();
  clickAway({ target: document.body } as unknown as Event);
  rerender(<WaveHeaderOptions wave={wave} />);
  expect(screen.queryByTestId("delete")).toBeNull();
  await user.click(btn);
  escCb();
  rerender(<WaveHeaderOptions wave={wave} />);
  expect(screen.queryByTestId("delete")).toBeNull();
});

test("renders nothing when owner actions are hidden", () => {
  const { container } = render(
    <WaveHeaderOptions wave={wave} showOwnerActions={false} />,
    { wrapper: createWrapper({ connectedProfile: { handle: "alice" } }) }
  );

  expect(container).toBeEmptyDOMElement();
  expect(screen.queryByRole("button", { name: /open options/i })).toBeNull();
  expect(screen.queryByTestId("delete")).toBeNull();
});
