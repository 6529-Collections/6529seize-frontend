import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/components/auth/Auth";
import BrainLeftSidebarCreateADirectMessageButton from "@/components/brain/left-sidebar/BrainLeftSidebarCreateADirectMessageButton";

const mockOpenDirectMessage = jest.fn();
jest.mock("@/hooks/useCreateModalState", () => ({
  __esModule: true,
  default: jest.fn(() => ({ openDirectMessage: mockOpenDirectMessage })),
}));
jest.mock("@/components/auth/Auth");

const mockedUseAuth = useAuth as jest.Mock;

describe("BrainLeftSidebarCreateADirectMessageButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "Create DM" and opens locally when user is connected with no active proxy', async () => {
    mockedUseAuth.mockReturnValue({
      connectedProfile: { handle: "john" },
      activeProfileProxy: null,
    });
    render(<BrainLeftSidebarCreateADirectMessageButton />);
    await userEvent.click(screen.getByRole("button", { name: "Create DM" }));
    expect(mockOpenDirectMessage).toHaveBeenCalledTimes(1);
  });

  it('shows "Direct Message" when no connected profile or active proxy present', () => {
    mockedUseAuth.mockReturnValue({
      connectedProfile: null,
      activeProfileProxy: null,
    });
    render(<BrainLeftSidebarCreateADirectMessageButton />);
    expect(screen.getByText("Direct Message")).toBeInTheDocument();
  });

  it('shows "Direct Message" when there is an active proxy', () => {
    mockedUseAuth.mockReturnValue({
      connectedProfile: { handle: "john" },
      activeProfileProxy: { id: "1" },
    });
    render(<BrainLeftSidebarCreateADirectMessageButton />);
    expect(screen.getByText("Direct Message")).toBeInTheDocument();
  });
});
