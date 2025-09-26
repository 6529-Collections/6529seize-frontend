import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import TikTokCard from "../../../components/waves/TikTokCard";

jest.mock("../../../services/api/tiktok-preview", () => ({
  fetchTikTokPreview: jest.fn(),
  getCachedTikTokPreview: jest.fn(),
}));

describe("TikTokCard", () => {
  const { fetchTikTokPreview, getCachedTikTokPreview } = require("../../../services/api/tiktok-preview");

  const successResponse = {
    kind: "video" as const,
    canonicalUrl: "https://www.tiktok.com/@creator/video/1",
    authorName: "Creator",
    authorUrl: "https://www.tiktok.com/@creator",
    title: "This is a TikTok caption",
    thumbnailUrl: "https://cdn.example.com/thumb.jpg",
    thumbnailWidth: 720,
    thumbnailHeight: 1280,
    providerName: "TikTok",
    providerUrl: "https://www.tiktok.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a TikTok preview when data is fetched", async () => {
    getCachedTikTokPreview.mockReturnValue(null);
    fetchTikTokPreview.mockResolvedValue(successResponse);

    render(<TikTokCard href="https://www.tiktok.com/@creator/video/1" />);

    expect(screen.getByTestId("tiktok-card-skeleton")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("tiktok-card")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Open this TikTok on TikTok" })).toHaveAttribute(
      "href",
      "https://www.tiktok.com/@creator/video/1"
    );
    expect(screen.getByText("Creator")).toBeInTheDocument();
  });

  it("toggles long captions with Show more", async () => {
    const longCaption = "😀".repeat(10) + " This is a very long caption that should exceed the preview limit. ".repeat(5);
    getCachedTikTokPreview.mockReturnValue(null);
    fetchTikTokPreview.mockResolvedValue({
      ...successResponse,
      title: longCaption,
    });

    render(<TikTokCard href="https://www.tiktok.com/@creator/video/1" />);

    await waitFor(() => {
      expect(screen.getByTestId("tiktok-card")).toBeInTheDocument();
    });

    const caption = screen.getByText((content) => content.includes("This is a very long caption"));
    expect(caption.textContent).toMatch(/…$/);

    const toggle = screen.getByRole("button", { name: "Show more" });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(caption.textContent).toContain("This is a very long caption");
  });

  it("uses cached data when fresh and skips fetching", async () => {
    getCachedTikTokPreview.mockReturnValue({ data: successResponse, isFresh: true });

    render(<TikTokCard href="https://www.tiktok.com/@creator/video/1" />);

    await waitFor(() => {
      expect(screen.getByTestId("tiktok-card")).toBeInTheDocument();
    });

    expect(fetchTikTokPreview).not.toHaveBeenCalled();
  });

  it("revalidates cached data when stale", async () => {
    getCachedTikTokPreview.mockReturnValue({ data: { ...successResponse, title: "Old caption" }, isFresh: false });
    fetchTikTokPreview.mockResolvedValue({ ...successResponse, title: "Updated caption" });

    render(<TikTokCard href="https://www.tiktok.com/@creator/video/1" />);

    await waitFor(() => {
      expect(fetchTikTokPreview).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText("Updated caption")).toBeInTheDocument();
    });
  });

  it("renders unavailable state when TikTok is private", async () => {
    getCachedTikTokPreview.mockReturnValue(null);
    fetchTikTokPreview.mockResolvedValue({
      error: "unavailable",
      canonicalUrl: "https://www.tiktok.com/@creator/video/1",
    });

    render(<TikTokCard href="https://www.tiktok.com/@creator/video/1" />);

    await waitFor(() => {
      expect(screen.getByTestId("tiktok-card-unavailable")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Open this TikTok on TikTok" })).toHaveAttribute(
      "href",
      "https://www.tiktok.com/@creator/video/1"
    );
  });

  it("renders unavailable state when fetching fails", async () => {
    getCachedTikTokPreview.mockReturnValue(null);
    fetchTikTokPreview.mockRejectedValue(new Error("network error"));

    render(<TikTokCard href="https://www.tiktok.com/@creator/video/1" />);

    await waitFor(() => {
      expect(screen.getByTestId("tiktok-card-unavailable")).toBeInTheDocument();
    });
  });
});
