import { render, screen, fireEvent } from "@testing-library/react";
import CreateDropActionsRow from "@/components/drops/create/utils/CreateDropActionsRow";
import { MAX_DROP_UPLOAD_FILES } from "@/helpers/Helpers";

function renderComponent(
  props: React.ComponentProps<typeof CreateDropActionsRow>
) {
  return render(<CreateDropActionsRow {...props} />);
}

describe("CreateDropActionsRow", () => {
  it("forwards the complete selection for shared composer validation", () => {
    const setFiles = jest.fn();
    const files = Array.from(
      { length: MAX_DROP_UPLOAD_FILES + 1 },
      (_, i) => new File(["image"], `f${i}.png`, { type: "image/png" })
    );
    renderComponent({
      canAddPart: false,
      isStormMode: false,
      setFiles,
      breakIntoStorm: jest.fn(),
    });
    const input = screen.getByLabelText(/upload media/i);
    fireEvent.change(input, { target: { files } });
    expect(setFiles).toHaveBeenCalledWith(files);
  });

  it("passes files to callback when under limit", () => {
    const setFiles = jest.fn();
    const files = [
      new File(["a"], "a.png", { type: "image/png" }),
      new File(["b"], "b.png", { type: "image/png" }),
    ];
    renderComponent({
      canAddPart: false,
      isStormMode: false,
      setFiles,
      breakIntoStorm: jest.fn(),
    });
    const input = screen.getByLabelText(/upload media/i);
    fireEvent.change(input, { target: { files } });
    expect(setFiles).toHaveBeenCalledWith(files);
  });

  it("renders break into storm button when allowed and handles click", () => {
    const handler = jest.fn();
    renderComponent({
      canAddPart: true,
      isStormMode: false,
      setFiles: jest.fn(),
      breakIntoStorm: handler,
    });
    const button = screen.getByRole("button", { name: /break into storm/i });
    fireEvent.click(button);
    expect(handler).toHaveBeenCalled();
  });

  it("does not upload files or break storm when disabled", () => {
    const setFiles = jest.fn();
    const breakIntoStorm = jest.fn();
    const files = [new File(["a"], "a.png", { type: "image/png" })];

    renderComponent({
      canAddPart: true,
      isStormMode: false,
      setFiles,
      breakIntoStorm,
      disabled: true,
    });

    const input = screen.getByLabelText(/upload media/i);
    fireEvent.change(input, { target: { files } });
    fireEvent.click(screen.getByRole("button", { name: /break into storm/i }));

    expect(setFiles).not.toHaveBeenCalled();
    expect(breakIntoStorm).not.toHaveBeenCalled();
  });

  it("shows continue storm text when in storm mode", () => {
    renderComponent({
      canAddPart: true,
      isStormMode: true,
      setFiles: jest.fn(),
      breakIntoStorm: jest.fn(),
    });
    expect(screen.getByText(/continue storm/i)).toBeInTheDocument();
  });

  it("hides storm button when cannot add part", () => {
    renderComponent({
      canAddPart: false,
      isStormMode: false,
      setFiles: jest.fn(),
      breakIntoStorm: jest.fn(),
    });
    expect(
      screen.queryByRole("button", { name: /break into storm/i })
    ).not.toBeInTheDocument();
  });
});
