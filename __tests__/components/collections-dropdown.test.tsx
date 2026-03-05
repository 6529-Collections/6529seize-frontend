import { fireEvent, render, screen } from "@testing-library/react";
import CollectionsDropdown from "@/components/collections-dropdown/CollectionsDropdown";

const useRouterMock = jest.fn();
const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => useRouterMock(),
}));

describe("CollectionsDropdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRouterMock.mockReturnValue({ push: pushMock });
  });

  it("does not include xTDH in collection options", () => {
    render(<CollectionsDropdown activePage="memes" />);

    fireEvent.click(screen.getByRole("button", { name: "The Memes" }));

    expect(screen.queryByText("xTDH")).not.toBeInTheDocument();
    expect(screen.getByText("ReMemes")).toBeInTheDocument();
  });

  it("navigates to selected collection path", () => {
    render(<CollectionsDropdown activePage="gradient" />);

    fireEvent.click(screen.getByRole("button", { name: "Gradient" }));
    fireEvent.click(screen.getByRole("button", { name: "Meme Lab" }));

    expect(pushMock).toHaveBeenCalledWith("/meme-lab");
  });
});
