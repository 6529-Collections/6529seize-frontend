import { render, screen } from "@testing-library/react";

import { createGifHandler } from "@/components/drops/view/part/dropPartMarkdown/handlers/gif";
import { renderGifEmbed } from "@/components/drops/view/part/dropPartMarkdown/renderers";

jest.mock("@/components/drops/view/part/dropPartMarkdown/renderers", () => ({
  renderGifEmbed: jest.fn((url: string, options?: { fixedSize?: boolean }) => (
    <div
      data-testid="gif-embed"
      data-url={url}
      data-fixed-size={options?.fixedSize ? "true" : "false"}
    />
  )),
}));

const mockRenderGifEmbed = renderGifEmbed as jest.MockedFunction<
  typeof renderGifEmbed
>;

describe("createGifHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("matches only Tenor GIF URLs", () => {
    const handler = createGifHandler();

    expect(handler.match("https://media.tenor.com/abc/tenor.gif")).toBe(true);
    expect(handler.match("https://media.tenor.com/abc/tenor.jpg")).toBe(false);
    expect(handler.match("https://media.giphy.com/media/abc/giphy.gif")).toBe(
      false
    );
    expect(handler.match("https://example.com/image.gif")).toBe(false);
  });

  it("renders fixed-size GIFs for chat/default variant", () => {
    const handler = createGifHandler({ linkPreviewVariant: "chat" });
    const element = handler.render("https://media.tenor.com/abc/tenor.gif");

    render(<>{element}</>);

    expect(screen.getByTestId("gif-embed")).toHaveAttribute(
      "data-fixed-size",
      "true"
    );
    expect(mockRenderGifEmbed).toHaveBeenCalledWith(
      "https://media.tenor.com/abc/tenor.gif",
      { fixedSize: true }
    );
  });

  it("renders non-fixed GIFs for home variant", () => {
    const handler = createGifHandler({ linkPreviewVariant: "home" });
    const element = handler.render("https://media.tenor.com/abc/tenor.gif");

    render(<>{element}</>);

    expect(screen.getByTestId("gif-embed")).toHaveAttribute(
      "data-fixed-size",
      "false"
    );
    expect(mockRenderGifEmbed).toHaveBeenCalledWith(
      "https://media.tenor.com/abc/tenor.gif",
      { fixedSize: false }
    );
  });
});
