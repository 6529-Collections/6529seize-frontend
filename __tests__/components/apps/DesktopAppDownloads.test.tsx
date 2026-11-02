import { fireEvent, render, screen, within } from "@testing-library/react";
import { DesktopAppDownloads } from "@/components/apps/DesktopAppDownloads";
import type { DesktopAppVersion } from "@/components/apps/appDownloads";

const refetch = jest.fn();
let query: {
  data?: DesktopAppVersion[];
  isLoading?: boolean;
  isError?: boolean;
  refetch: typeof refetch;
};
jest.mock("@tanstack/react-query", () => ({ useQuery: () => query }));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
}));

const app: DesktopAppVersion = {
  name: "mac",
  displayName: "macOS",
  image: "/macos.png",
  hasUnavailableRelease: false,
  releases: [
    {
      version: "0.3.16",
      legacyMac: false,
      minimumMacOS: 13,
      downloads: [
        {
          label: "appleSilicon",
          format: "DMG",
          fileName: "current.dmg",
          url: "https://example.com/current.dmg",
        },
      ],
    },
    {
      version: "0.3.15",
      legacyMac: true,
      minimumMacOS: 12,
      downloads: [
        {
          label: "intel",
          format: "DMG",
          fileName: "legacy.dmg",
          url: "https://example.com/legacy.dmg",
          arweaveUrl: "https://arweave.net/mirror",
        },
      ],
    },
  ],
};
describe("DesktopAppDownloads", () => {
  beforeEach(() => {
    jest.spyOn(navigator, "platform", "get").mockReturnValue("MacIntel");
    refetch.mockReset();
    query = { data: [app], refetch };
  });
  afterEach(() => jest.restoreAllMocks());
  it("keeps the accordion header OS-only and places requirements beside versions", () => {
    const { container } = render(<DesktopAppDownloads />);
    expect(container.querySelector("summary")!.textContent).toBe("macOS");
    expect(screen.getByText("Requires macOS 13 or later")).toBeInTheDocument();
    expect(
      screen.getByText("Last compatible version for macOS 12 Monterey")
    ).toBeInTheDocument();
    expect(screen.getByText(/Reinstall 0.3.15/)).toBeInTheDocument();
    expect(screen.queryByText("Latest")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Download 6529 Desktop for macOS, version 0.3.16, Apple silicon",
      })
    ).toHaveAttribute("href", "https://example.com/current.dmg");
    expect(
      screen.getByRole("link", { name: /Arweave mirror/ })
    ).toHaveAttribute("href", "https://arweave.net/mirror");
    expect(
      screen.queryByText(/DMG installer|EXE installer/)
    ).not.toBeInTheDocument();
  });
  it.each([
    ["Win32", "Windows"],
    ["MacIntel", "macOS"],
    ["Linux x86_64", "Linux"],
    ["Unknown", null],
  ])("opens only the matching OS for %s", (platform, expected) => {
    jest.spyOn(navigator, "platform", "get").mockReturnValue(platform);
    query = {
      data: [
        { ...app, name: "windows", displayName: "Windows", releases: [] },
        app,
        { ...app, name: "linux", displayName: "Linux", releases: [] },
      ],
      refetch,
    };
    render(<DesktopAppDownloads />);
    for (const group of screen.getAllByRole("group")) {
      expect(group.hasAttribute("open")).toBe(
        group.querySelector("summary")?.textContent === expected
      );
    }
  });
  it("keeps loading and full failure recoverable", () => {
    query = { isLoading: true, refetch };
    const view = render(<DesktopAppDownloads />);
    expect(
      screen.getByText("Loading desktop app downloads")
    ).toBeInTheDocument();
    query = { isError: true, refetch };
    view.rerender(<DesktopAppDownloads />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
  it("preserves available releases and exposes a retry for a partial feed failure", () => {
    query = { data: [{ ...app, hasUnavailableRelease: true }], refetch };
    render(<DesktopAppDownloads />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Some downloads");
    expect(within(status).queryByRole("button")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(refetch).toHaveBeenCalledTimes(1);
  });
  it("keeps an OS with no available releases recoverable without download links", () => {
    query = {
      data: [{ ...app, releases: [], hasUnavailableRelease: true }],
      refetch,
    };
    render(<DesktopAppDownloads />);
    expect(screen.getByText("macOS")).toBeInTheDocument();
    expect(screen.getByRole("status")).not.toHaveTextContent("Some downloads");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
