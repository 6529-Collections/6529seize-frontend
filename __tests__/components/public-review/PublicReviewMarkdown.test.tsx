import { render, screen } from "@testing-library/react";

import { PublicReviewMarkdown } from "@/components/public-review/PublicReviewMarkdown";

describe("PublicReviewMarkdown", () => {
  it("assigns anchors only to unique level-two review sections", () => {
    const { container } = render(
      <PublicReviewMarkdown
        markdown={`
# Hidden content title
## First section
### IMPLEMENTED
## Second section
### IMPLEMENTED
`}
      />
    );

    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "First section" })).toHaveAttribute(
      "id",
      "first-section"
    );
    expect(
      screen.getByRole("heading", { name: "Second section" })
    ).toHaveAttribute("id", "second-section");
    expect(container.querySelectorAll("h3")).toHaveLength(2);
    expect(container.querySelectorAll("h3[id]")).toHaveLength(0);
  });

  it("removes raw HTML and unsafe link protocols", () => {
    const { container } = render(
      <PublicReviewMarkdown
        markdown={`
## Safety

[safe](https://example.com/source)

[unsafe](javascript:alert('x'))

<script>window.__unsafe = true</script>

<img src=x onerror="window.__unsafe = true">
`}
      />
    );

    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain("javascript:");
    expect(container.innerHTML).not.toContain("onerror");
    expect(screen.getByRole("link", { name: /safe/i })).toHaveAttribute(
      "href",
      "https://example.com/source"
    );
  });
});
