import { StrictMode, type ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import IdentityGettingStartedCard from "@/components/user/identity/getting-started/IdentityGettingStartedCard";
import {
  consumeIdentityGettingStartedArrival,
  hasIdentityGettingStartedSession,
  markIdentityGettingStartedSession,
  requestIdentityGettingStartedArrival,
} from "@/components/user/identity/getting-started/identityGettingStartedSession";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { amIUser } from "@/helpers/Helpers";

let mockHasHydrated = true;
let mockActiveProxy = false;
let mockIsTouchDevice = true;
let mockIsCapacitor = false;
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
jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: () => mockIsTouchDevice,
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: mockIsCapacitor }),
}));
jest.mock("@/helpers/Helpers", () => ({ amIUser: jest.fn() }));
jest.mock(
  "@/components/brain/my-stream/tabs/MainStageNominationPopover",
  () => ({
    __esModule: true,
    default: ({ children }: { readonly children: ReactNode }) => children,
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

const profile = Object.assign(new ApiIdentity(), {
  id: "alice-id",
  handle: "alice",
  primary_wallet: "0xabc",
});

describe("IdentityGettingStartedCard", () => {
  const frames = new Map<number, FrameRequestCallback>();
  const scrollIntoView = jest.fn();
  let nextFrameId = 1;
  let reducedMotion = false;

  function flushFrames() {
    act(() => {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(0));
    });
  }

  beforeEach(() => {
    sessionStorage.clear();
    frames.clear();
    scrollIntoView.mockClear();
    nextFrameId = 1;
    reducedMotion = false;
    mockHasHydrated = true;
    mockActiveProxy = false;
    mockIsTouchDevice = true;
    mockIsCapacitor = false;
    mockSettings = undefined;
    jest.mocked(amIUser).mockReturnValue(true);
    jest
      .spyOn(Element.prototype, "scrollIntoView")
      .mockImplementation(scrollIntoView);
    jest
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback) => {
        const id = nextFrameId++;
        frames.set(id, callback);
        return id;
      });
    jest.spyOn(globalThis, "cancelAnimationFrame").mockImplementation((id) => {
      frames.delete(id);
    });
    jest.spyOn(globalThis, "matchMedia").mockImplementation((query) => ({
      matches: reducedMotion && query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
      screen.queryByRole("button", { name: /About statement/ })
    ).not.toBeInTheDocument();
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

  it.each([
    { touch: true, native: false },
    { touch: false, native: true },
  ])(
    "keeps the nomination dialog for touch=$touch, native=$native",
    ({ touch, native }) => {
      mockIsTouchDevice = touch;
      mockIsCapacitor = native;
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
    }
  );

  it("delegates desktop submission guidance to the popover without opening the touch dialog", () => {
    mockIsTouchDevice = false;
    markIdentityGettingStartedSession(profile.handle);
    render(<IdentityGettingStartedCard profile={profile} />);

    fireEvent.click(
      screen.getByRole("button", { name: /How to submit to The Memes/ })
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("region")).toBeInTheDocument();
    expect(hasIdentityGettingStartedSession("alice")).toBe(true);
  });

  it("waits for hydration before reading the creation session", () => {
    markIdentityGettingStartedSession(profile.handle);
    requestIdentityGettingStartedArrival(profile.handle);
    mockHasHydrated = false;
    const { rerender } = render(
      <IdentityGettingStartedCard profile={profile} />
    );
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    flushFrames();
    expect(scrollIntoView).not.toHaveBeenCalled();

    mockHasHydrated = true;
    rerender(<IdentityGettingStartedCard profile={profile} />);
    expect(screen.getByRole("region")).toBeInTheDocument();
    flushFrames();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("hides a creation session from visitors", () => {
    markIdentityGettingStartedSession(profile.handle);
    requestIdentityGettingStartedArrival(profile.handle);
    jest.mocked(amIUser).mockReturnValue(false);
    render(<IdentityGettingStartedCard profile={profile} />);
    flushFrames();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(consumeIdentityGettingStartedArrival(profile.handle)).toBe(true);
  });

  it("hides a creation session while acting through a proxy", () => {
    markIdentityGettingStartedSession(profile.handle);
    requestIdentityGettingStartedArrival(profile.handle);
    mockActiveProxy = true;
    render(<IdentityGettingStartedCard profile={profile} />);
    flushFrames();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(consumeIdentityGettingStartedArrival(profile.handle)).toBe(true);
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
    requestIdentityGettingStartedArrival("ALICE");
    markIdentityGettingStartedSession("bob");
    requestIdentityGettingStartedArrival("bob");
    const { unmount } = render(
      <IdentityGettingStartedCard profile={profile} />
    );
    const dismissGuide = screen.getByRole("button", { name: "Dismiss guide" });
    expect(dismissGuide).toHaveAccessibleName("Dismiss guide");
    expect(dismissGuide).toHaveTextContent(/^$/);
    expect(screen.queryByText("Profile created")).not.toBeInTheDocument();
    fireEvent.click(dismissGuide);
    flushFrames();

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(hasIdentityGettingStartedSession("alice")).toBe(false);
    expect(consumeIdentityGettingStartedArrival("alice")).toBe(false);
    expect(hasIdentityGettingStartedSession("bob")).toBe(true);
    expect(consumeIdentityGettingStartedArrival("bob")).toBe(true);
    unmount();
    render(<IdentityGettingStartedCard profile={profile} />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("reveals the newly created profile once without changing keyboard focus", () => {
    markIdentityGettingStartedSession(profile.handle);
    requestIdentityGettingStartedArrival(profile.handle);
    const { rerender, unmount } = render(
      <StrictMode>
        <button type="button">Continue editing</button>
        <IdentityGettingStartedCard profile={profile} />
      </StrictMode>
    );
    const previousFocus = screen.getByRole("button", {
      name: "Continue editing",
    });
    previousFocus.focus();
    const focus = jest.spyOn(HTMLElement.prototype, "focus");

    expect(scrollIntoView).not.toHaveBeenCalled();
    flushFrames();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      behavior: "smooth",
    });
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByRole("region"));
    expect(focus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(previousFocus);
    expect(hasIdentityGettingStartedSession(profile.handle)).toBe(true);

    rerender(
      <StrictMode>
        <button type="button">Continue editing</button>
        <IdentityGettingStartedCard profile={profile} />
      </StrictMode>
    );
    flushFrames();
    unmount();
    render(<IdentityGettingStartedCard profile={profile} />);
    flushFrames();

    expect(screen.getByRole("region")).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(consumeIdentityGettingStartedArrival(profile.handle)).toBe(false);
  });

  it("uses instant arrival scrolling when reduced motion is preferred", () => {
    reducedMotion = true;
    markIdentityGettingStartedSession(profile.handle);
    requestIdentityGettingStartedArrival(profile.handle);
    render(<IdentityGettingStartedCard profile={profile} />);
    flushFrames();

    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      behavior: "instant",
    });
  });

  it("cancels a pending reveal on unmount and keeps it for the next mount", () => {
    markIdentityGettingStartedSession(profile.handle);
    requestIdentityGettingStartedArrival(profile.handle);
    const { unmount } = render(
      <IdentityGettingStartedCard profile={profile} />
    );
    unmount();
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    flushFrames();

    expect(scrollIntoView).not.toHaveBeenCalled();

    render(<IdentityGettingStartedCard profile={profile} />);
    flushFrames();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(consumeIdentityGettingStartedArrival(profile.handle)).toBe(false);
  });

  it("keeps a returning profile's guide visible without replaying arrival", () => {
    markIdentityGettingStartedSession(profile.handle);
    render(<IdentityGettingStartedCard profile={profile} />);
    flushFrames();

    expect(screen.getByRole("region")).toBeInTheDocument();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
