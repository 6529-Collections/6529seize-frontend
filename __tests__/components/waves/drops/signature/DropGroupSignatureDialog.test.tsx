import DropGroupSignatureDialog from "@/components/waves/drops/signature/DropGroupSignatureDialog";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let mockEnabled = true;
jest.mock("@/lib/device-signing/feature", () => ({
  isSignedMessagesEnabled: () => mockEnabled,
}));

const mockVerification = jest.fn();
jest.mock("@/components/waves/drops/signature/DropSignatureDialog", () => ({
  __esModule: true,
  DropSignatureVerification: (props: any) => {
    mockVerification(props);
    return <p>Verified {props.dropId}</p>;
  },
  SignatureDialogFrame: ({ isOpen, onClose, title, children }: any) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <button type="button" onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    ) : null,
}));

const aDrop = (id: string, overrides: Record<string, unknown> = {}) =>
  ({
    id,
    is_author_signed: true,
    title: null,
    parts: [{ content: `Post ${id}` }],
    wave: { id: "wave-1" },
    author: { primary_address: "0x1" },
    created_at: Date.UTC(2026, 9, 31, 8, 50),
    ...overrides,
  }) as any;

describe("DropGroupSignatureDialog", () => {
  beforeEach(() => {
    mockEnabled = true;
    mockVerification.mockClear();
  });

  it("lists every post with its excerpt and status, verifying none up front", () => {
    render(
      <DropGroupSignatureDialog
        group={[
          aDrop("a"),
          aDrop("b", { is_author_signed: false }),
          aDrop("c", { parts: [{ content: null }] }),
        ]}
        isOpen
        onClose={jest.fn()}
      />
    );

    const list = screen.getByRole("list", { name: "Posts in this group" });
    const rows = within(list).getAllByRole("button");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("Post a");
    expect(rows[0]).toHaveTextContent("Signed by its author");
    expect(rows[1]).toHaveTextContent("Not signed by its author");
    expect(rows[2]).toHaveTextContent("Post without text");
    rows.forEach((row) =>
      expect(row).toHaveAttribute("aria-expanded", "false")
    );
    expect(mockVerification).not.toHaveBeenCalled();
  });

  it("verifies a post only when its row is opened, and closes it again", async () => {
    const user = userEvent.setup();
    const b = aDrop("b");
    render(
      <DropGroupSignatureDialog
        group={[aDrop("a"), b]}
        isOpen
        onClose={jest.fn()}
      />
    );

    const row = screen.getByRole("button", { name: /Post b/ });
    await user.click(row);
    expect(row).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Verified b")).toBeInTheDocument();
    expect(row).toHaveAttribute(
      "aria-controls",
      screen.getByText("Verified b").parentElement!.id
    );
    expect(mockVerification).toHaveBeenCalledTimes(1);
    expect(mockVerification).toHaveBeenCalledWith(
      expect.objectContaining({ dropId: "b", drop: b })
    );

    await user.click(row);
    expect(row).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Verified b")).not.toBeInTheDocument();
  });

  it("renders nothing while closed or while signed messages are off", () => {
    const { rerender } = render(
      <DropGroupSignatureDialog
        group={[aDrop("a")]}
        isOpen={false}
        onClose={jest.fn()}
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    mockEnabled = false;
    rerender(
      <DropGroupSignatureDialog
        group={[aDrop("a")]}
        isOpen
        onClose={jest.fn()}
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("post excerpts in the group list", () => {
  beforeEach(() => {
    mockEnabled = true;
  });

  const excerptOf = (overrides: Record<string, unknown>) => {
    render(
      <DropGroupSignatureDialog
        group={[aDrop("a", overrides)]}
        isOpen
        onClose={jest.fn()}
      />
    );
    return screen.getByRole("button", { expanded: false });
  };

  it("uses the title when there is one", () => {
    expect(excerptOf({ title: "  A title " })).toHaveTextContent("A title");
  });

  it("uses the first non-empty line of the text, without Markdown", () => {
    const row = excerptOf({
      parts: [
        { content: "" },
        {
          content:
            "\n## **Bold** [link](https://6529.io) ![img](https://x.y/i.png)\nsecond",
        },
      ],
    });
    expect(row).toHaveTextContent("Bold link");
    expect(row).not.toHaveTextContent("second");
  });

  it("keeps unclosed brackets as text", () => {
    expect(
      excerptOf({ parts: [{ content: "[[a] ![b] [c](d" }] })
    ).toHaveTextContent("[[a] ![b] [c](d");
  });

  it("shortens long lines", () => {
    const row = excerptOf({ parts: [{ content: "x".repeat(200) }] });
    expect(row).toHaveTextContent(`${"x".repeat(79)}…`);
    expect(row).not.toHaveTextContent("x".repeat(80));
  });

  it.each([
    ["only Markdown syntax", [{ content: "**" }]],
    ["no parts", []],
  ])("labels a post with %s", (_name, parts) => {
    expect(excerptOf({ parts })).toHaveTextContent("Post without text");
  });
});
