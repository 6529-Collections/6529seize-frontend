import {
  DropAuthorSignedIndicator,
  isDropAuthorSigned,
  WithDropAuthorSignedMarker,
} from "@/components/waves/drops/signature/DropAuthorSignedMarker";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let mockEnabled = true;
jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => mockEnabled,
}));

let mockHasTouchScreen = false;
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ hasTouchScreen: mockHasTouchScreen }),
}));

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children, isOpen }: any) =>
    isOpen ? <div role="tooltip">{children}</div> : null,
}));

const mockDialog = jest.fn();
jest.mock("@/components/waves/drops/signature/DropSignatureDialog", () => ({
  __esModule: true,
  default: (props: any) => {
    mockDialog(props);
    return props.isOpen ? (
      <div role="dialog" aria-label="Signature">
        <button type="button" onClick={props.onClose}>
          Close
        </button>
      </div>
    ) : null;
  },
}));

const aDrop = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "drop-1",
    is_author_signed: true,
    title: null,
    parts: [],
    wave: { id: "wave-1" },
    author: { primary_address: "0x1" },
    ...overrides,
  }) as any;

const renderMarker = (drop = aDrop()) =>
  render(
    <WithDropAuthorSignedMarker drop={drop}>
      <span>12:30</span>
    </WithDropAuthorSignedMarker>
  );

const marker = () =>
  screen.queryByRole("button", { name: "Signed by its author" });

describe("drop author signed marker", () => {
  beforeEach(() => {
    mockEnabled = true;
    mockHasTouchScreen = false;
    mockDialog.mockClear();
  });

  it("renders beside the timestamp when signed messages are on and the drop is author signed", () => {
    renderMarker();

    expect(screen.getByText("12:30")).toBeInTheDocument();
    expect(marker()).toBeInTheDocument();
    expect(marker()).toHaveAttribute("aria-haspopup", "dialog");
  });

  it.each([
    ["unsigned", { is_author_signed: false }],
    ["missing the field", { is_author_signed: undefined }],
    ["still being sent", { id: "temp-123" }],
  ])("renders only the timestamp for a drop %s", (_name, overrides) => {
    renderMarker(aDrop(overrides));

    expect(screen.getByText("12:30")).toBeInTheDocument();
    expect(marker()).not.toBeInTheDocument();
    expect(mockDialog).not.toHaveBeenCalled();
  });

  it("renders only the timestamp while signed messages are off", () => {
    mockEnabled = false;
    renderMarker();

    expect(screen.getByText("12:30")).toBeInTheDocument();
    expect(marker()).not.toBeInTheDocument();
    expect(isDropAuthorSigned(aDrop())).toBe(false);
  });

  it("opens the Signature dialog for this drop when clicked, without reaching the row", () => {
    const onRowClick = jest.fn();
    const drop = aDrop();
    render(
      <div onClick={onRowClick}>
        <WithDropAuthorSignedMarker drop={drop}>
          <span>12:30</span>
        </WithDropAuthorSignedMarker>
      </div>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(marker()!);

    expect(
      screen.getByRole("dialog", { name: "Signature" })
    ).toBeInTheDocument();
    expect(mockDialog).toHaveBeenLastCalledWith(
      expect.objectContaining({ dropId: "drop-1", drop, isOpen: true })
    );
    expect(onRowClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is keyboard reachable and opens the dialog with Enter, showing its tooltip on focus", async () => {
    const user = userEvent.setup();
    renderMarker();

    await user.tab();
    expect(marker()).toHaveFocus();
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Signed by its author"
    );

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("dialog", { name: "Signature" })
    ).toBeInTheDocument();
  });

  it("skips the hover tooltip on touch devices", () => {
    mockHasTouchScreen = true;
    renderMarker();

    fireEvent.mouseEnter(marker()!);

    expect(marker()).not.toHaveAttribute("data-tooltip-id");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("labels the static seal used on grouped rows", () => {
    render(<DropAuthorSignedIndicator />);

    expect(
      screen.getByRole("img", { name: "Signed by its author" })
    ).toBeInTheDocument();
  });
});
