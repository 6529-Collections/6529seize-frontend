import ProfileCollectedActivityLink from "@/components/user/collected/ProfileCollectedActivityLink";
import { render, screen } from "@testing-library/react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";

type NavigateEvent = { preventDefault: () => void };
let mockNavigate: ((event: NavigateEvent) => void) | undefined;

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    onNavigate,
    ...props
  }: ComponentProps<"a"> & {
    onNavigate?: (event: NavigateEvent) => void;
  }) => {
    mockNavigate = onNavigate;
    return <a {...props} />;
  },
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe("ProfileCollectedActivityLink", () => {
  beforeEach(() => {
    mockNavigate = undefined;
    globalThis.history.replaceState(null, "", "/");
    jest.mocked(usePathname).mockReturnValue("/Shelby/collected");
    jest
      .mocked(useSearchParams)
      .mockReturnValue(
        new URLSearchParams(
          "activity=distributions&details=open&distribution-page=2&page=3&secret=value"
        ) as ReturnType<typeof useSearchParams>
      );
  });

  it("saves the activity anchor in the existing history entry before navigation", () => {
    const state = { __NA: true, tree: { route: "collected" } };
    const source =
      "/Shelby/collected?activity=distributions&page=3&distribution-page=2&details=open";
    globalThis.history.replaceState(state, "", source);
    const entries = globalThis.history.length;
    render(
      <ProfileCollectedActivityLink
        href="/the-memes/42"
        activityKey="wallet-42"
      >
        Artwork
      </ProfileCollectedActivityLink>
    );
    mockNavigate!({ preventDefault: jest.fn() });
    expect(globalThis.location.pathname + globalThis.location.search).toBe(
      source
    );
    expect(globalThis.location.hash).toBe("#collected-activity-wallet-42");
    expect(globalThis.history.state).toEqual(state);
    expect(globalThis.history.length).toBe(entries);
  });

  it("leaves history untouched when a caller cancels navigation", () => {
    globalThis.history.replaceState(
      null,
      "",
      "/Shelby/collected?page=3#previous"
    );
    const preventDefault = jest.fn();
    render(
      <ProfileCollectedActivityLink
        href="/the-memes/42"
        activityKey="wallet-42"
        onNavigate={(event) => event.preventDefault()}
      >
        Artwork
      </ProfileCollectedActivityLink>
    );
    mockNavigate!({ preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(globalThis.location.hash).toBe("#previous");
  });

  it("returns to the same activity row and preserves both page selections", () => {
    render(
      <ProfileCollectedActivityLink
        href="/the-memes/42"
        activityKey="distribution-MEMES-42-0xabc"
      >
        Artwork
      </ProfileCollectedActivityLink>
    );
    const href = screen.getByRole("link").getAttribute("href")!;
    expect(new URL(href, "https://6529.io").searchParams.get("returnTo")).toBe(
      "/Shelby/collected?activity=distributions&details=open&distribution-page=2&page=3#collected-activity-distribution-MEMES-42-0xabc"
    );
  });

  it("restores focus and scroll to the originating activity link", () => {
    const originalScroll = Element.prototype.scrollIntoView;
    const scroll = jest.fn();
    Element.prototype.scrollIntoView = scroll;
    globalThis.history.replaceState(null, "", "/#collected-activity-wallet-42");
    const view = render(
      <ProfileCollectedActivityLink
        href="/the-memes/42"
        activityKey="wallet-42"
      >
        Artwork
      </ProfileCollectedActivityLink>
    );
    expect(screen.getByRole("link")).toHaveFocus();
    expect(scroll).toHaveBeenCalledWith({ block: "center" });
    screen.getByRole("link").blur();
    view.rerender(
      <ProfileCollectedActivityLink
        href="/the-memes/42"
        activityKey="wallet-42"
      >
        Updated artwork
      </ProfileCollectedActivityLink>
    );
    expect(screen.getByRole("link")).not.toHaveFocus();
    expect(scroll).toHaveBeenCalledTimes(1);
    globalThis.history.replaceState(null, "", "/");
    Element.prototype.scrollIntoView = originalScroll;
  });

  it.each(["/Shelby/identity", "/%2F/collected"])(
    "leaves token links unchanged for an invalid return path: %s",
    (pathname) => {
      jest.mocked(usePathname).mockReturnValue(pathname);
      render(
        <ProfileCollectedActivityLink
          href="/the-memes/42"
          activityKey="wallet-42"
        >
          Artwork
        </ProfileCollectedActivityLink>
      );
      expect(screen.getByRole("link")).toHaveAttribute("href", "/the-memes/42");
      mockNavigate!({ preventDefault: jest.fn() });
      expect(globalThis.location.hash).toBe("");
    }
  );
});
