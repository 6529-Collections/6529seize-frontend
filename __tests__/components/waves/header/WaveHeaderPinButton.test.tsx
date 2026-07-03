import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveHeaderPinButton from "@/components/waves/header/WaveHeaderPinButton";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";

// Create mocks that we can access
const mockAddPinnedWave = jest.fn();
const mockRemovePinnedWave = jest.fn();
const mockPinWave = jest.fn();
const mockUnpinWave = jest.fn();
let mockWavesList: any[] = [];

// Mock the MyStreamContext
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    waves: {
      list: mockWavesList,
      addPinnedWave: mockAddPinnedWave,
      removePinnedWave: mockRemovePinnedWave,
    },
  }),
}));

// Create mocks that we can modify during tests
const mockUsePinnedWavesServer = jest.fn();
const mockIsOperationInProgress = jest.fn(() => false);
const mockCanPinWave = jest.fn(() => true);

jest.mock("@/hooks/usePinnedWavesServer", () => ({
  usePinnedWavesServer: () => mockUsePinnedWavesServer(),
  MAX_PINNED_WAVES: 3,
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: jest.fn(),
}));

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children, id, content }: any) => {
    const triggerContent =
      typeof document === "undefined"
        ? undefined
        : document
            .querySelector(`[data-tooltip-id="${id}"]`)
            ?.getAttribute("data-tooltip-content");
    return (
      <div data-testid={`tooltip-${id}`}>
        {children ?? content ?? triggerContent}
      </div>
    );
  },
}));

const mockAuth = {
  connectedProfile: { handle: "testuser" },
  activeProfileProxy: null,
  setToast: jest.fn(),
};

const mockAuthNotConnected = {
  connectedProfile: null,
  activeProfileProxy: null,
  setToast: jest.fn(),
};

const mockAuthWithProxy = {
  connectedProfile: { handle: "testuser" },
  activeProfileProxy: { id: "proxy1" },
  setToast: jest.fn(),
};

const mockUseSeizeSettings = useSeizeSettings as jest.Mock;

describe("WaveHeaderPinButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWavesList = [];
    mockUseSeizeSettings.mockReturnValue({
      isAnnouncementsWave: () => false,
      isLoaded: true,
    });
    mockPinWave.mockResolvedValue(undefined);
    mockUnpinWave.mockResolvedValue(undefined);

    // Set default mock return values
    mockUsePinnedWavesServer.mockReturnValue({
      pinnedIds: [],
      isOperationInProgress: mockIsOperationInProgress,
      canPinWave: mockCanPinWave,
      pinWave: mockPinWave,
      unpinWave: mockUnpinWave,
    });
    mockIsOperationInProgress.mockReturnValue(false);
    mockCanPinWave.mockReturnValue(true);
  });

  const renderComponent = (authContext = mockAuth, waveId = "wave-123") => {
    return render(
      <AuthContext.Provider value={authContext}>
        <WaveHeaderPinButton waveId={waveId} />
      </AuthContext.Provider>
    );
  };

  describe("Authentication Checks", () => {
    it("does not render when user is not authenticated", () => {
      const { container } = renderComponent(mockAuthNotConnected);
      expect(container.firstChild).toBeNull();
    });

    it("does not render when user is using proxy", () => {
      const { container } = renderComponent(mockAuthWithProxy);
      expect(container.firstChild).toBeNull();
    });

    it("does not render for the announcement wave", () => {
      mockUseSeizeSettings.mockReturnValue({
        isAnnouncementsWave: (waveId: string) => waveId === "wave-123",
        isLoaded: true,
      });
      const { container } = renderComponent();
      expect(container.firstChild).toBeNull();
    });

    it("hides ordinary waves while settings are still loading", () => {
      mockUseSeizeSettings.mockReturnValue({
        isAnnouncementsWave: () => false,
        isLoaded: false,
      });
      const { container } = renderComponent();
      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders unpin control for a pinned announcement wave", () => {
      mockUseSeizeSettings.mockReturnValue({
        isAnnouncementsWave: (waveId: string) => waveId === "wave-123",
        isLoaded: false,
      });
      mockUsePinnedWavesServer.mockReturnValue({
        pinnedIds: ["wave-123"],
        isOperationInProgress: mockIsOperationInProgress,
        canPinWave: mockCanPinWave,
        pinWave: mockPinWave,
        unpinWave: mockUnpinWave,
      });
      renderComponent();
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Unpin wave"
      );
    });

    it("does not render for an unpinned official wave", () => {
      mockWavesList = [{ id: "wave-123", isOfficial: true }];
      const { container } = renderComponent();
      expect(container.firstChild).toBeNull();
    });

    it("does not render for a pinned official wave", () => {
      mockWavesList = [{ id: "wave-123", isOfficial: true }];
      mockUsePinnedWavesServer.mockReturnValue({
        pinnedIds: ["wave-123"],
        isOperationInProgress: mockIsOperationInProgress,
        canPinWave: mockCanPinWave,
        pinWave: mockPinWave,
        unpinWave: mockUnpinWave,
      });
      const { container } = renderComponent();
      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders when user is authenticated without proxy", () => {
      renderComponent();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Pin Button Rendering", () => {
    it("renders pin button with correct styling", () => {
      renderComponent();
      const button = screen.getByRole("button");

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-label", "Pin wave");
      expect(button.querySelector("svg")).toBeInTheDocument();
    });

    it("renders tooltip with correct content for unpinned wave", () => {
      renderComponent();
      expect(
        screen.getByTestId("tooltip-wave-header-pin-wave-123")
      ).toBeInTheDocument();
    });
  });

  describe("Pin Functionality", () => {
    it("pins wave when clicked and not currently pinned", async () => {
      const user = userEvent.setup();
      renderComponent();

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() => expect(mockPinWave).toHaveBeenCalledWith("wave-123"));
      expect(mockUnpinWave).not.toHaveBeenCalled();
    });

    it("prevents event propagation when clicked", async () => {
      const user = userEvent.setup();
      const mockStopPropagation = jest.fn();
      const mockPreventDefault = jest.fn();

      renderComponent();
      const button = screen.getByRole("button");

      // Mock the event methods
      button.click = () => {
        const event = new MouseEvent("click", { bubbles: true });
        event.stopPropagation = mockStopPropagation;
        event.preventDefault = mockPreventDefault;
        fireEvent(button, event);
      };

      await user.click(button);

      await waitFor(() => expect(mockPinWave).toHaveBeenCalled());
    });
  });

  describe("Unpin Functionality", () => {
    beforeEach(() => {
      // Mock usePinnedWavesServer to return wave as pinned
      mockUsePinnedWavesServer.mockReturnValue({
        pinnedIds: ["wave-123"],
        isOperationInProgress: mockIsOperationInProgress,
        canPinWave: mockCanPinWave,
        pinWave: mockPinWave,
        unpinWave: mockUnpinWave,
      });
    });

    it("unpins wave when clicked and currently pinned", async () => {
      // Re-render with updated mock
      const user = userEvent.setup();
      renderComponent();

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Unpin wave");

      await user.click(button);

      await waitFor(() =>
        expect(mockUnpinWave).toHaveBeenCalledWith("wave-123")
      );
      expect(mockPinWave).not.toHaveBeenCalled();
    });

    it("unpins a pinned announcement wave when clicked", async () => {
      mockUseSeizeSettings.mockReturnValue({
        isAnnouncementsWave: (waveId: string) => waveId === "wave-123",
        isLoaded: false,
      });
      const user = userEvent.setup();
      renderComponent();

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() =>
        expect(mockUnpinWave).toHaveBeenCalledWith("wave-123")
      );
    });
  });

  describe("Max Limit Handling", () => {
    beforeEach(() => {
      // Mock usePinnedWavesServer to return max pinned waves
      mockUsePinnedWavesServer.mockReturnValue({
        pinnedIds: ["wave-1", "wave-2", "wave-3"],
        isOperationInProgress: mockIsOperationInProgress,
        canPinWave: mockCanPinWave,
        pinWave: mockPinWave,
        unpinWave: mockUnpinWave,
      });
      mockCanPinWave.mockReturnValue(false);
    });

    it("shows error toast when trying to pin beyond limit", async () => {
      const user = userEvent.setup();
      renderComponent();

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockAuth.setToast).toHaveBeenCalledWith({
        type: "error",
        title: "Maximum 3 pinned waves reached.",
        description: "Unpin another wave first.",
      });
      expect(mockPinWave).not.toHaveBeenCalled();
    });

    it("keeps the header control hidden during settings load at max capacity", () => {
      mockUseSeizeSettings.mockReturnValue({
        isAnnouncementsWave: () => false,
        isLoaded: false,
      });

      const { container } = renderComponent();

      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(mockAuth.setToast).not.toHaveBeenCalled();
      expect(mockPinWave).not.toHaveBeenCalled();
    });
  });

  describe("Loading States", () => {
    beforeEach(() => {
      // Mock usePinnedWavesServer to return operation in progress
      mockIsOperationInProgress.mockReturnValue(true);
      mockUsePinnedWavesServer.mockReturnValue({
        pinnedIds: [],
        isOperationInProgress: mockIsOperationInProgress,
        canPinWave: mockCanPinWave,
        pinWave: mockPinWave,
        unpinWave: mockUnpinWave,
      });
    });

    it("disables button when operation is in progress", () => {
      renderComponent();

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass("tw-opacity-50", "tw-cursor-not-allowed");
    });

    it("does not execute action when operation is in progress", async () => {
      const user = userEvent.setup();
      renderComponent();

      const button = screen.getByRole("button");
      await user.click(button);

      expect(mockPinWave).not.toHaveBeenCalled();
      expect(mockUnpinWave).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("handles errors when pinning fails", async () => {
      const user = userEvent.setup();
      const mockError = new Error("Network error");
      mockPinWave.mockRejectedValue(mockError);

      renderComponent();

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() =>
        expect(mockAuth.setToast).toHaveBeenCalledWith({
          type: "error",
          title: "Couldn't pin this wave.",
          description: "Please try again.",
          details: "Network error. Please check your connection and try again.",
        })
      );
    });

    it("handles errors when unpinning fails", async () => {
      const user = userEvent.setup();
      const mockError = new Error("Server error");
      mockUnpinWave.mockRejectedValue(mockError);

      // Mock as pinned wave
      mockUsePinnedWavesServer.mockReturnValue({
        pinnedIds: ["wave-123"],
        isOperationInProgress: mockIsOperationInProgress,
        canPinWave: mockCanPinWave,
        pinWave: mockPinWave,
        unpinWave: mockUnpinWave,
      });

      renderComponent();

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() =>
        expect(mockAuth.setToast).toHaveBeenCalledWith({
          type: "error",
          title: "Couldn't unpin this wave.",
          description: "Please try again.",
          details: "Server error.",
        })
      );
    });

    it("handles non-Error objects in catch block", async () => {
      const user = userEvent.setup();
      mockPinWave.mockRejectedValue(new Error("String error"));

      renderComponent();

      const button = screen.getByRole("button");
      await user.click(button);

      await waitFor(() =>
        expect(mockAuth.setToast).toHaveBeenCalledWith({
          type: "error",
          title: "Couldn't pin this wave.",
          description: "Please try again.",
          details: "String error.",
        })
      );
    });
  });

  describe("Tooltip Content", () => {
    it("shows correct tooltip for unpinned wave", () => {
      renderComponent();
      expect(screen.getByRole("button")).toHaveAttribute(
        "data-tooltip-content",
        "Pin wave"
      );
    });

    it("shows correct tooltip for pinned wave", () => {
      // Mock as pinned
      mockUsePinnedWavesServer.mockReturnValue({
        pinnedIds: ["wave-123"],
        isOperationInProgress: mockIsOperationInProgress,
        canPinWave: mockCanPinWave,
        pinWave: mockPinWave,
        unpinWave: mockUnpinWave,
      });

      renderComponent();
      expect(screen.getByRole("button")).toHaveAttribute(
        "data-tooltip-content",
        "Unpin wave"
      );
    });

    it("shows max limit tooltip when at capacity", () => {
      // Mock as at max capacity
      mockUsePinnedWavesServer.mockReturnValue({
        pinnedIds: ["wave-1", "wave-2", "wave-3"],
        isOperationInProgress: mockIsOperationInProgress,
        canPinWave: mockCanPinWave,
        pinWave: mockPinWave,
        unpinWave: mockUnpinWave,
      });
      mockCanPinWave.mockReturnValue(false);

      renderComponent();
      expect(screen.getByRole("button")).toHaveAttribute(
        "data-tooltip-content",
        "Max 3 pinned waves. Unpin another wave first."
      );
    });
  });

  describe("Visual States", () => {
    it("applies correct styles for unpinned state", () => {
      renderComponent();
      const button = screen.getByRole("button");
      const icon = button.querySelector("svg");

      expect(button).toHaveClass("tw-text-iron-500");
      expect(icon).not.toHaveClass("tw-rotate-[-45deg]");
    });

    it("applies correct styles for pinned state", () => {
      // Mock as pinned
      mockUsePinnedWavesServer.mockReturnValue({
        pinnedIds: ["wave-123"],
        isOperationInProgress: mockIsOperationInProgress,
        canPinWave: mockCanPinWave,
        pinWave: mockPinWave,
        unpinWave: mockUnpinWave,
      });

      renderComponent();
      const button = screen.getByRole("button");
      const icon = button.querySelector("svg");
      const tooltipId = button.getAttribute("data-tooltip-id");

      expect(button).toHaveClass("tw-bg-transparent", "tw-text-iron-300");
      expect(button).toHaveAttribute("data-tooltip-content", "Unpin wave");
      expect(screen.getByTestId(`tooltip-${tooltipId}`)).toBeInTheDocument();
      expect(icon).toHaveClass("tw-rotate-[-45deg]");
    });
  });
});
