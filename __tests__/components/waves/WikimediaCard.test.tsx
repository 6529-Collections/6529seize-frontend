import { render, screen, waitFor } from "@testing-library/react";

import WikimediaCard from "@/components/waves/WikimediaCard";

jest.mock("@/services/api/wikimedia-card", () => ({
  fetchWikimediaCard: jest.fn(),
}));

describe("WikimediaCard", () => {
  const { fetchWikimediaCard } = require("@/services/api/wikimedia-card");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders article summaries", async () => {
    fetchWikimediaCard.mockResolvedValue({
      kind: "article",
      source: "wikipedia",
      canonicalUrl: "https://en.wikipedia.org/wiki/Example",
      pageUrl: "https://en.wikipedia.org/wiki/Example",
      title: "Example Article",
      description: "Short description",
      extract: "Example extract",
      lang: "en",
      thumbnail: null,
      coordinates: null,
      lastModified: null,
      section: null,
    });

    render(<WikimediaCard href="https://en.wikipedia.org/wiki/Example" />);

    await waitFor(() => {
      expect(screen.getByText("Example Article")).toBeInTheDocument();
    });

    expect(screen.getByText("Short description")).toBeInTheDocument();
    expect(screen.getByText("Example extract")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Wikipedia" })
    ).toHaveAttribute("href", "https://en.wikipedia.org/wiki/Example");
  });

  it("renders disambiguation lists", async () => {
    fetchWikimediaCard.mockResolvedValue({
      kind: "disambiguation",
      source: "wikipedia",
      canonicalUrl: "https://en.wikipedia.org/wiki/Foo",
      pageUrl: "https://en.wikipedia.org/wiki/Foo",
      title: "Foo",
      description: "Multiple topics",
      extract: null,
      lang: "en",
      section: null,
      items: [
        {
          title: "Foo (bar)",
          description: "Example entry",
          url: "https://en.wikipedia.org/wiki/Foo_(bar)",
          thumbnail: null,
        },
      ],
    });

    render(<WikimediaCard href="https://en.wikipedia.org/wiki/Foo" />);

    await waitFor(() => {
      expect(screen.getByText("Foo (bar)")).toBeInTheDocument();
    });

    expect(screen.getByText("Example entry")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Foo \(bar\)/i })).toHaveAttribute(
      "href",
      "https://en.wikipedia.org/wiki/Foo_(bar)"
    );
  });

  it("renders commons metadata", async () => {
    fetchWikimediaCard.mockResolvedValue({
      kind: "commons-file",
      source: "wikimedia-commons",
      canonicalUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
      title: "File:Example.jpg",
      description: "An example file",
      credit: "Jane Doe",
      author: null,
      license: { name: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/", requiresAttribution: true },
      thumbnail: null,
      original: null,
    });

    render(<WikimediaCard href="https://commons.wikimedia.org/wiki/File:Example.jpg" />);

    await waitFor(() => {
      expect(screen.getByText("File:Example.jpg")).toBeInTheDocument();
    });

    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "CC BY-SA 4.0" })
    ).toHaveAttribute("href", "https://creativecommons.org/licenses/by-sa/4.0/");
  });

  it("renders unavailable state", async () => {
    fetchWikimediaCard.mockResolvedValue({
      kind: "unavailable",
      source: "wikipedia",
      canonicalUrl: "https://en.wikipedia.org/wiki/Missing",
      pageUrl: "https://en.wikipedia.org/wiki/Missing",
      title: null,
      reason: "missing",
    });

    render(<WikimediaCard href="https://en.wikipedia.org/wiki/Missing" />);

    await waitFor(() => {
      expect(screen.getByText("This page is unavailable.")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("link", { name: "Open on Wikipedia" })
    ).toHaveAttribute("href", "https://en.wikipedia.org/wiki/Missing");
  });

  it("renders error fallback", async () => {
    fetchWikimediaCard.mockRejectedValue(new Error("network"));

    render(<WikimediaCard href="https://en.wikipedia.org/wiki/Error" />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load preview")).toBeInTheDocument();
    });
  });
});

