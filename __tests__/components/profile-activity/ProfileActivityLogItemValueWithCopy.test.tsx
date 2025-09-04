import { fireEvent, render, screen } from "@testing-library/react";
import { useCopyToClipboard } from "react-use";
import ProfileActivityLogItemValueWithCopy from "../../../components/profile-activity/list/items/utils/ProfileActivityLogItemValueWithCopy";

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

    await fireEvent.click(screen.getByRole("button"));
    expect(copy).toHaveBeenCalledWith("0x1");
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });
});
