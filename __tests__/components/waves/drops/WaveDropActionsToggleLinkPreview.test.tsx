import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import WaveDropActionsToggleLinkPreview from "@/components/waves/drops/WaveDropActionsToggleLinkPreview";
import { AuthContext } from "@/components/auth/Auth";
import { commonApiPost } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    applyOptimisticDropUpdate: jest.fn().mockReturnValue({ rollback: jest.fn() }),
  }),
}));

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="mock-tooltip">{children}</div>
  ),
}));

const mockCommonApiPost = commonApiPost as jest.Mock;

const createDrop = (
  authorHandle: string,
  hasLinks = true,
  hideLinkPreview = false
) =>
  ({
    id: "drop1",
    author: { handle: authorHandle },
    wave: { id: "wave1" },
    hide_link_preview: hideLinkPreview,
    parts: hasLinks
      ? [{ content: "Check this out https://example.com" }]
      : [{ content: "No links here" }],
  }) as any;

const renderWithAuth = (
  component: React.ReactElement,
  connectedHandle: string | null = null,
  activeProfileProxy: any = null
) =>
  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: connectedHandle ? { handle: connectedHandle } : null,
          activeProfileProxy,
          setToast: jest.fn(),
        } as any
      }
    >
      {component}
    </AuthContext.Provider>
  );

describe("WaveDropActionsToggleLinkPreview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCommonApiPost.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
    jest.clearAllTimers();
  });

  it("renders nothing when user is not the author", () => {
    const drop = createDrop("bob");
    renderWithAuth(
      <WaveDropActionsToggleLinkPreview drop={drop} />,
      "alice"
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders nothing when user is not connected", () => {
    const drop = createDrop("bob");
    renderWithAuth(<WaveDropActionsToggleLinkPreview drop={drop} />, null);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders nothing when using proxy profile", () => {
    const drop = createDrop("alice");
    renderWithAuth(
      <WaveDropActionsToggleLinkPreview drop={drop} />,
      "alice",
      { some: "proxy" }
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders nothing when drop has no links", () => {
    const drop = createDrop("alice", false);
    renderWithAuth(
      <WaveDropActionsToggleLinkPreview drop={drop} />,
      "alice"
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders button when user is the author and drop has links", () => {
    const drop = createDrop("alice", true);
    renderWithAuth(
      <WaveDropActionsToggleLinkPreview drop={drop} />,
      "alice"
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows hide icon when previews are visible (hide_link_preview is false)", () => {
    const drop = createDrop("alice", true, false);
    renderWithAuth(
      <WaveDropActionsToggleLinkPreview drop={drop} />,
      "alice"
    );
    expect(screen.getByLabelText("Hide link previews")).toBeInTheDocument();
  });

  it("shows show icon when previews are hidden (hide_link_preview is true)", () => {
    const drop = createDrop("alice", true, true);
    renderWithAuth(
      <WaveDropActionsToggleLinkPreview drop={drop} />,
      "alice"
    );
    expect(screen.getByLabelText("Show link previews")).toBeInTheDocument();
  });

  it("calls API when clicked", async () => {
    const drop = createDrop("alice");
    renderWithAuth(
      <WaveDropActionsToggleLinkPreview drop={drop} />,
      "alice"
    );
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(mockCommonApiPost).toHaveBeenCalledWith({
        endpoint: "drops/drop1/toggle-hide-link-preview",
        body: {},
      });
    });
  });

  it("calls onToggle callback after successful API call", async () => {
    const mockOnToggle = jest.fn();
    const drop = createDrop("alice");
    renderWithAuth(
      <WaveDropActionsToggleLinkPreview drop={drop} onToggle={mockOnToggle} />,
      "alice"
    );
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(mockOnToggle).toHaveBeenCalled();
    });
  });

  describe("mobile mode", () => {
    it("renders mobile layout with text when isMobile is true", () => {
      const drop = createDrop("alice", true, false);
      renderWithAuth(
        <WaveDropActionsToggleLinkPreview drop={drop} isMobile />,
        "alice"
      );
      expect(screen.getByText("Hide Link Previews")).toBeInTheDocument();
    });

    it("shows show text when previews are hidden in mobile", () => {
      const drop = createDrop("alice", true, true);
      renderWithAuth(
        <WaveDropActionsToggleLinkPreview drop={drop} isMobile />,
        "alice"
      );
      expect(screen.getByText("Show Link Previews")).toBeInTheDocument();
    });
  });
});
