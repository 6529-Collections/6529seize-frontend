import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveDropQuote from "@/components/waves/drops/WaveDropQuote";
import { LinkPreviewProvider } from "@/components/waves/LinkPreviewContext";
import { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";

let markdownProps: any;
let mockProposalCardPresentation = "default";
const visibleModeration = {
  status: ApiDropModerationStatus.Visible,
  can_view: true,
};

jest.mock("@/hooks/waves/useWaveProposalCardPresentation", () => ({
  useWaveProposalCardPresentation: () => mockProposalCardPresentation,
}));

jest.mock(
  "@/components/waves/drops/proposal/ProposalCardContent",
  () => (props: any) => (
    <div data-testid="proposal-card">{props.drop.parts[0]?.content}</div>
  )
);

jest.mock(
  "@/components/drops/view/part/DropPartMarkdownWithPropLogger",
  () => (props: any) => {
    markdownProps = props;
    return <div data-testid="markdown">{props.partContent}</div>;
  }
);
jest.mock("@/components/user/utils/UserCICAndLevel", () => ({
  __esModule: true,
  default: () => <div data-testid="cic" />,
  UserCICAndLevelSize: { SMALL: "SMALL" },
}));
jest.mock("next/link", () => ({ children, href }: any) => (
  <a href={href}>{children}</a>
));

beforeEach(() => {
  markdownProps = undefined;
  mockProposalCardPresentation = "default";
});

test("renders loading placeholder when drop missing", () => {
  const { container } = render(
    <WaveDropQuote drop={null} partId={1} onQuoteClick={jest.fn()} />
  );
  expect(container.querySelector(".tw-animate-pulse")).toBeInTheDocument();
  expect(screen.queryByText("Drop not found")).not.toBeInTheDocument();
});

test("renders not-found state without loading placeholder", () => {
  const { container } = render(
    <WaveDropQuote
      drop={null}
      partId={1}
      onQuoteClick={jest.fn()}
      isNotFound={true}
    />
  );

  expect(screen.getByText("Drop not found")).toBeInTheDocument();
  expect(container.querySelector(".tw-animate-pulse")).not.toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test("does not call onQuoteClick from not-found state", async () => {
  const onQuoteClick = jest.fn();
  render(
    <WaveDropQuote
      drop={null}
      partId={1}
      onQuoteClick={onQuoteClick}
      isNotFound={true}
    />
  );

  await userEvent.click(screen.getByText("Drop not found"));

  expect(onQuoteClick).not.toHaveBeenCalled();
});

test("does not bubble loading quote clicks to parent", async () => {
  const onParentClick = jest.fn();
  const { container } = render(
    <div onClick={onParentClick}>
      <WaveDropQuote drop={null} partId={1} onQuoteClick={jest.fn()} />
    </div>
  );
  const loadingPlaceholder = container.querySelector(".tw-animate-pulse");

  expect(loadingPlaceholder).toBeInTheDocument();

  await userEvent.click(loadingPlaceholder as Element);

  expect(onParentClick).not.toHaveBeenCalled();
});

test("does not bubble not-found quote clicks to parent", async () => {
  const onParentClick = jest.fn();
  render(
    <div onClick={onParentClick}>
      <WaveDropQuote
        drop={null}
        partId={1}
        onQuoteClick={jest.fn()}
        isNotFound={true}
      />
    </div>
  );

  await userEvent.click(screen.getByText("Drop not found"));

  expect(onParentClick).not.toHaveBeenCalled();
});

test("calls onQuoteClick on interaction", async () => {
  const drop = {
    id: "d1",
    wave: { id: "w1", name: "wave" },
    author: { handle: "a", level: 1, cic: "BRONZE", pfp: null },
    parts: [{ part_id: 1, content: "hello" }],
    created_at: "2020-01-01",
    mentioned_users: [],
    referenced_nfts: [],
    moderation: visibleModeration,
  } as any;
  const onQuoteClick = jest.fn();
  const onParentClick = jest.fn();
  render(
    <div onClick={onParentClick}>
      <WaveDropQuote drop={drop} partId={1} onQuoteClick={onQuoteClick} />
    </div>
  );
  await userEvent.click(screen.getByRole("button"));
  expect(onQuoteClick).toHaveBeenCalledWith(drop);
  expect(onParentClick).not.toHaveBeenCalled();
});

test("opens the original post from a removed quote tombstone", async () => {
  const drop = {
    id: "d1",
    serial_no: 42,
    wave: { id: "w1", name: "wave" },
    author: { id: "author-1", handle: "a", pfp: null },
    moderation: {
      status: ApiDropModerationStatus.ModeratorRemoved,
      can_view: false,
    },
  } as any;
  const onQuoteClick = jest.fn();

  render(<WaveDropQuote drop={drop} partId={1} onQuoteClick={onQuoteClick} />);

  await userEvent.click(
    screen.getByRole("button", {
      name: "Content removed by moderators. View original post",
    })
  );

  expect(onQuoteClick).toHaveBeenCalledWith(drop);
});

test("redacts a stale author-only removed quote for a non-author", () => {
  const drop = {
    id: "d1",
    serial_no: 42,
    wave: { id: "w1", name: "wave" },
    author: { id: "author-1", handle: "a", pfp: null },
    parts: [{ part_id: 1, content: "Removed quote content" }],
    moderation: {
      status: ApiDropModerationStatus.ModeratorRemoved,
      can_view: true,
    },
  } as any;

  render(<WaveDropQuote drop={drop} partId={1} onQuoteClick={jest.fn()} />);

  expect(screen.getByText("Content removed by moderators")).toBeInTheDocument();
  expect(screen.queryByText("Removed quote content")).not.toBeInTheDocument();
  expect(screen.queryByTestId("markdown")).not.toBeInTheDocument();
});

test("displays quoted part content", () => {
  const drop = {
    id: "d1",
    serial_no: 42,
    wave: { id: "w1", name: "wave" },
    author: { handle: "a", level: 1, cic: "BRONZE", pfp: null },
    parts: [{ part_id: 5, content: "text" }],
    created_at: "2020-01-01",
    mentioned_users: [],
    referenced_nfts: [],
    moderation: visibleModeration,
  } as any;
  render(<WaveDropQuote drop={drop} partId={5} onQuoteClick={jest.fn()} />);
  expect(screen.getByTestId("markdown")).toHaveTextContent("text");
  expect(markdownProps.quotePath).toContain("w1:42");
});

test("uses the reusable compact card for a quoted proposal in an opted-in wave", () => {
  mockProposalCardPresentation = "proposalCard";
  const drop = {
    id: "proposal-1",
    drop_type: "PARTICIPATORY",
    serial_no: 42,
    wave: { id: "network-museum", name: "Network Museum" },
    author: { handle: "a", level: 1, cic: "BRONZE", pfp: null },
    parts: [{ part_id: 1, content: "Complete authored proposal" }],
    created_at: "2020-01-01",
    mentioned_users: [],
    referenced_nfts: [],
    moderation: visibleModeration,
  } as any;

  render(<WaveDropQuote drop={drop} partId={1} onQuoteClick={jest.fn()} />);

  expect(screen.getByTestId("proposal-card")).toHaveTextContent(
    "Complete authored proposal"
  );
  expect(screen.queryByTestId("markdown")).not.toBeInTheDocument();
});

test("keeps quoted chat messages normal in an opted-in proposal wave", () => {
  mockProposalCardPresentation = "proposalCard";
  const drop = {
    id: "chat-1",
    drop_type: "CHAT",
    serial_no: 43,
    wave: { id: "network-museum", name: "Network Museum" },
    author: { handle: "a", level: 1, cic: "BRONZE", pfp: null },
    parts: [{ part_id: 1, content: "Normal chat message" }],
    created_at: "2020-01-01",
    mentioned_users: [],
    referenced_nfts: [],
    moderation: visibleModeration,
  } as any;

  render(<WaveDropQuote drop={drop} partId={1} onQuoteClick={jest.fn()} />);

  expect(screen.getByTestId("markdown")).toHaveTextContent(
    "Normal chat message"
  );
  expect(screen.queryByTestId("proposal-card")).not.toBeInTheDocument();
});

test("updates quoted part when partId changes on rerender", () => {
  const drop = {
    id: "d1",
    serial_no: 42,
    wave: { id: "w1", name: "wave" },
    author: { handle: "a", level: 1, cic: "BRONZE", pfp: null },
    parts: [
      { part_id: 1, content: "first" },
      { part_id: 2, content: "second" },
    ],
    created_at: "2020-01-01",
    mentioned_users: [],
    referenced_nfts: [],
    moderation: visibleModeration,
  } as any;

  const { rerender } = render(
    <WaveDropQuote drop={drop} partId={1} onQuoteClick={jest.fn()} />
  );
  expect(screen.getByTestId("markdown")).toHaveTextContent("first");

  rerender(<WaveDropQuote drop={drop} partId={2} onQuoteClick={jest.fn()} />);
  expect(screen.getByTestId("markdown")).toHaveTextContent("second");
});

test("clears quoted part content when drop becomes null", () => {
  const drop = {
    id: "d1",
    serial_no: 42,
    wave: { id: "w1", name: "wave" },
    author: { handle: "a", level: 1, cic: "BRONZE", pfp: null },
    parts: [{ part_id: 5, content: "text" }],
    created_at: "2020-01-01",
    mentioned_users: [],
    referenced_nfts: [],
    moderation: visibleModeration,
  } as any;

  const { rerender } = render(
    <WaveDropQuote drop={drop} partId={5} onQuoteClick={jest.fn()} />
  );
  expect(screen.getByTestId("markdown")).toHaveTextContent("text");

  rerender(<WaveDropQuote drop={null} partId={5} onQuoteClick={jest.fn()} />);
  expect(screen.getByTestId("markdown")).toHaveTextContent("");
});

test("passes explicit link-card suppression callback into nested markdown", () => {
  const drop = {
    id: "d1",
    serial_no: 42,
    wave: { id: "w1", name: "wave" },
    author: { handle: "a", level: 1, cic: "BRONZE", pfp: null },
    parts: [{ part_id: 5, content: "text" }],
    created_at: "2020-01-01",
    mentioned_users: [],
    referenced_nfts: [],
    moderation: visibleModeration,
  } as any;
  const onLinkCardActionsActiveChange = jest.fn();

  render(
    <WaveDropQuote
      drop={drop}
      partId={5}
      onQuoteClick={jest.fn()}
      onLinkCardActionsActiveChange={onLinkCardActionsActiveChange}
    />
  );

  expect(markdownProps.onLinkCardActionsActiveChange).toBe(
    onLinkCardActionsActiveChange
  );
});

test("passes hidden link preview setting into nested markdown", () => {
  const drop = {
    id: "d1",
    serial_no: 42,
    wave: { id: "w1", name: "wave" },
    author: { handle: "a", level: 1, cic: "BRONZE", pfp: null },
    parts: [{ part_id: 5, content: "https://example.com" }],
    created_at: "2020-01-01",
    mentioned_users: [],
    referenced_nfts: [],
    moderation: visibleModeration,
  } as any;

  render(
    <WaveDropQuote
      drop={drop}
      partId={5}
      onQuoteClick={jest.fn()}
      hideLinkPreviews={true}
    />
  );

  expect(markdownProps.hideLinkPreviews).toBeTruthy();
});

test("falls back to link preview context for nested markdown suppression", () => {
  const drop = {
    id: "d1",
    serial_no: 42,
    wave: { id: "w1", name: "wave" },
    author: { handle: "a", level: 1, cic: "BRONZE", pfp: null },
    parts: [{ part_id: 5, content: "text" }],
    created_at: "2020-01-01",
    mentioned_users: [],
    referenced_nfts: [],
    moderation: visibleModeration,
  } as any;
  const onCardActionsActiveChange = jest.fn();

  render(
    <LinkPreviewProvider onCardActionsActiveChange={onCardActionsActiveChange}>
      <WaveDropQuote drop={drop} partId={5} onQuoteClick={jest.fn()} />
    </LinkPreviewProvider>
  );

  expect(markdownProps.onLinkCardActionsActiveChange).toBe(
    onCardActionsActiveChange
  );
});
