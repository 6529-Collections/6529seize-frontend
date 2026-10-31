import {
  DropAuthorSignedIndicator,
  WithDropAuthorSignedMarker,
} from "@/components/waves/drops/signature/DropAuthorSignedMarker";
import {
  isDropAuthorSigned,
  withAuthorSignedLabel,
} from "@/components/waves/drops/signature/dropAuthorSigned";
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

const mockGroupDialog = jest.fn();
jest.mock(
  "@/components/waves/drops/signature/DropGroupSignatureDialog",
  () => ({
    __esModule: true,
    default: (props: any) => {
      mockGroupDialog(props);
      return props.isOpen ? (
        <div role="dialog" aria-label="Signatures in this group">
          <button type="button" onClick={props.onClose}>
            Close
          </button>
        </div>
      ) : null;
    },
  })
);

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
    mockGroupDialog.mockClear();
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

  it("keeps Enter and Space on the seal away from a clickable card around it", async () => {
    const user = userEvent.setup();
    const onCardKeyDown = jest.fn();
    const onCardClick = jest.fn();
    render(
      <div
        role="button"
        tabIndex={0}
        onKeyDown={onCardKeyDown}
        onClick={onCardClick}
      >
        <WithDropAuthorSignedMarker drop={aDrop()}>
          <span>12:30</span>
        </WithDropAuthorSignedMarker>
      </div>
    );

    marker()!.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("dialog", { name: "Signature" })
    ).toBeInTheDocument();
    expect(onCardKeyDown).not.toHaveBeenCalled();

    expect(onCardClick).not.toHaveBeenCalled();
    // The real dialog keeps its own events inside; see the keyboard test in
    // DropSignatureDialog.test.tsx.
  });

  it("names a signed drop inside a single-button card", () => {
    expect(withAuthorSignedLabel("en-US", "Open entry", aDrop())).toBe(
      "Open entry, signed by its author"
    );
    expect(
      withAuthorSignedLabel(
        "en-US",
        "Open entry",
        aDrop({ is_author_signed: false })
      )
    ).toBe("Open entry");
  });

  describe("for a grouped chat header", () => {
    const groupOf = (...signed: boolean[]) =>
      signed.map((isSigned, index) =>
        aDrop({ id: `drop-${index + 1}`, is_author_signed: isSigned })
      );
    const renderGroup = (group: any[]) =>
      render(
        <WithDropAuthorSignedMarker drop={group[0]} group={group}>
          <span>12:30</span>
        </WithDropAuthorSignedMarker>
      );

    it("shows the full seal when every post is signed", () => {
      renderGroup(groupOf(true, true, true));
      const seal = screen.getByRole("button", {
        name: "All 3 posts signed by their author",
      });
      expect(seal.querySelector('[data-seal-state="all"]')).not.toBeNull();
    });

    it("shows a distinct outlined seal when only some posts are signed", () => {
      // The header post itself may be the unsigned one.
      renderGroup(groupOf(false, true, true));
      const seal = screen.getByRole("button", {
        name: "2 of 3 posts signed by their author",
      });
      expect(seal.querySelector('[data-seal-state="partial"]')).not.toBeNull();
    });

    it("shows no seal when no post is signed", () => {
      renderGroup(groupOf(false, false));
      expect(screen.getByText("12:30")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("updates its count when the group changes", () => {
      const group = groupOf(true, true);
      const { rerender } = renderGroup(group);
      expect(
        screen.getByRole("button", {
          name: "All 2 posts signed by their author",
        })
      ).toBeInTheDocument();

      // A new post joins the group.
      const appended = [
        ...group,
        aDrop({ id: "drop-3", is_author_signed: true }),
      ];
      rerender(
        <WithDropAuthorSignedMarker drop={appended[0]} group={appended}>
          <span>12:30</span>
        </WithDropAuthorSignedMarker>
      );
      expect(
        screen.getByRole("button", {
          name: "All 3 posts signed by their author",
        })
      ).toBeInTheDocument();

      // An unsigned edit clears one post's signature.
      const edited = [
        appended[0],
        { ...appended[1], is_author_signed: false },
        appended[2],
      ];
      rerender(
        <WithDropAuthorSignedMarker drop={edited[0]} group={edited}>
          <span>12:30</span>
        </WithDropAuthorSignedMarker>
      );
      expect(
        screen.getByRole("button", {
          name: "2 of 3 posts signed by their author",
        })
      ).toBeInTheDocument();
    });

    it("opens the group Signature dialog with every post", () => {
      const group = groupOf(true, false);
      renderGroup(group);

      fireEvent.click(
        screen.getByRole("button", {
          name: "1 of 2 posts signed by their author",
        })
      );
      expect(
        screen.getByRole("dialog", { name: "Signatures in this group" })
      ).toBeInTheDocument();
      expect(mockGroupDialog).toHaveBeenLastCalledWith(
        expect.objectContaining({ group, isOpen: true })
      );
      expect(mockDialog).not.toHaveBeenCalled();
    });

    it("behaves exactly like a single drop for a group of one", () => {
      const [only] = groupOf(true);
      renderGroup([only]);
      expect(marker()).toBeInTheDocument();
      fireEvent.click(marker()!);
      expect(mockDialog).toHaveBeenLastCalledWith(
        expect.objectContaining({ dropId: "drop-1", isOpen: true })
      );
    });
  });

  it("labels the static seal used on grouped rows", () => {
    render(<DropAuthorSignedIndicator />);

    expect(
      screen.getByRole("img", { name: "Signed by its author" })
    ).toBeInTheDocument();
  });
});
