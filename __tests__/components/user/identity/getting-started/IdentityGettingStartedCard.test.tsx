import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import IdentityGettingStartedCard from "@/components/user/identity/getting-started/IdentityGettingStartedCard";
import {
  hasIdentityGettingStartedSession,
  markIdentityGettingStartedSession,
} from "@/components/user/identity/getting-started/identityGettingStartedSession";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { amIUser } from "@/helpers/Helpers";

let mockHasHydrated = true;
let mockActiveProxy = false;
let mockSettings: { seizeSettings: { memes_wave_id?: string } } | undefined;

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { handle: "alice" },
    activeProfileProxy: mockActiveProxy,
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0xabc" }),
}));
jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettingsOptional: () => mockSettings,
}));
jest.mock("@/hooks/useHasHydrated", () => ({
  useHasHydrated: () => mockHasHydrated,
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/helpers/Helpers", () => ({ amIUser: jest.fn() }));
jest.mock(
  "@/components/brain/my-stream/tabs/MainStageNominationPopover",
  () => ({
    MainStageNominationPopoverContent: () => (
      <p>Nomination eligibility guidance</p>
    ),
  })
);
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => {
  return function Dialog({
    children,
    isOpen,
    title,
    onClose,
  }: {
    readonly children: ReactNode;
    readonly isOpen: boolean;
    readonly title: string;
    readonly onClose: () => void;
  }) {
    return isOpen ? (
      <div role="dialog" aria-label={title}>
        <button type="button" onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    ) : null;
  };
});
jest.mock(
  "@/components/user/identity/getting-started/IdentityGettingStartedAboutAction",
  () => () => <button type="button">Add an About statement</button>
);

const profile = Object.assign(new ApiIdentity(), {
  id: "alice-id",
  handle: "alice",
  primary_wallet: "0xabc",
});

describe("IdentityGettingStartedCard", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockHasHydrated = true;
    mockActiveProxy = false;
    mockSettings = undefined;
    jest.mocked(amIUser).mockReturnValue(true);
  });

  it("keeps the welcome and discovery available before Main Stage settings arrive", () => {
    markIdentityGettingStartedSession(profile.handle);
    render(<IdentityGettingStartedCard profile={profile} />);

    expect(
      screen.getByRole("region", { name: "Getting started with your identity" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your profile is ready" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Find a Wave" })).toHaveAttribute(
      "href",
      "/discover"
    );
    expect(
      screen.getByRole("link", { name: "How 6529 works" })
    ).toHaveAttribute("href", "/join-6529");
    expect(
      screen.queryByRole("link", { name: /The Memes Main Stage/ })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /How to submit to The Memes/ })
    ).toHaveAttribute("aria-haspopup", "dialog");
    expect(
      screen.queryByRole("link", { name: /Create a wave/ })
    ).not.toBeInTheDocument();
  });

  it("adds the configured canonical Main Stage link when settings resolve", () => {
    markIdentityGettingStartedSession(profile.handle);
    const { rerender } = render(
      <IdentityGettingStartedCard profile={profile} />
    );
    mockSettings = { seizeSettings: { memes_wave_id: " main-stage " } };
    rerender(<IdentityGettingStartedCard profile={profile} />);

    expect(
      screen.getByRole("link", { name: /The Memes Main Stage/ })
    ).toHaveAttribute("href", "/waves/main-stage");
  });

  it("does not present creation success to an ordinary returning profile", () => {
    render(<IdentityGettingStartedCard profile={profile} />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("opens the nomination explanation on request and keeps the welcome after closing it", () => {
    markIdentityGettingStartedSession(profile.handle);
    render(<IdentityGettingStartedCard profile={profile} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Nomination eligibility guidance")
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /How to submit to The Memes/ })
    );
    expect(
      screen.getByRole("dialog", { name: "How to submit to The Memes" })
    ).toHaveTextContent("Nomination eligibility guidance");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("region")).toBeInTheDocument();
    expect(hasIdentityGettingStartedSession("alice")).toBe(true);
  });

  it("waits for hydration before reading the creation session", () => {
    markIdentityGettingStartedSession(profile.handle);
    mockHasHydrated = false;
    const { rerender } = render(
      <IdentityGettingStartedCard profile={profile} />
    );
    expect(screen.queryByRole("region")).not.toBeInTheDocument();

    mockHasHydrated = true;
    rerender(<IdentityGettingStartedCard profile={profile} />);
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("hides a creation session from visitors", () => {
    markIdentityGettingStartedSession(profile.handle);
    jest.mocked(amIUser).mockReturnValue(false);
    render(<IdentityGettingStartedCard profile={profile} />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("hides a creation session while acting through a proxy", () => {
    markIdentityGettingStartedSession(profile.handle);
    mockActiveProxy = true;
    render(<IdentityGettingStartedCard profile={profile} />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("does not show success before a handle exists", () => {
    markIdentityGettingStartedSession(profile.handle);
    render(
      <IdentityGettingStartedCard profile={{ ...profile, handle: null }} />
    );
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("dismisses immediately and clears only this profile's creation session", () => {
    markIdentityGettingStartedSession("ALICE");
    markIdentityGettingStartedSession("bob");
    const { unmount } = render(
      <IdentityGettingStartedCard profile={profile} />
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss getting-started guidance" })
    );

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(hasIdentityGettingStartedSession("alice")).toBe(false);
    expect(hasIdentityGettingStartedSession("bob")).toBe(true);
    unmount();
    render(<IdentityGettingStartedCard profile={profile} />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
});
