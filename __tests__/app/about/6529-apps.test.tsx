/**
 * @jest-environment jsdom
 */

import AppsRoute, { metadata } from "@/app/about/6529-apps/page";
import { MOBILE_APP_ANDROID, MOBILE_APP_IOS } from "@/constants/constants";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/about/AboutContentsDropdown", () => ({
  AboutContentsDropdown: () => <nav aria-label="About contents" />,
}));

jest.mock("@/components/apps/DesktopAppDownloads", () => ({
  DesktopAppDownloads: () => <div>Windows macOS Linux</div>,
}));

jest.mock("@/contexts/TitleContext", () => ({
  useSetTitle: jest.fn(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
}));

describe("6529 Apps page", () => {
  it("shows mobile and desktop downloads together", () => {
    render(<AppsRoute />);

    expect(
      screen.getByRole("heading", { level: 1, name: "6529 Apps" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "6529 Mobile" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "6529 Desktop" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Download 6529 Mobile for iOS from the App Store",
      })
    ).toHaveAttribute("href", MOBILE_APP_IOS);
    expect(
      screen.getByRole("link", {
        name: "Download 6529 Mobile for Android from Google Play",
      })
    ).toHaveAttribute("href", MOBILE_APP_ANDROID);
    expect(screen.getByText("Windows macOS Linux")).toBeInTheDocument();
  });

  it("uses searchable app terms in metadata", () => {
    expect(metadata.title).toBe("6529 Apps");
    expect(metadata.description).toContain("6529 Mobile");
    expect(metadata.description).toContain("6529 Desktop");
  });
});
