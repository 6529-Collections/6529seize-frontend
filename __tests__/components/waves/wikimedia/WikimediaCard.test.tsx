import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import WikimediaCard from "@/components/waves/wikimedia/WikimediaCard";

describe("WikimediaCard", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders article preview", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        kind: "article",
        source: "wikipedia",
        canonicalUrl: "https://en.wikipedia.org/wiki/Alan_Turing",
        originalUrl: "https://en.wikipedia.org/wiki/Alan_Turing",
        lang: "en",
        title: "Alan Turing",
        description: "English mathematician",
        extract: "Alan Turing was an English mathematician and logician.",
        thumbnail: null,
        coordinates: null,
        section: null,
        lastModified: null,
      }),
    });

    render(<WikimediaCard href="https://en.wikipedia.org/wiki/Alan_Turing" />);

    await waitFor(() => {
      expect(screen.getByText("Alan Turing")).toBeInTheDocument();
    });

    expect(screen.getByText("Open on Wikipedia")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/wikimedia/resolve?url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FAlan_Turing",
      expect.any(Object)
    );
  });

  it("renders error fallback when request fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network"));

    render(<WikimediaCard href="https://en.wikipedia.org/wiki/Ada_Lovelace" />);

    await waitFor(() => {
      expect(screen.getByText("Open link")).toBeInTheDocument();
    });
  });
});
