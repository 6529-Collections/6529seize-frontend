import { render, screen } from "@testing-library/react";
import React from "react";

import FacebookPreview from "../../../components/waves/FacebookPreview";
import type { FacebookLinkPreviewResponse } from "../../../services/api/link-preview-api";

const createPostPreview = (): FacebookLinkPreviewResponse => ({
  type: "facebook.post",
  canonicalUrl: "https://facebook.com/Page/posts/1",
  requestUrl: "https://facebook.com/Page/posts/1",
  url: "https://facebook.com/Page/posts/1",
  title: "Page",
  description: "Hello",
  siteName: "Page",
  mediaType: null,
  contentType: "text/html",
  favicon: null,
  favicons: null,
  image: null,
  images: null,
  post: {
    page: "Page",
    postId: "1",
    authorName: "Page",
    authorUrl: "https://facebook.com/Page",
    createdAt: null,
    text: "Hello",
    images: [{ url: "https://cdn.facebook.com/img.jpg", alt: "Image from Facebook post" }],
  },
});

describe("FacebookPreview", () => {
  it("renders a facebook post preview", () => {
    render(<FacebookPreview href="https://facebook.com/Page/posts/1" preview={createPostPreview()} />);

    expect(screen.getByText("Page")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open this Facebook post" })).toHaveAttribute(
      "href",
      "https://facebook.com/Page/posts/1"
    );
  });

  it("renders unavailable state", () => {
    const unavailable: FacebookLinkPreviewResponse = {
      type: "facebook.unavailable",
      canonicalUrl: "https://facebook.com/Page/posts/1",
      reason: "login_required",
      requestUrl: "https://facebook.com/Page/posts/1",
      url: "https://facebook.com/Page/posts/1",
      title: null,
      description: null,
      siteName: null,
      mediaType: null,
      contentType: "text/html",
      favicon: null,
      favicons: null,
      image: null,
      images: null,
    };

    render(<FacebookPreview href="https://facebook.com/Page/posts/1" preview={unavailable} />);

    expect(screen.getByText(/preview unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open this Facebook link" })).toHaveAttribute(
      "href",
      "https://facebook.com/Page/posts/1"
    );
  });
});
