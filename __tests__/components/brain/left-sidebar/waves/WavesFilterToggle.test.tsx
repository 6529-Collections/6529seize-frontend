import { fireEvent, render, screen } from "@testing-library/react";
import WavesFilterToggle from "@/components/brain/left-sidebar/waves/WavesFilterToggle";
import { useAuth } from "@/components/auth/Auth";
import { useShowFollowingWaves } from "@/hooks/useShowFollowingWaves";

jest.mock("@/components/auth/Auth");
jest.mock("@/hooks/useShowFollowingWaves");

const mockUseAuth = useAuth as jest.Mock;
const mockUseShowFollowingWaves = useShowFollowingWaves as jest.Mock;

describe("WavesFilterToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      connectedProfile: { handle: "alice" },
      activeProfileProxy: null,
    });
    mockUseShowFollowingWaves.mockReturnValue([false, jest.fn()]);
  });

  it("exposes selected state and updates joined mode", () => {
    const setFollowing = jest.fn();
    mockUseShowFollowingWaves.mockReturnValue([false, setFollowing]);

    render(<WavesFilterToggle />);

    const allButton = screen.getByRole("button", { name: "All" });
    const joinedButton = screen.getByRole("button", { name: "Joined" });

    expect(
      screen.getByRole("group", { name: "Wave list filter" })
    ).toBeInTheDocument();
    expect(allButton).toHaveAttribute("aria-pressed", "true");
    expect(joinedButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(joinedButton);

    expect(setFollowing).toHaveBeenCalledWith(true);
  });

  it("does not render when there is no connected identity", () => {
    mockUseAuth.mockReturnValue({
      connectedProfile: null,
      activeProfileProxy: null,
    });

    const { container } = render(<WavesFilterToggle />);

    expect(container).toBeEmptyDOMElement();
  });
});
