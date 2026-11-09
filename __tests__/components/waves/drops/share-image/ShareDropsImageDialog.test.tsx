import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShareDropsImageDialog from "@/components/waves/drops/share-image/ShareDropsImageDialog";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";

jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: () => ({
    findNativeEmoji: (id: string) =>
      id === "fire" ? { skins: [{ native: "🔥" }] } : null,
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
jest.mock("@/lib/display-time-zone/displayTimeZone", () => ({
  ...jest.requireActual("@/lib/display-time-zone/displayTimeZone"),
  getDeviceTimeZone: () => "America/New_York",
}));

const FIRST = Date.parse("2026-11-09T17:04:00Z");
const makeDrop = (serialNo: number, minutes: number, text: string) =>
  ({
    id: `drop-${serialNo}`,
    serial_no: serialNo,
    type: DropSize.FULL,
    stableKey: `drop-${serialNo}`,
    stableHash: `drop-${serialNo}`,
    created_at: FIRST + minutes * 60_000,
    author: { handle: `author${serialNo}`, level: 27, pfp: null },
    parts: [{ content: text, media: [], quoted_drop: null }],
    reactions:
      serialNo === 1 ? [{ reaction: ":fire:", profiles: [{}, {}, {}] }] : [],
    mentioned_users: [],
    mentioned_groups: [],
    mentioned_waves: [],
    referenced_nfts: [],
    nft_links: [],
  }) as unknown as ExtendedDrop;

const DROPS = [
  makeDrop(1, 0, "Works for me."),
  makeDrop(2, 11, "Recording is fine."),
];
const PUBLIC_WAVE = {
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

function renderDialog(wave = PUBLIC_WAVE) {
  return render(
    <ShareDropsImageDialog
      wave={wave}
      drops={DROPS}
      onBack={jest.fn()}
      onClose={jest.fn()}
    />
  );
}

describe("ShareDropsImageDialog", () => {
  it("defaults to UTC times and names the zone in the image", () => {
    renderDialog();

    expect(screen.getByRole("radio", { name: /^UTC/ })).toBeChecked();
    expect(screen.getByText("Nov 9, 2026 · UTC")).toBeInTheDocument();
    expect(screen.getByText("· 05:04 PM UTC")).toBeInTheDocument();
    expect(screen.getByText("· 05:15 PM UTC")).toBeInTheDocument();
    expect(screen.getByText("🔥")).toBeInTheDocument();
    expect(
      screen.getByText("Made on your device. Nothing is uploaded.")
    ).toBeInTheDocument();
  });

  it("switches to time since the first post or hides times", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(
      screen.getByRole("radio", { name: /Time since first post/ })
    );
    expect(screen.getByText("· +0 min")).toBeInTheDocument();
    expect(screen.getByText("· +11 min")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /Hide times/ }));
    expect(screen.queryByText(/· \+/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Nov 9, 2026 · UTC · times hidden")
    ).toBeInTheDocument();
  });

  it("warns when the image would show the device's own zone", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("radio", { name: /Another time zone/ }));
    expect(screen.getByLabelText("Time zone")).toHaveValue("America/New_York");
    expect(screen.getByText(/This is your local time/)).toBeInTheDocument();
    expect(screen.getByText("· 12:04 PM EST")).toBeInTheDocument();
  });

  it("copies text with the same times as the image", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Copy text" }));

    expect(writeText).toHaveBeenCalledWith(
      [
        "Generative Art Salon · Nov 9, 2026 · UTC",
        "",
        "author1 · 05:04 PM UTC",
        "Works for me.",
        "",
        "author2 · 05:15 PM UTC",
        "Recording is fine.",
      ].join("\n")
    );
    expect(screen.getByRole("status")).toHaveTextContent("Text copied");
  });

  it("reminds about private conversations", () => {
    renderDialog({
      ...(PUBLIC_WAVE as object),
      visibility: { scope: { group: { id: "group-1" } } },
    } as never);
    expect(
      screen.getByText(/These posts are from a private conversation/)
    ).toBeInTheDocument();
  });
});
