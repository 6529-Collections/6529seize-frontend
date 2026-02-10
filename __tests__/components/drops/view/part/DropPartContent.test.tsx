import { render, screen } from "@testing-library/react";
import DropPartContent from "@/components/drops/view/part/DropPartContent";

let markdownProps: any;

jest.mock("@/components/drops/view/part/DropPartMarkdown", () => ({
  __esModule: true,
  default: (props: any) => {
    markdownProps = props;
    return <div data-testid="markdown" />;
  },
}));
jest.mock(
  "@/components/drops/view/item/content/media/DropListItemContentMedia",
  () => ({
    __esModule: true,
    default: (props: any) => (
      <div data-testid="media" data-src={props.media_url} />
    ),
  })
);

const baseProps = {
  mentionedUsers: [],
  referencedNfts: [],
  partContent: "text",
  onQuoteClick: jest.fn(),
  currentDropId: "drop-1",
  currentPartCount: 1,
};

beforeEach(() => {
  markdownProps = undefined;
});

it("renders markdown and medias", () => {
  render(
    <DropPartContent
      {...baseProps}
      partMedias={[{ mimeType: "image/png", mediaSrc: "u" }]}
    />
  );
  expect(screen.getByTestId("markdown")).toBeInTheDocument();
  expect(screen.getByTestId("media")).toHaveAttribute("data-src", "u");
  expect(markdownProps.currentDropId).toBe("drop-1");
});

it("omits media container when none", () => {
  const { container } = render(
    <DropPartContent {...baseProps} partMedias={[]} />
  );
  expect(container.querySelectorAll('[data-testid="media"]').length).toBe(0);
});
