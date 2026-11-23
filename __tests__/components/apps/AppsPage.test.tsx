import { render, screen } from "@testing-library/react";
import AppsPage from "@/components/apps/AppsPage";

jest.mock("@/components/about/AboutContentsDropdown", () => ({
  AboutContentsDropdown: () => null,
}));

jest.mock("@/components/apps/DesktopAppDownloads", () => ({
  DesktopAppDownloads: () => null,
}));

jest.mock("@/contexts/TitleContext", () => ({
  useSetTitle: jest.fn(),
}));

it("exposes the new test release and Desktop Classic as distinct apps", () => {
  render(<AppsPage />);

  const testRelease = screen.getByRole("link", {
    name: "6529 Desktop",
    exact: true,
  });
  expect(testRelease).toHaveAttribute("href", "/desktop");
  expect(testRelease).toHaveAccessibleDescription(
    "Test release for Windows and Apple silicon Macs."
  );
  expect(
    screen.getByRole("heading", { name: "6529 Desktop Classic", exact: true })
  ).toBeVisible();
});
