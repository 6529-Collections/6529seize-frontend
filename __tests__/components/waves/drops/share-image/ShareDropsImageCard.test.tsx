import { render, screen } from "@testing-library/react";
import ShareDropsImageCard from "@/components/waves/drops/share-image/ShareDropsImageCard";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";

jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: () => ({
    emojiMap: [
      {
        id: "6529",
        name: "6529",
        category: "6529",
        emojis: [
          {
            id: "gm1",
            name: "gm1",
            keywords: [],
            skins: [{ src: "https://cdn.example/gm1.webp" }],
          },
        ],
      },
    ],
    findNativeEmoji: (id: string) =>
      id === "fire" ? { skins: [{ native: "🔥" }] } : null,
    loadEmojiData: () => Promise.resolve(),
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
  parts: [{ content: "gm", media: [], quoted_drop: null }],
  // Feed reactions can carry a count without the list of profiles.
  reactions: [
    { reaction: ":gm1:", count: 7, profiles: [] },
    { reaction: ":fire:", profiles: [{}, {}] },
  ],
} as unknown as ExtendedDrop;

describe("ShareDropsImageCard reactions", () => {
  it("draws custom emoji as images and uses the reaction count", () => {
    render(
      <ShareDropsImageCard
        wave={{ id: "wave-1", name: "Sample Wave", picture: null } as never}
        drops={[DROP]}
        messages={[]}
        time={{ mode: "utc" }}
        include={{ waveHeader: true, reactions: true }}
        locale="en-US"
      />
    );

    const custom = screen.getByRole("img", { name: "gm1" });
    expect(custom).toHaveAttribute("src", "https://cdn.example/gm1.webp");
    expect(custom.closest("span")?.parentElement).toHaveTextContent("7");
    expect(screen.queryByText(":gm1:")).not.toBeInTheDocument();
    expect(screen.getByText("🔥").parentElement).toHaveTextContent("2");
  });
});
