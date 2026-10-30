import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveDropPart from "@/components/waves/drops/WaveDropPart";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

// Markdown parsing is covered elsewhere; render the link card it produces for
// a bare URL so the real card and its action menu sit inside the post.
jest.mock("@/components/waves/drops/WaveDropPartContentMarkdown", () => {
  const { default: LinkPreviewCard } = jest.requireActual(
    "@/components/waves/LinkPreviewCard"
  );
  const href = "https://www.transient.xyz/mint/feed-card";
  return {
    __esModule: true,
    default: ({ part }: { readonly part: { readonly content: string } }) => (
      <div>
        <p>{part.content}</p>
        <LinkPreviewCard
          href={href}
          renderFallback={() => <a href={href}>{href}</a>}
        />
      </div>
    ),
  };
});
jest.mock("@/services/api/link-preview-api", () => ({
  fetchLinkPreview: jest.fn(),
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));
jest.mock("@/hooks/useDeviceInfo", () => () => ({ isApp: false }));
jest.mock("@/hooks/useInView", () => ({
  useInView: () => [{ current: null }, true],
}));
jest.mock("@/hooks/useOptimizedVideo", () => ({
  useOptimizedVideo: (src: string) => ({ playableUrl: src, isHls: false }),
}));

const { fetchLinkPreview } = jest.requireMock(
  "@/services/api/link-preview-api"
) as { readonly fetchLinkPreview: jest.Mock };

const drop = {
  id: "drop-with-media",
  serial_no: 42,
  parts: [
    {
      part_id: 1,
      content: "New mint is live",
      quoted_drop: null,
      media: [
        { mime_type: "image/png", url: "https://media.example/feed.png" },
        { mime_type: "video/mp4", url: "https://media.example/feed.mp4" },
      ],
      attachments: [],
    },
  ],
  mentioned_users: [],
  mentioned_groups: [],
  mentioned_waves: [],
  referenced_nfts: [],
  wave: { id: "wave-1" },
} as unknown as ExtendedDrop;

const renderPost = async () => {
  const onDropContentClick = jest.fn();
  render(
    <WaveDropPart
      drop={drop}
      activePartIndex={0}
      setActivePartIndex={jest.fn()}
      onDropContentClick={onDropContentClick}
      onQuoteClick={jest.fn()}
      onLongPress={jest.fn()}
      setLongPressTriggered={jest.fn()}
      fullWidthMedia
      fullWidthLinkPreviews
    />
  );
  await screen.findByText("Transient feed card");
  const post = screen
    .getByText("New mint is live")
    .closest<HTMLElement>('[role="button"][tabindex="0"]');
  if (!post) {
    throw new Error("Post content button not found");
  }
  return { onDropContentClick, post };
};

describe("WaveDropPart keyboard activation with media and link cards", () => {
  beforeEach(() => {
    fetchLinkPreview.mockResolvedValue({
      title: "Transient feed card",
      description: "A mint on Transient",
      image: { secureUrl: "https://media.example/card.png" },
    });
  });

  it.each([
    ["Enter", "{Enter}"],
    ["Space", " "],
  ])("opens the focused post on %s", async (_, key) => {
    const user = userEvent.setup();
    const { onDropContentClick, post } = await renderPost();
    expect(post.querySelector("img")).not.toBeNull();
    expect(post.querySelector("video")).not.toBeNull();

    await user.tab();
    expect(post).toHaveFocus();
    await user.keyboard(key);

    expect(onDropContentClick).toHaveBeenCalledTimes(1);
    expect(onDropContentClick).toHaveBeenCalledWith(drop);
  });

  it("opens the post on Enter like a click on the post", async () => {
    const user = userEvent.setup();
    const { onDropContentClick, post } = await renderPost();

    await user.click(within(post).getByText("New mint is live"));
    post.focus();
    await user.keyboard("{Enter}");

    expect(onDropContentClick).toHaveBeenCalledTimes(2);
    expect(onDropContentClick).toHaveBeenNthCalledWith(1, drop);
    expect(onDropContentClick).toHaveBeenNthCalledWith(2, drop);
  });

  it("leaves Enter on the nested image control to that control", async () => {
    const user = userEvent.setup();
    const { onDropContentClick, post } = await renderPost();

    within(post).getByRole("button", { name: "Open drop media" }).focus();
    await user.keyboard("{Enter}");

    expect(await screen.findByTestId("modal-backdrop")).toBeInTheDocument();
    expect(onDropContentClick).not.toHaveBeenCalled();
  });

  it("leaves Space on the nested video control to that control", async () => {
    const user = userEvent.setup();
    const { onDropContentClick, post } = await renderPost();
    const muteToggle = within(post).getByRole("button", {
      name: /^(Mute|Unmute)/,
    });
    const initialLabel = muteToggle.getAttribute("aria-label");

    muteToggle.focus();
    await user.keyboard(" ");

    expect(muteToggle).not.toHaveAttribute("aria-label", initialLabel ?? "");
    expect(onDropContentClick).not.toHaveBeenCalled();
  });

  it("leaves Enter on the nested link-card menu to that menu", async () => {
    const user = userEvent.setup();
    const { onDropContentClick, post } = await renderPost();
    const linkActions = within(post).getByRole("button", {
      name: "Link actions",
    });

    linkActions.focus();
    await user.keyboard("{Enter}");

    expect(linkActions).toHaveAttribute("aria-expanded", "true");
    expect(onDropContentClick).not.toHaveBeenCalled();
  });
});
