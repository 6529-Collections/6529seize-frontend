/**
 * @jest-environment jsdom
 */

import AppsRoute, { metadata } from "@/app/about/6529-apps/page";
import { MOBILE_APP_ANDROID, MOBILE_APP_IOS } from "@/constants/constants";
import { fireEvent, render, screen } from "@testing-library/react";

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
  it("shows mobile downloads and lets users reveal Classic downloads", () => {
    render(<AppsRoute />);

    expect(
      screen.getByRole("heading", { level: 1, name: "6529 Apps" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "6529 Mobile" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "6529 Desktop Classic" })
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
    const classic = screen.getByRole("button", { name: "6529 Desktop Classic" });
    const downloads = screen.getByText("Windows macOS Linux");
    const controlled = downloads.closest("#desktop-classic-downloads");
    expect(classic).toHaveAttribute("aria-controls", "desktop-classic-downloads");
    expect(classic).toHaveAttribute("aria-expanded", "false");
    expect(controlled).toHaveAttribute("inert");

    fireEvent.click(classic);
    expect(classic).toHaveAttribute("aria-expanded", "true");
    expect(controlled).not.toHaveAttribute("inert");

    fireEvent.click(classic);
    expect(classic).toHaveAttribute("aria-expanded", "false");
    expect(controlled).toHaveAttribute("inert");
  });

  it("uses searchable app terms in metadata", () => {
    expect(metadata.title).toBe("6529 Apps");
    expect(metadata.description).toContain("6529 Mobile");
    expect(metadata.description).toContain("6529 Desktop");
  });

  it("links the Desktop test release card to the download page", () => {
    render(<AppsRoute />);

    const desktopLink = screen.getByRole("link", { name: "6529 Desktop" });
    expect(desktopLink).toHaveAttribute("href", "/desktop");
    expect(desktopLink).toHaveAccessibleDescription(
      "Test release for Windows and Apple silicon Macs."
    );
    expect(desktopLink).toContainElement(
      screen.getByRole("heading", { level: 2, name: "6529 Desktop" })
    );
  });

  it("lists the app cards in order and links the entire Validator card", () => {
    render(<AppsRoute />);

    const validatorLink = screen.getByRole("link", {
      name: "6529 Validator",
    });
    expect(validatorLink).toHaveAttribute("href", "/validator");
    expect(validatorLink).toHaveAccessibleDescription(
      "Read more about 6529 validator"
    );
    expect(
      screen.queryByRole("region", { name: "6529 Validator" })
    ).not.toBeInTheDocument();
    expect(validatorLink).toContainElement(
      screen.getByRole("heading", { level: 2, name: "6529 Validator" })
    );
    expect(screen.getAllByRole("heading", { level: 2 })).toEqual(
      [
        "6529 Mobile",
        "6529 Desktop",
        "6529 Desktop Classic",
        "6529 Validator",
        "6529 AI",
      ].map((name) => screen.getByRole("heading", { level: 2, name }))
    );
  });

  it("links the entire 6529 AI card to its download page", () => {
    render(<AppsRoute />);

    const aiLink = screen.getByRole("link", { name: "6529 AI" });
    expect(aiLink).toHaveAttribute("href", "/ai");
    expect(aiLink).toHaveAccessibleDescription(
      "Run open-weights AI models on your own computer, and chat with them in your browser"
    );
    expect(aiLink).toContainElement(
      screen.getByRole("heading", { level: 2, name: "6529 AI" })
    );
  });
});
