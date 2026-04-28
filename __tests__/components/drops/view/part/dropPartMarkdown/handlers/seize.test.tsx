import { render, screen } from "@testing-library/react";
import React from "react";

import { createSeizeHandlers } from "@/components/drops/view/part/dropPartMarkdown/handlers/seize";
import {
  parseSeizeDropLink,
  parseSeizeQuoteLink,
} from "@/helpers/SeizeLinkParser";

const mockDropItemChat = jest.fn(
  ({ href, dropId }: { href: string; dropId: string }) => (
    <div data-testid="drop-item-chat" data-href={href} data-drop-id={dropId} />
  )
);

const mockRenderSeizeQuote = jest.fn(() => (
  <div data-testid="seize-quote-content" />
));
const mockQuorumParticipationDropLinkPreview = jest.fn((props: any) => (
  <div
    data-testid="quorum-participation-preview"
    data-drop-id={props.dropId}
    data-serial-no={props.serialNo}
  />
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

jest.mock(
  "@/components/waves/quorum/QuorumParticipationDropLinkPreview",
  () => ({
    __esModule: true,
    default: (props: any) => mockQuorumParticipationDropLinkPreview(props),
  })
);

jest.mock("@/components/drops/view/part/dropPartMarkdown/renderers", () => ({
  renderSeizeQuote: (...args: any[]) => mockRenderSeizeQuote(...args),
}));

const mockedParseSeizeDropLink = parseSeizeDropLink as jest.MockedFunction<
  typeof parseSeizeDropLink
>;
const mockedParseSeizeQuoteLink = parseSeizeQuoteLink as jest.MockedFunction<
  typeof parseSeizeQuoteLink
>;

const getHandlers = (options?: {
  readonly onQuoteClick?: ((drop: any) => void) | undefined;
  readonly currentDropId?: string | undefined;
  readonly isMemesWaveById?:
    | ((waveId: string | undefined | null) => boolean)
    | undefined;
  readonly isQuorumWaveById?:
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
    isQuorumWaveById: options?.isQuorumWaveById,
  });

const getDropHandler = (options?: Parameters<typeof getHandlers>[0]) =>
  getHandlers(options)[3]!;

const getQuoteHandler = (options?: Parameters<typeof getHandlers>[0]) =>
  getHandlers(options)[0]!;

describe("createSeizeHandlers drop handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedParseSeizeDropLink.mockReturnValue(null);
    mockedParseSeizeQuoteLink.mockReturnValue(null);
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

  it("renders quorum participation preview for quorum drop links", () => {
    const onQuoteClick = jest.fn();
    mockedParseSeizeDropLink.mockReturnValue({
      waveId: "quorum-wave-id",
      dropId: "drop-1",
    });
    const handler = getDropHandler({
      onQuoteClick,
      isMemesWaveById: () => false,
      isQuorumWaveById: (waveId) => waveId === "quorum-wave-id",
    });

    const href = "https://site.com/waves/quorum-wave-id?drop=drop-1";
    const element = handler.render(href);
    render(<>{element}</>);

    expect(screen.getByTestId("quorum-participation-preview")).toHaveAttribute(
      "data-drop-id",
      "drop-1"
    );
    expect(mockQuorumParticipationDropLinkPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        href,
        waveId: "quorum-wave-id",
        dropId: "drop-1",
        onQuoteClick,
        embedPath: [],
        quotePath: [],
        embedDepth: 1,
        maxEmbedDepth: 4,
      })
    );
    expect(mockRenderSeizeQuote).not.toHaveBeenCalled();
    expect(mockDropItemChat).not.toHaveBeenCalled();
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

  it("renders quorum participation preview for quorum serial links", () => {
    const onQuoteClick = jest.fn();
    mockedParseSeizeQuoteLink.mockReturnValue({
      waveId: "quorum-wave-id",
      serialNo: "7",
    });
    const handler = getQuoteHandler({
      onQuoteClick,
      isQuorumWaveById: (waveId) => waveId === "quorum-wave-id",
    });

    const href = "https://site.com/waves/quorum-wave-id?serialNo=7";
    const element = handler.render(href);
    render(<>{element}</>);

    expect(screen.getByTestId("quorum-participation-preview")).toHaveAttribute(
      "data-serial-no",
      "7"
    );
    expect(mockQuorumParticipationDropLinkPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        href,
        waveId: "quorum-wave-id",
        serialNo: "7",
        onQuoteClick,
        embedPath: [],
        quotePath: ["quorum-wave-id:7"],
        embedDepth: 1,
        maxEmbedDepth: 4,
        hideLink: true,
      })
    );
    expect(mockRenderSeizeQuote).not.toHaveBeenCalled();
  });
});
