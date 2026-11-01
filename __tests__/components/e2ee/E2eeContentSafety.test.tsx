import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { E2eeAttachmentView } from "@/components/e2ee/conversation/E2eeAttachmentView";
import {
  E2eeMessageItem,
  type E2eeMessageActions,
} from "@/components/e2ee/conversation/E2eeMessageItem";
import { E2eeReportDialog } from "@/components/e2ee/conversation/E2eeReportDialog";
import { prepareInlineImage } from "@/components/e2ee/conversation/e2eeInlineImage";
import type { E2eeAttachment, E2eeImported } from "@/lib/e2ee/types";
import {
  ALICE_ID,
  BOB_ID,
  conversation,
  createFakeE2eeEngine,
  GROUP_G,
  message,
  SELF_ID,
} from "./fakeE2eeEngine";

jest.mock("@/components/e2ee/conversation/e2eeInlineImage", () => ({
  ...jest.requireActual("@/components/e2ee/conversation/e2eeInlineImage"),
  prepareInlineImage: jest.fn(),
}));

const prepareMock = jest.mocked(prepareInlineImage);

const actions: E2eeMessageActions = {
  onReply: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onReport: jest.fn(),
  onBlock: jest.fn(),
  onToggleMute: jest.fn(),
  muted: false,
  onReact: jest.fn(),
  onJumpTo: jest.fn(),
};

const IMPORT_AT = Date.UTC(2026, 9, 12, 10, 0);

const imported = (overrides: Partial<E2eeImported> = {}): E2eeImported => ({
  waveId: "wave-1",
  dropId: "drop-1",
  part: 0,
  serialNo: 1,
  authorProfileId: ALICE_ID,
  authorHandle: "alice",
  createdAt: Date.UTC(2025, 2, 3, 14, 2),
  editedAt: null,
  replyToDropId: null,
  mediaNotImported: 0,
  reactions: [],
  ...overrides,
});

const renderMessage = (
  item: ReturnType<typeof message>,
  compact = false,
  chat = conversation()
) =>
  render(
    <ul>
      <E2eeMessageItem
        message={item}
        conversation={chat}
        engine={createFakeE2eeEngine()}
        selfProfileId={SELF_ID}
        replyTarget={null}
        compact={compact}
        canAct
        actions={actions}
      />
    </ul>
  );

describe("imported messages", () => {
  it("names a member author from the member list, never the payload handle", () => {
    renderMessage(
      message({
        id: "m1",
        senderProfileId: BOB_ID,
        serverTs: IMPORT_AT,
        text: "original words",
        imported: imported({ authorHandle: "6529-support" }),
      })
    );
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.queryByText(/6529-support/)).not.toBeInTheDocument();
    expect(screen.getByText("Imported, not verified")).toBeInTheDocument();
    expect(screen.getByText("Moved by bob")).toBeVisible();
  });

  it("shows an author who is not in this chat as Unknown", () => {
    const outsider = "profile-outsider";
    renderMessage(
      message({
        id: "m1",
        senderProfileId: BOB_ID,
        text: "forged",
        imported: imported({
          authorProfileId: outsider,
          authorHandle: "punk6529",
        }),
      })
    );
    expect(screen.getByText("Unknown")).toBeInTheDocument();
    expect(screen.queryByText(/punk6529/)).not.toBeInTheDocument();
    expect(screen.getByText("Moved by bob")).toBeVisible();
  });

  it("says who moved it on every grouped message too", () => {
    renderMessage(
      message({
        id: "m2",
        senderProfileId: BOB_ID,
        text: "second part",
        imported: imported(),
      }),
      true
    );
    expect(screen.getByText("Moved by bob")).toBeVisible();
    expect(screen.getByText("Imported, not verified")).toBeInTheDocument();
  });

  it("calls the viewer You only for their own profile id", () => {
    renderMessage(
      message({
        id: "m3",
        senderProfileId: ALICE_ID,
        text: "you said this",
        imported: imported({ authorProfileId: SELF_ID, authorHandle: "x" }),
      })
    );
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Moved by alice")).toBeVisible();
  });
});

const attachment = (
  overrides: Partial<E2eeAttachment> = {}
): E2eeAttachment => ({
  blob: "blob-1",
  mime: "application/pdf",
  size: 2048,
  name: "invoice.pdf",
  ...overrides,
});

describe("attachments", () => {
  const createObjectURL = jest.fn(() => "blob:local");
  const revokeObjectURL = jest.fn();

  beforeEach(() => {
    prepareMock.mockReset();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
  });

  it("shows and downloads a sanitized file name", () => {
    render(
      <E2eeAttachmentView
        engine={createFakeE2eeEngine()}
        g={GROUP_G}
        messageId="m1"
        attachment={attachment({ name: "../invoice\u202Efdp.exe" })}
      />
    );
    expect(screen.getByText("_invoicefdp.exe")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download _invoicefdp.exe" })
    ).toBeInTheDocument();
  });

  it("renders an image inline once its real size fits", async () => {
    prepareMock.mockResolvedValue(true);
    render(
      <E2eeAttachmentView
        engine={createFakeE2eeEngine()}
        g={GROUP_G}
        messageId="m1"
        attachment={attachment({ mime: "image/png", name: "pixel.png" })}
      />
    );
    expect(
      await screen.findByRole("img", { name: "Image: pixel.png" })
    ).toHaveAttribute("src", "blob:local");
  });

  it("shows an image too large to decode as a file card", async () => {
    prepareMock.mockResolvedValue(false);
    render(
      <E2eeAttachmentView
        engine={createFakeE2eeEngine()}
        g={GROUP_G}
        messageId="m1"
        attachment={attachment({ mime: "image/png", name: "bomb.png" })}
      />
    );
    expect(await screen.findByText("Too large to preview")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download bomb.png" })
    ).toBeInTheDocument();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:local");
  });

  it("does not fetch an image whose claimed size is already too large", () => {
    const engine = createFakeE2eeEngine();
    render(
      <E2eeAttachmentView
        engine={engine}
        g={GROUP_G}
        messageId="m1"
        attachment={attachment({
          mime: "image/png",
          name: "huge.png",
          width: 20_000,
          height: 20_000,
        })}
      />
    );
    expect(screen.getByText("Too large to preview")).toBeInTheDocument();
    expect(engine.getAttachment).not.toHaveBeenCalled();
    expect(prepareMock).not.toHaveBeenCalled();
  });
});

describe("withInlineImageSlot", () => {
  const flush = async () => {
    for (let i = 0; i < 5; i += 1) {
      await Promise.resolve();
    }
  };

  it("runs at most three inline images at a time", async () => {
    const { withInlineImageSlot } = jest.requireActual<
      typeof import("@/components/e2ee/conversation/e2eeInlineImage")
    >("@/components/e2ee/conversation/e2eeInlineImage");
    let running = 0;
    let peak = 0;
    const releases: (() => void)[] = [];
    const task = () =>
      withInlineImageSlot(async () => {
        running += 1;
        peak = Math.max(peak, running);
        await new Promise<void>((resolve) => releases.push(resolve));
        running -= 1;
      });
    const all = Promise.all(Array.from({ length: 7 }, task));
    await flush();
    expect(running).toBe(3);
    while (releases.length > 0) {
      releases.shift()?.();
      await flush();
    }
    await all;
    expect(peak).toBe(3);
    expect(running).toBe(0);
  });
});

describe("E2eeReportDialog", () => {
  const edited = message({
    id: "m1",
    text: "a threat edited in",
    editedAt: IMPORT_AT,
  });

  const renderDialog = () => {
    const engine = createFakeE2eeEngine();
    jest.mocked(engine.reportPreview).mockReturnValue({
      latest: { text: "a threat edited in", attachmentNames: [] },
      original: {
        text: "see you at noon",
        attachmentNames: ["map\u202Egnp.exe", "plan.pdf"],
      },
    });
    render(
      <E2eeReportDialog
        engine={engine}
        g={GROUP_G}
        message={edited}
        onClose={jest.fn()}
        onReported={jest.fn()}
      />
    );
    return engine;
  };

  it("previews exactly what is sent and includes the original only by choice", async () => {
    const engine = renderDialog();
    const dialog = await screen.findByRole("dialog", {
      name: "Report illegal or severe harm",
    });
    expect(within(dialog).getByText("What this report sends")).toBeVisible();
    expect(within(dialog).getByText("a threat edited in")).toBeVisible();
    expect(within(dialog).queryByText("see you at noon")).toBeNull();

    fireEvent.click(
      within(dialog).getByRole("checkbox", {
        name: /Also send the original message/,
      })
    );
    expect(within(dialog).getByText("see you at noon")).toBeVisible();
    expect(
      within(dialog).getByText("Attachments: mapgnp.exe and plan.pdf")
    ).toBeVisible();

    fireEvent.click(
      within(dialog).getByRole("radio", {
        name: "A credible threat of violence",
      })
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Send report" })
    );
    await waitFor(() =>
      expect(engine.report).toHaveBeenCalledWith(
        GROUP_G,
        "m1",
        "CREDIBLE_THREAT_OF_VIOLENCE",
        undefined,
        { includeOriginal: true }
      )
    );
  });

  it("does not offer to send a message it has no signed copy of", async () => {
    const engine = createFakeE2eeEngine();
    jest
      .mocked(engine.reportPreview)
      .mockReturnValue({ latest: null, original: null });
    render(
      <E2eeReportDialog
        engine={engine}
        g={GROUP_G}
        message={edited}
        onClose={jest.fn()}
        onReported={jest.fn()}
      />
    );
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(
        "This message can’t be reported from this device."
      )
    ).toBeVisible();
    expect(
      within(dialog).getByRole("button", { name: "Send report" })
    ).toBeDisabled();
  });
});
