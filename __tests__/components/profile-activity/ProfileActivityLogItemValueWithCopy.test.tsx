import { fireEvent, render, screen } from "@testing-library/react";
import { useCopyToClipboard } from "react-use";
import ProfileActivityLogItemValueWithCopy from "@/components/profile-activity/list/items/utils/ProfileActivityLogItemValueWithCopy";

jest.mock("react-use", () => ({ useCopyToClipboard: jest.fn() }));
describe("ProfileActivityLogItemValueWithCopy", () => {
  const copy = jest.fn();
  beforeEach(() => {
    (useCopyToClipboard as jest.Mock).mockReturnValue([null, copy]);
    Object.defineProperty(window, "matchMedia", {
      value: () => ({ matches: false }),
    });
  });

  it("copies value on click and shows feedback", async () => {
    render(<ProfileActivityLogItemValueWithCopy title="Address" value="0x1" />);

    // Initially should show the title
    expect(screen.getByText("Address")).toBeInTheDocument();

    const copyButton = screen.getByRole("button", { name: "Copy" });
    expect(copyButton).toHaveClass(
      "tw-opacity-0",
      "desktop-hover:group-hover:tw-opacity-100",
      "focus-visible:tw-opacity-100",
      "touch-only:tw-opacity-100"
    );
    expect(copyButton).not.toHaveClass("group-hover:tw-opacity-100");

    await fireEvent.click(copyButton);
    expect(copy).toHaveBeenCalledWith("0x1");
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });
});
