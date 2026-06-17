import { fireEvent, render, screen } from "@testing-library/react";

import BoostedDropLinkPreview from "@/components/home/boosted/BoostedDropLinkPreview";

jest.mock("@/services/api/link-preview-api", () => ({
  fetchLinkPreview: jest.fn(),
}));

describe("BoostedDropLinkPreview", () => {
  const { fetchLinkPreview } = require("@/services/api/link-preview-api");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the known 6529 Wave Score route with message-backed fallback copy", async () => {
    fetchLinkPreview.mockResolvedValue({});

    render(
      <BoostedDropLinkPreview
        href="https://6529.io/network/wavescore"
        variant="chat"
      />
    );

    const link = await screen.findByRole("link", {
      name: /Network: Wave Score/i,
    });

    expect(link).toHaveAttribute("href", "https://6529.io/network/wavescore");
    expect(screen.getByText("6529")).toBeInTheDocument();
    expect(screen.getByText("6529.io link")).toBeInTheDocument();
    expect(fetchLinkPreview).toHaveBeenCalledWith(
      "https://6529.io/network/wavescore"
    );
  });

  it("uses literal internal paths for unknown 6529 routes", async () => {
    fetchLinkPreview.mockResolvedValue({});

    render(
      <BoostedDropLinkPreview
        href="https://6529.io/network/alpha-beta?tab=posts"
        variant="chat"
      />
    );

    expect(
      await screen.findByText("6529.io/network/alpha-beta?tab=posts")
    ).toBeInTheDocument();
    expect(screen.queryByText("Network / Alpha Beta")).not.toBeInTheDocument();
  });

  it("keeps fallback link clicks out of the parent card open action", async () => {
    const onParentClick = jest.fn();
    const host = document.createElement("div");
    const root = document.createElement("div");
    fetchLinkPreview.mockResolvedValue({});
    host.appendChild(root);
    document.body.appendChild(host);
    host.addEventListener("click", onParentClick);

    const { unmount } = render(
      <BoostedDropLinkPreview
        href="https://6529.io/network/wavescore"
        variant="chat"
      />,
      { container: root }
    );

    try {
      fireEvent.click(
        await screen.findByRole("link", { name: /Network: Wave Score/i })
      );

      expect(onParentClick).not.toHaveBeenCalled();
    } finally {
      unmount();
      host.remove();
    }
  });
});
