import ProfileCollectedActivityLink from "@/components/user/collected/ProfileCollectedActivityLink";
import { render, screen } from "@testing-library/react";
import { usePathname, useSearchParams } from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe("ProfileCollectedActivityLink", () => {
  beforeEach(() => {
    jest.mocked(usePathname).mockReturnValue("/Shelby/collected");
    jest
      .mocked(useSearchParams)
      .mockReturnValue(
        new URLSearchParams(
          "activity=distributions&details=open&distribution-page=2&page=3&secret=value"
        ) as ReturnType<typeof useSearchParams>
      );
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
    }
  );
});
