import { render, screen } from "@testing-library/react";
import { WebProfileFeedShortcut } from "@/components/brain/left-sidebar/web/WebProfileFeedShortcut";

let isMobileLayoutViewport = false;
const setActiveWave = jest.fn();

jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: () => isMobileLayoutViewport,
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    activeWave: {
      id: null,
      set: setActiveWave,
    },
  }),
}));

describe("WebProfileFeedShortcut", () => {
  beforeEach(() => {
    isMobileLayoutViewport = false;
    jest.clearAllMocks();
  });

  it("keeps the desktop section-home link selected", () => {
    render(<WebProfileFeedShortcut basePath="/waves" isCollapsed={false} />);

    const link = screen.getByRole("link", { name: "Profile Waves Feed" });
    expect(link).toHaveAttribute("href", "/waves");
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("uses the explicit feed query without a false selected state on mobile web", () => {
    isMobileLayoutViewport = true;

    render(<WebProfileFeedShortcut basePath="/waves" isCollapsed={false} />);

    const link = screen.getByRole("link", { name: "Profile Waves Feed" });
    expect(link).toHaveAttribute("href", "/waves?view=profile-feed");
    expect(link).not.toHaveAttribute("aria-current");
  });
});
