import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import PublicWaveDrop from "@/components/waves/PublicWaveDrop";
import type { PublicWaveDrop as PublicWaveDropData } from "@/app/waves/public-wave-drop.server";

const drop: PublicWaveDropData = {
  id: "selected",
  waveId: "wave",
  waveName: "Public Wave",
  author: "artist",
  title: "Selected artwork",
  serialNo: 42,
  publishedAt: "2025-06-15T15:06:40.000Z",
  href: "/waves/wave?drop=selected",
  hasMoreParts: false,
  parts: [
    {
      partNo: 1,
      text: "The specific post, not the latest feed.",
      media: [
        { url: "https://example.com/art.png", mimeType: "image/png" },
        { url: "https://example.com/movie.mp4", mimeType: "video/mp4" },
      ],
    },
  ],
};

it("puts selected content, attribution, publication date and media in server HTML", () => {
  const html = renderToStaticMarkup(<PublicWaveDrop drop={drop} />);
  expect(html).toContain(drop.parts[0]?.text);
  expect(html).toContain("artist");
  expect(html).toContain('dateTime="2025-06-15T15:06:40.000Z"');
  expect(html).toContain("Jun 15, 2025");
  expect(html).toContain("https://example.com/art.png");
  expect(html).toContain("https://example.com/movie.mp4");
  const other = renderToStaticMarkup(
    <PublicWaveDrop
      drop={{
        ...drop,
        id: "other",
        parts: [{ partNo: 1, text: "Different selected post", media: [] }],
      }}
    />
  );
  expect(other).toContain("Different selected post");
  expect(other).not.toContain(drop.parts[0]?.text);
});

it("exposes accessible post and media links and a bounded-storm notice", () => {
  render(<PublicWaveDrop drop={{ ...drop, title: "", hasMoreParts: true }} />);
  expect(
    screen.getByRole("region", { name: "Public Wave" })
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Drop #42" })).toHaveAttribute(
    "href",
    drop.href
  );
  expect(
    screen.getByRole("img", { name: "Drop #42 — image 1" })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Open attachment 2 (video/mp4)" })
  ).toHaveAttribute("rel", "ugc nofollow noreferrer");
  expect(
    screen.getByText("Connect your wallet to read the rest of this storm.")
  ).toBeInTheDocument();
});

it("escapes authored content instead of injecting markup", () => {
  const html = renderToStaticMarkup(
    <PublicWaveDrop
      drop={{
        ...drop,
        parts: [{ partNo: 1, text: '<script>alert("x")</script>', media: [] }],
      }}
    />
  );
  expect(html).not.toContain("<script>");
  expect(html).toContain("&lt;script&gt;");
});
