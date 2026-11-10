import {
  AuthorSignedLabel,
  DropAuthorSignedIndicator,
  WithDropAuthorSignedMarker,
} from "@/components/waves/drops/signature/DropAuthorSignedMarker";
import { isDropAuthorSigned } from "@/components/waves/drops/signature/dropAuthorSigned";
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

/** This browser's verdict per drop id; "verified" unless set. */
let mockStates: Record<string, string> = {};
const mockStateOf = (drop: { id: string }) => mockStates[drop.id] ?? "verified";
const mockUseDropSealStates = jest.fn();
jest.mock("@/components/waves/drops/signature/dropSignatureVerdicts", () => ({
  useDropSealStates: (drops: { id: string }[], active: boolean) => {
    mockUseDropSealStates(drops, active);
    return drops.map(mockStateOf);
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
    mockGroupDialog.mockClear();
    mockUseDropSealStates.mockClear();
    mockStates = {};
  });

  it("checks the drop once its seal is seen (immediately without IntersectionObserver)", () => {
    const drop = aDrop();
    renderMarker(drop);
    expect(mockUseDropSealStates).toHaveBeenLastCalledWith([drop], true);
  });

  it.each([
    ["not yet checked", "pending", "Checking the author's signature"],
    ["not verifiable here", "unverified", "Signed, not yet verified"],
    ["not matching", "failed", "The signature doesn't match this post"],
  ])("never says signed by its author for a drop %s", (_name, state, label) => {
    mockStates = { "drop-1": state };
    renderMarker();
    const seal = screen.getByRole("button", { name: label });
    expect(seal.querySelector(`[data-seal-state="${state}"]`)).not.toBeNull();
    expect(marker()).not.toBeInTheDocument();
  });

  it("shows the filled seal only once this browser verified the signature", () => {
    renderMarker();
    expect(
      marker()!.querySelector('[data-seal-state="verified"]')
    ).not.toBeNull();
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

  describe("the name of a single-button card", () => {
    const renderCard = (drop = aDrop()) =>
      render(
        <button type="button" aria-labelledby="card-label">
          <AuthorSignedLabel id="card-label" drop={drop} label="Open entry" />
          <DropAuthorSignedIndicator drop={drop} />
        </button>
      );

    it.each([
      ["verified", "Open entry, signed by its author"],
      ["pending", "Open entry, signed, not yet verified"],
      ["unverified", "Open entry, signed, not yet verified"],
      ["failed", "Open entry, the signature doesn't match this post"],
    ])("follows this browser's %s check", (state, name) => {
      mockStates = { "drop-1": state };
      renderCard();
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    });

    it("updates with the check, as its seal does", () => {
      mockStates = { "drop-1": "pending" };
      const drop = aDrop();
      const { rerender } = renderCard(drop);
      expect(
        screen.getByRole("button", {
          name: "Open entry, signed, not yet verified",
        })
      ).toBeInTheDocument();

      mockStates = { "drop-1": "verified" };
      rerender(
        <button type="button" aria-labelledby="card-label">
          <AuthorSignedLabel id="card-label" drop={drop} label="Open entry" />
          <DropAuthorSignedIndicator drop={drop} />
        </button>
      );
      expect(
        screen.getByRole("button", { name: "Open entry, signed by its author" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("img", { name: "Signed by its author" })
      ).toBeInTheDocument();
    });

    it("is the plain label for a drop 6529.io marks unsigned", () => {
      renderCard(aDrop({ is_author_signed: false }));
      expect(
        screen.getByRole("button", { name: "Open entry" })
      ).toBeInTheDocument();
      expect(mockUseDropSealStates).toHaveBeenCalledWith(
        [expect.objectContaining({ id: "drop-1" })],
        false
      );
    });
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

    it("counts only the posts this browser verified", () => {
      const group = groupOf(true, true, true);
      mockStates = { "drop-2": "unverified" };
      renderGroup(group);
      expect(
        screen.getByRole("button", {
          name: "2 of 3 posts signed by their author",
        })
      ).toBeInTheDocument();
      expect(mockUseDropSealStates).toHaveBeenLastCalledWith(group, true);
    });

    it.each([
      [
        "checking",
        { "drop-2": "pending" },
        "Checking the signatures in this group",
        "pending",
      ],
      [
        "not matching",
        { "drop-1": "pending", "drop-2": "failed" },
        "A signature in this group doesn't match its post",
        "failed",
      ],
      [
        "not verified",
        {
          "drop-1": "unverified",
          "drop-2": "unverified",
          "drop-3": "unverified",
        },
        "Signed posts, not yet verified",
        "unverified",
      ],
    ])(
      "never claims signatures while a post is %s",
      (_name, states, label, state) => {
        mockStates = states;
        renderGroup(groupOf(true, true, true));
        const seal = screen.getByRole("button", { name: label });
        expect(
          seal.querySelector(`[data-seal-state="${state}"]`)
        ).not.toBeNull();
      }
    );

    it("checks only the posts 6529.io marks as signed", () => {
      const group = groupOf(false, true);
      renderGroup(group);
      expect(mockUseDropSealStates).toHaveBeenLastCalledWith([group[1]], true);
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

  it("never claims a verified signature on a static seal without its drop", () => {
    render(<DropAuthorSignedIndicator />);

    expect(
      screen.getByRole("img", { name: "Signed, not yet verified" })
    ).toBeInTheDocument();
  });

  it("labels a static seal from this browser's check of its drop", () => {
    const drop = aDrop();
    const { rerender } = render(<DropAuthorSignedIndicator drop={drop} />);
    expect(
      screen.getByRole("img", { name: "Signed by its author" })
    ).toBeInTheDocument();
    expect(mockUseDropSealStates).toHaveBeenLastCalledWith([drop], true);

    mockStates = { "drop-1": "pending" };
    rerender(<DropAuthorSignedIndicator drop={{ ...drop }} />);
    expect(
      screen.getByRole("img", { name: "Checking the author's signature" })
    ).toBeInTheDocument();
  });
});
