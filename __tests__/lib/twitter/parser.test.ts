import { parseTwitterOEmbed } from "@/lib/twitter/parser";
import { extractTweetId, parseTweetUrl } from "@/lib/twitter/url";

describe("Twitter preview parsing", () => {
  it("extracts status IDs from X and Twitter URLs", () => {
    expect(
      extractTweetId("https://x.com/Mayudropsphotos/status/2057513333985554492")
    ).toBe("2057513333985554492");
    expect(extractTweetId("https://twitter.com/i/web/status/9876543210")).toBe(
      "9876543210"
    );
    expect(parseTweetUrl("https://example.com/status/123")).toBeUndefined();
  });

  it("parses normalized metadata from Twitter oEmbed HTML", () => {
    const preview = parseTwitterOEmbed(
      {
        url: "https://twitter.com/Mayudropsphotos/status/2057513333985554492",
        author_name: "Mayudrops",
        author_url: "https://twitter.com/Mayudropsphotos",
        html: `<blockquote class="twitter-tweet">
          <p lang="en" dir="ltr">
            Among tiny gears and fading ticks, he holds time in his hands.
            <br><br>
            "Watch Repairer"
            <a href="https://t.co/media">pic.twitter.com/abc123</a>
          </p>
          &mdash; Mayudrops (@Mayudropsphotos)
          <a href="https://twitter.com/Mayudropsphotos/status/2057513333985554492?ref_src=twsrc%5Etfw">May 21, 2026</a>
        </blockquote>`,
      },
      "https://x.com/Mayudropsphotos/status/2057513333985554492",
      "2057513333985554492"
    );

    expect(preview).toEqual({
      tweetId: "2057513333985554492",
      url: "https://twitter.com/Mayudropsphotos/status/2057513333985554492?ref_src=twsrc%5Etfw",
      authorName: "Mayudrops",
      authorUrl: "https://twitter.com/Mayudropsphotos",
      authorHandle: "Mayudropsphotos",
      text: `Among tiny gears and fading ticks, he holds time in his hands.

"Watch Repairer"`,
      mediaLink: "https://t.co/media",
      createdAtText: "May 21, 2026",
    });
  });
});
