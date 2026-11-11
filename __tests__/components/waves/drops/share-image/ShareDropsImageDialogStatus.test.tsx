import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShareDropsImageDialog from "@/components/waves/drops/share-image/ShareDropsImageDialog";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";

jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: () => ({
    emojiMap: [],
    findNativeEmoji: () => null,
    loadEmojiData: () => Promise.resolve(),
  }),
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));
jest.mock("@/hooks/useBodyScrollLock", () => ({
  __esModule: true,
  default: () => undefined,
}));

let mockStatus = "idle";
jest.mock("@/components/waves/drops/share-image/useShareImageExport", () => ({
  canCopyImages: () => false,
  canShareImageFiles: () => true,
  useShareImageExport: () => ({
    status: mockStatus,
    unreadableImages: 0,
    copyImage: jest.fn(),
    download: jest.fn(() => Promise.resolve()),
    share: jest.fn(() => Promise.resolve()),
  }),
}));

const DROP = {
  id: "drop-1",
  serial_no: 1,
  type: DropSize.FULL,
  stableKey: "drop-1",
  stableHash: "drop-1",
  created_at: Date.parse("2026-11-09T17:04:00Z"),
  author: { handle: "author1", level: 27, pfp: null },
  parts: [{ content: "Works for me.", media: [], quoted_drop: null }],
  reactions: [],
  mentioned_users: [],
  mentioned_groups: [],
  mentioned_waves: [],
  referenced_nfts: [],
  nft_links: [],
} as unknown as ExtendedDrop;
const WAVE = {
  id: "wave-1",
  name: "Generative Art Salon",
  picture: null,
  visibility: { scope: { group: null } },
  chat: { scope: { group: null } },
} as never;

beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function showModal(
    this: HTMLDialogElement
  ) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close(
    this: HTMLDialogElement
  ) {
    this.removeAttribute("open");
  };
});

afterEach(() => {
  mockStatus = "idle";
});

function renderDialog() {
  return render(
    <ShareDropsImageDialog
      wave={WAVE}
      drops={[DROP]}
      onBack={jest.fn()}
      onClose={jest.fn()}
    />
  );
}

describe("ShareDropsImageDialog status line", () => {
  it("confirms a completed share", () => {
    mockStatus = "shared";
    renderDialog();
    expect(screen.getByRole("status")).toHaveTextContent("Image shared");
  });

  it("reports text copying after an earlier image action", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    mockStatus = "downloaded";
    renderDialog();
    expect(screen.getByRole("status")).toHaveTextContent(/^Downloaded /);

    await user.click(screen.getByRole("button", { name: "Copy text" }));

    expect(screen.getByRole("status")).toHaveTextContent("Text copied");
  });

  it("fits the preview card to a narrow preview area", () => {
    // The dialog measures once on mount; the observer only has to exist.
    const original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    const width = jest
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockReturnValue(270);
    const height = jest
      .spyOn(HTMLElement.prototype, "offsetHeight", "get")
      .mockReturnValue(600);
    try {
      renderDialog();
      const preview = screen.getByRole("region", { name: "Preview" });
      const sizer = preview.firstElementChild?.firstElementChild as HTMLElement;
      // Half of the 540px card fits 270px; the height follows the scale.
      expect(sizer.style.width).toBe("270px");
      expect(sizer.style.height).toBe("300px");
    } finally {
      width.mockRestore();
      height.mockRestore();
      globalThis.ResizeObserver = original;
    }
  });
});
