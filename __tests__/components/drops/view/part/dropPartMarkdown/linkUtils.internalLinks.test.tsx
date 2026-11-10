import { fireEvent, render, screen } from "@testing-library/react";
import type { MouseEvent } from "react";

import { renderExternalOrInternalLink } from "@/components/drops/view/part/dropPartMarkdown/linkUtils";

const renderLink = (
  href: string,
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
) =>
  render(
    renderExternalOrInternalLink(href, {
      href,
      children: "link",
      onClick,
    })
  );

describe("renderExternalOrInternalLink", () => {
  it.each([
    ["https://test.6529.io/waves/123", "/waves/123"],
    [
      "https://test.6529.io/waves/123?drop=456#part-2",
      "/waves/123?drop=456#part-2",
    ],
    ["https://test.6529.io", "/"],
  ])("renders %s as a same-tab link to %s", (href, expected) => {
    renderLink(href);

    const link = screen.getByRole("link", { name: "link" });
    expect(link).toHaveAttribute("href", expected);
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });

  it.each([
    "https://test.6529.io//other.example/path",
    "https://test.6529.io/\\other.example/path",
    "https://test.6529.io.other.example/path",
    "https://test.6529.io@other.example/path",
    "https://other.example/path",
  ])("renders %s as an external link", (href) => {
    renderLink(href);

    const link = screen.getByRole("link", { name: "link" });
    expect(link).toHaveAttribute("href", href);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer nofollow");
  });

  it("keeps the caller's click handler", () => {
    const onClick = jest.fn((event: MouseEvent<HTMLAnchorElement>) =>
      event.preventDefault()
    );
    renderLink("https://test.6529.io/waves/123", onClick);

    fireEvent.click(screen.getByRole("link", { name: "link" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
