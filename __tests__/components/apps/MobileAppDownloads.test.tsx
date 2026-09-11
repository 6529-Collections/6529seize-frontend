import { MobileAppDownload } from "@/components/apps/MobileAppDownloads";
import { MOBILE_APP_ANDROID, MOBILE_APP_IOS } from "@/constants/constants";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

describe("MobileAppDownload", () => {
  it("renders iOS link with default target", () => {
    render(<MobileAppDownload platform="iOS" />);
    const link = screen.getByRole("link", {
      name: "Download 6529 Mobile for iOS from the App Store",
    });
    expect(link).toHaveAttribute("href", MOBILE_APP_IOS);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAccessibleName(
      "Download 6529 Mobile for iOS from the App Store"
    );
    const img = link.querySelector("img")!;
    expect(img).toHaveAttribute("src", "/app-store.png");
    expect(img).toHaveAttribute("alt", "");
  });

  it("redirects at top level when target is _self", () => {
    render(<MobileAppDownload platform="Android" target="_self" />);
    const link = screen.getByRole("link", {
      name: "Download 6529 Mobile for Android from Google Play",
    });
    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    const wasNotPrevented = fireEvent(link, clickEvent);

    expect(link).toHaveAttribute("href", MOBILE_APP_ANDROID);
    expect(wasNotPrevented).toBe(false);
    expect(clickEvent.defaultPrevented).toBe(true);
  });
});
