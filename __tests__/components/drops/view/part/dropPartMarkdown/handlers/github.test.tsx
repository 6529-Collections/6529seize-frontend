import { render, screen } from "@testing-library/react";
import React from "react";

import { createLinkHandlers } from "@/components/drops/view/part/dropPartMarkdown/handlers";

jest.mock("@/components/waves/github/GithubLinkPreview", () => {
  const actual = jest.requireActual(
    "@/components/waves/github/GithubLinkPreview"
  );

  return {
    __esModule: true,
    ...actual,
    default: ({ href }: { readonly href: string }) => (
      <div data-testid="github-link-preview" data-href={href} />
    ),
  };
});

describe("GitHub markdown link handler", () => {
  it("renders GitHub pull requests before generic OpenGraph fallback", () => {
    const href = "https://github.com/6529-Collections/6529Stream/pull/355";
    const handler = createLinkHandlers().find((candidate) =>
      candidate.match(href)
    );

    expect(handler).toBeDefined();
    expect(handler?.display).toBe("block");

    render(<>{handler?.render(href)}</>);

    expect(screen.getByTestId("github-link-preview")).toHaveAttribute(
      "data-href",
      href
    );
  });

  it("matches repository links too", () => {
    const href = "https://github.com/6529-Collections/6529Stream";
    const handler = createLinkHandlers().find((candidate) =>
      candidate.match(href)
    );

    expect(handler).toBeDefined();
    expect(handler?.display).toBe("block");
  });
});
