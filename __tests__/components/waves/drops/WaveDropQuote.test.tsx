import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveDropQuote from "@/components/waves/drops/WaveDropQuote";
import { LinkPreviewProvider } from "@/components/waves/LinkPreviewContext";

let markdownProps: any;

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
  } as any;
  render(<WaveDropQuote drop={drop} partId={5} onQuoteClick={jest.fn()} />);
  expect(screen.getByTestId("markdown")).toHaveTextContent("text");
  expect(markdownProps.quotePath).toContain("w1:42");
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
