import HeaderActionButtons from "@/components/header/HeaderActionButtons";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/components/navigation/ViewContext", () => ({
  useViewContext: jest.fn(),
}));
jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));

const {
  useViewContext: useCtx,
} = require("@/components/navigation/ViewContext");
const { useRouter: useRt } = require("next/navigation");

afterEach(() => jest.clearAllMocks());

describe("HeaderActionButtons", () => {
  it("creates new wave when active view is waves", async () => {
    (useCtx as jest.Mock).mockReturnValue({ activeView: "waves" });
    const push = jest.fn();
    (useRt as jest.Mock).mockReturnValue({ push });
    render(<HeaderActionButtons />);
    await userEvent.click(screen.getByRole("button", { name: "Create Wave" }));
    expect(push).toHaveBeenCalledWith("/waves?create=wave");
  });

  it("creates new dm when active view is messages", async () => {
    (useCtx as jest.Mock).mockReturnValue({ activeView: "messages" });
    const push = jest.fn();
    (useRt as jest.Mock).mockReturnValue({ push });
    render(<HeaderActionButtons />);
    await userEvent.click(screen.getByRole("button", { name: "Create DM" }));
    expect(push).toHaveBeenCalledWith("/waves?create=dm");
  });

  it("renders nothing for other views", () => {
    (useCtx as jest.Mock).mockReturnValue({ activeView: "other" });
    (useRt as jest.Mock).mockReturnValue({ push: jest.fn() });
    const { container } = render(<HeaderActionButtons />);
    expect(container.firstChild).toBeNull();
  });
});
