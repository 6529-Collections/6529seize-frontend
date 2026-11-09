import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShareDropSelectOverlay from "@/components/waves/drops/share-image/ShareDropSelectOverlay";
import {
  ShareDropsSelectionLayer,
  ShareDropsSelectionProvider,
  useShareDropsSelection,
} from "@/components/waves/drops/share-image/ShareDropsSelectionContext";
import WaveDropShareImageAction from "@/components/waves/drops/share-image/WaveDropShareImageAction";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";

jest.mock("@/components/waves/drops/share-image/ShareDropsImageDialog", () => ({
  __esModule: true,
  default: ({ drops }: { drops: readonly ExtendedDrop[] }) => (
    <div role="dialog" aria-label="Share as image">
      {drops.map((drop) => drop.serial_no).join(",")}
    </div>
  ),
}));

const makeDrop = (serialNo: number): ExtendedDrop =>
  ({
    id: `drop-${serialNo}`,
    serial_no: serialNo,
    type: DropSize.FULL,
    stableKey: `drop-${serialNo}`,
    stableHash: `drop-${serialNo}`,
    created_at: Date.parse("2026-11-09T17:00:00Z") + serialNo * 60_000,
    author: { handle: `author${serialNo}`, level: 10, pfp: null },
    parts: [{ content: `post ${serialNo}`, media: [] }],
    reactions: [],
  }) as unknown as ExtendedDrop;

const DROPS = [1, 2, 3, 4, 5, 6].map(makeDrop);
const WAVE = { id: "wave-1", name: "Sample Wave" } as never;

function Harness() {
  const selection = useShareDropsSelection();
  return (
    <div>
      {DROPS.map((drop) => (
        <div key={drop.id} style={{ position: "relative" }}>
          <WaveDropShareImageAction drop={drop} onSelected={() => undefined} />
          {selection?.isSelecting && <ShareDropSelectOverlay drop={drop} />}
        </div>
      ))}
      <ShareDropsSelectionLayer />
    </div>
  );
}

function renderHarness() {
  return render(
    <ShareDropsSelectionProvider wave={WAVE} drops={DROPS}>
      <Harness />
    </ShareDropsSelectionProvider>
  );
}

describe("Share as image selection", () => {
  it("is not offered outside a wave conversation", () => {
    render(
      <WaveDropShareImageAction drop={DROPS[0]!} onSelected={jest.fn()} />
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("starts from a post's menu and selects the range up to another post", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(
      screen.getAllByRole("button", { name: "Share as image" })[1]!
    );
    expect(screen.getByText("1 post selected")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Select post by author2" })
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(
      screen.getByRole("button", { name: "Select post by author5" })
    );
    expect(screen.getByText("4 posts selected")).toBeInTheDocument();
    for (const serial of [2, 3, 4, 5]) {
      expect(
        screen.getByRole("button", { name: `Select post by author${serial}` })
      ).toHaveAttribute("aria-pressed", "true");
    }
    expect(
      screen.getByRole("button", { name: "Select post by author6" })
    ).toHaveAttribute("aria-pressed", "false");
    const first = screen.getByRole("button", {
      name: "Select post by author2",
    });
    expect(within(first).getByText("First")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(
      screen.getByRole("dialog", { name: "Share as image" })
    ).toHaveTextContent("2,3,4,5");
  });

  it("keeps only the first post when it is selected again", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(
      screen.getAllByRole("button", { name: "Share as image" })[2]!
    );
    await user.click(
      screen.getByRole("button", { name: "Select post by author6" })
    );
    expect(screen.getByText("4 posts selected")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Select post by author3" })
    );
    expect(screen.getByText("1 post selected")).toBeInTheDocument();
  });

  it("cancels with the button or Escape", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(
      screen.getAllByRole("button", { name: "Share as image" })[0]!
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText(/selected$/)).not.toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: "Share as image" })[0]!
    );
    await user.keyboard("{Escape}");
    expect(screen.queryByText(/selected$/)).not.toBeInTheDocument();
  });
});
