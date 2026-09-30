import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { WebProfileFeedShortcut } from "@/components/brain/left-sidebar/web/WebProfileFeedShortcut";

let isMobileLayoutViewport = false;
let activeWaveId: string | null = null;
const setActiveWave = jest.fn();

jest.mock("@/hooks/useIsMobileLayoutViewport", () => ({
  __esModule: true,
  default: () => isMobileLayoutViewport,
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    activeWave: {
      id: activeWaveId,
      set: setActiveWave,
    },
  }),
}));

describe("WebProfileFeedShortcut", () => {
  beforeEach(() => {
    isMobileLayoutViewport = false;
    activeWaveId = null;
    jest.clearAllMocks();
  });

  it("keeps the desktop feed action selected", () => {
    render(<WebProfileFeedShortcut basePath="/waves" isCollapsed={false} />);

    const link = screen.getByRole("link", {
      name: "Profile Waves Feed",
    });
    expect(link).toHaveAttribute("href", "/waves");
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("clears a selected wave from the desktop feed action while preserving modified clicks", () => {
    activeWaveId = "rare-pepe";
    render(<WebProfileFeedShortcut basePath="/waves" isCollapsed={false} />);
    const link = screen.getByRole("link", {
      name: "Profile Waves Feed",
    });
    expect(link).toHaveTextContent("");
    expect(link.querySelector("svg")).toBeInTheDocument();
    expect(link).toHaveAttribute("data-tooltip-content", "Profile Waves Feed");
    const click = createEvent.click(link);
    fireEvent(link, click);
    expect(click.defaultPrevented).toBe(true);
    expect(setActiveWave).toHaveBeenCalledWith(null, {
      isDirectMessage: false,
    });
    setActiveWave.mockClear();
    const modified = createEvent.click(link, { ctrlKey: true });
    fireEvent(link, modified);
    expect(modified.defaultPrevented).toBe(false);
    expect(setActiveWave).not.toHaveBeenCalled();
  });

  it("retains the icon-only feed link in the collapsed rail", () => {
    render(<WebProfileFeedShortcut basePath="/waves" isCollapsed />);
    expect(
      screen.getByRole("link", { name: "Profile Waves Feed" })
    ).toHaveAttribute("href", "/waves");
    expect(screen.queryByText("Waves")).not.toBeInTheDocument();
  });

  it("uses the explicit feed query without a false selected state on mobile web", () => {
    isMobileLayoutViewport = true;

    render(<WebProfileFeedShortcut basePath="/waves" isCollapsed={false} />);

    const link = screen.getByRole("link", {
      name: "Profile Waves Feed",
    });
    expect(link).toHaveAttribute("href", "/waves?view=profile-feed");
    expect(link).not.toHaveAttribute("aria-current");
  });
  it("keeps native feed navigation even on a wide app viewport", () => {
    render(
      <WebProfileFeedShortcut basePath="/waves" isCollapsed={false} mobile />
    );
    const link = screen.getByRole("link", {
      name: "Profile Waves Feed",
    });
    expect(link).toHaveAttribute("href", "/waves?view=profile-feed");
    expect(link).not.toHaveAttribute("aria-current");
    expect(link).toHaveTextContent("");
    expect(link.querySelector("svg")).toBeInTheDocument();
    expect(link.querySelector("svg")).toBeInTheDocument();
    const click = createEvent.click(link);
    fireEvent(link, click);
    expect(click.defaultPrevented).toBe(false);
    expect(setActiveWave).not.toHaveBeenCalled();
  });
});
