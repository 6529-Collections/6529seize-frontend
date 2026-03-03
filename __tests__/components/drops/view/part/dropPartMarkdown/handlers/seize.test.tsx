import { render, screen } from "@testing-library/react";
import React from "react";

import { createSeizeHandlers } from "@/components/drops/view/part/dropPartMarkdown/handlers/seize";
import { parseSeizeDropLink } from "@/helpers/SeizeLinkParser";

const mockDropItemChat = jest.fn(
  ({ href, dropId }: { href: string; dropId: string }) => (
    <div data-testid="drop-item-chat" data-href={href} data-drop-id={dropId} />
  )
);

const mockRenderSeizeQuote = jest.fn(() => (
  <div data-testid="seize-quote-content" />
));

jest.mock("@/helpers/SeizeLinkParser", () => ({
  parseSeizeDropLink: jest.fn(),
  parseSeizeQueryLink: jest.fn(() => null),
  parseSeizeWaveLink: jest.fn(() => null),
  parseSeizeQuoteLink: jest.fn(() => null),
}));

jest.mock("@/components/waves/drops/DropItemChat", () => ({
  __esModule: true,
  default: (props: any) => mockDropItemChat(props),
}));

jest.mock("@/components/drops/view/part/dropPartMarkdown/renderers", () => ({
  renderSeizeQuote: (...args: any[]) => mockRenderSeizeQuote(...args),
}));

const mockedParseSeizeDropLink = parseSeizeDropLink as jest.MockedFunction<
  typeof parseSeizeDropLink
>;

const getDropHandler = (options?: {
  readonly onQuoteClick?: ((drop: any) => void) | undefined;
  readonly currentDropId?: string | undefined;
  readonly isMemesWaveById?:
    | ((waveId: string | undefined | null) => boolean)
    | undefined;
}) =>
  createSeizeHandlers({
    onQuoteClick: options?.onQuoteClick ?? jest.fn(),
    currentDropId: options?.currentDropId,
    embedPath: [],
    quotePath: [],
    embedDepth: 0,
    maxEmbedDepth: 4,
    isMemesWaveById: options?.isMemesWaveById,
  })[3];

describe("createSeizeHandlers drop handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps DropItemChat rendering for memes waves", () => {
    mockedParseSeizeDropLink.mockReturnValue({
      waveId: "memes-wave-id",
      dropId: "drop-1",
    });
    const handler = getDropHandler({
      isMemesWaveById: (waveId) => waveId === "memes-wave-id",
    });

    const element = handler.render(
      "https://site.com/waves/memes-wave-id?drop=drop-1"
    );
    render(<>{element}</>);

    expect(screen.getByTestId("drop-item-chat")).toHaveAttribute(
      "data-drop-id",
      "drop-1"
    );
    expect(mockRenderSeizeQuote).not.toHaveBeenCalled();
  });

  it("renders quote-style preview for non-memes waves", () => {
    const onQuoteClick = jest.fn();
    mockedParseSeizeDropLink.mockReturnValue({
      waveId: "normal-wave-id",
      dropId: "drop-2",
    });
    const handler = getDropHandler({
      onQuoteClick,
      isMemesWaveById: () => false,
    });

    const href = "https://site.com/waves/normal-wave-id?drop=drop-2";
    const element = handler.render(href);
    render(<>{element}</>);

    expect(screen.getByTestId("seize-quote-content")).toBeInTheDocument();
    expect(mockRenderSeizeQuote).toHaveBeenCalledWith(
      {
        waveId: "normal-wave-id",
        dropId: "drop-2",
      },
      onQuoteClick,
      href,
      {
        embedPath: [],
        quotePath: [],
        embedDepth: 1,
        maxEmbedDepth: 4,
      }
    );
    expect(mockDropItemChat).not.toHaveBeenCalled();
  });

  it("falls back to DropItemChat when wave id is unavailable", () => {
    mockedParseSeizeDropLink.mockReturnValue({
      waveId: null,
      dropId: "drop-3",
    });
    const handler = getDropHandler({
      isMemesWaveById: () => false,
    });

    const element = handler.render("https://site.com/messages?drop=drop-3");
    render(<>{element}</>);

    expect(screen.getByTestId("drop-item-chat")).toHaveAttribute(
      "data-drop-id",
      "drop-3"
    );
    expect(mockRenderSeizeQuote).not.toHaveBeenCalled();
  });

  it("keeps recursion guard for current drop id", () => {
    mockedParseSeizeDropLink.mockReturnValue({
      waveId: "normal-wave-id",
      dropId: "drop-4",
    });
    const handler = getDropHandler({
      currentDropId: "drop-4",
      isMemesWaveById: () => false,
    });

    expect(() =>
      handler.render("https://site.com/waves/normal-wave-id?drop=drop-4")
    ).toThrow("Seize drop link matches current drop");
  });
});
