import { render, screen } from "@testing-library/react";

import PublicWaveFeed from "@/components/waves/PublicWaveFeed";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: React.ComponentProps<"a">) => (
    <a href={href}>{children}</a>
  ),
}));

describe("PublicWaveFeed", () => {
  it("renders semantic public content and native deep-item links", () => {
    const { container } = render(
      <PublicWaveFeed
        feed={{
          ok: true,
          waveId: "wave-1",
          waveName: "Public Wave",
          hasMore: true,
          items: [
            {
              id: "drop-1",
              serialNo: 42,
              createdAt: 1_750_000_000_000,
              authorLabel: "artist",
              title: "A public thought",
              excerpt: "Useful public content.",
              href: "/waves/wave-1?drop=drop-1",
            },
          ],
        }}
      />
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Public Wave" })
    ).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveTextContent(
      "artistA public thoughtUseful public content."
    );
    expect(
      screen.getByRole("link", { name: "A public thought" })
    ).toHaveAttribute("href", "/waves/wave-1?drop=drop-1");
    expect(container.querySelector("a[href*='?drop=']")).not.toBeNull();
  });

  it("does not add an empty fallback surface", () => {
    const { container } = render(
      <PublicWaveFeed
        feed={{
          ok: true,
          waveId: "wave-1",
          waveName: "Public Wave",
          hasMore: false,
          items: [],
        }}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
