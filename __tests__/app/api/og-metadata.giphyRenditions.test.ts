import {
  getGiphyVideoRendition,
  isGiphyVideoRenditionUrl,
} from "@/app/api/og-metadata/_lib/giphyRenditions";

const SIGNED =
  "v1.Y2lkPTc5MGI3NjExMnB3cXJ6aWZ5OGZ1aDFmM3hjNDZ3NmNsdHdnYnY0d2Y1cmJ1NjRpdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw";
const DIRECTORY = `/media/${SIGNED}/88EhKlGzXuhBfStCds/`;

describe("getGiphyVideoRendition", () => {
  it.each([
    [
      `https://media1.giphy.com${DIRECTORY}giphy.gif`,
      `https://media1.giphy.com${DIRECTORY}giphy.mp4`,
      `https://media1.giphy.com${DIRECTORY}480w_s.jpg`,
    ],
    [
      "https://media.giphy.com/media/88EhKlGzXuhBfStCds/200w.gif",
      "https://media.giphy.com/media/88EhKlGzXuhBfStCds/200w.mp4",
      "https://media.giphy.com/media/88EhKlGzXuhBfStCds/480w_s.jpg",
    ],
    [
      "https://media4.giphy.com/media/abc123/200.gif?cid=790b7611&rid=200.gif&ct=g",
      "https://media4.giphy.com/media/abc123/200.mp4",
      "https://media4.giphy.com/media/abc123/480w_s.jpg",
    ],
    [
      "https://i.giphy.com/media/abc123/100w.gif#loop",
      "https://i.giphy.com/media/abc123/100w.mp4",
      "https://i.giphy.com/media/abc123/480w_s.jpg",
    ],
    [
      "https://MEDIA0.GIPHY.COM:443/media/abc123/giphy.gif",
      "https://media0.giphy.com/media/abc123/giphy.mp4",
      "https://media0.giphy.com/media/abc123/480w_s.jpg",
    ],
  ])("maps %s to its MP4 and still renditions", (src, videoUrl, stillUrl) => {
    expect(getGiphyVideoRendition(src)).toEqual({ videoUrl, stillUrl });
  });

  it.each([
    // Other hosts, including look-alikes and Giphy hosts outside the list.
    "https://example.com/media/abc123/giphy.gif",
    "https://media5.giphy.com/media/abc123/giphy.gif",
    "https://giphy.com/media/abc123/giphy.gif",
    "https://media1.giphy.com.evil.test/media/abc123/giphy.gif",
    "https://evilmedia1.giphy.com/media/abc123/giphy.gif",
    "https://media.tenor.com/abc123/tenor.gif",
    "https://d3lqz0a4bldqgf.cloudfront.net/drops/author/giphy.gif",
    // Transport, port and credentials.
    "http://media1.giphy.com/media/abc123/giphy.gif",
    "https://media1.giphy.com:8443/media/abc123/giphy.gif",
    "https://user:pass@media1.giphy.com/media/abc123/giphy.gif",
    // Renditions without an MP4 counterpart, and other paths.
    "https://media1.giphy.com/media/abc123/giphy_s.gif",
    "https://media1.giphy.com/media/abc123/200w_d.gif",
    "https://media1.giphy.com/media/abc123/giphy-downsized.gif",
    "https://media1.giphy.com/media/abc123/giphy.webp",
    "https://media1.giphy.com/media/abc123/giphy.mp4",
    "https://media1.giphy.com/media/abc123/GIPHY.GIF",
    "https://i.giphy.com/abc123.gif",
    "https://media1.giphy.com/abc123/giphy.gif",
    "https://media1.giphy.com/media/a/b/c/giphy.gif",
    "https://media1.giphy.com/media/v2.abc/abc123/giphy.gif",
    "https://media1.giphy.com/media/abc%2F123/giphy.gif",
    "not a url",
  ])("leaves %s on the existing path", (src) => {
    expect(getGiphyVideoRendition(src)).toBeNull();
  });
});

describe("isGiphyVideoRenditionUrl", () => {
  it.each([
    `https://media1.giphy.com${DIRECTORY}giphy.mp4`,
    "https://media.giphy.com/media/abc123/200w.mp4",
    "https://i.giphy.com/media/abc123/100.mp4",
  ])("accepts the MP4 rendition %s", (value) => {
    expect(isGiphyVideoRenditionUrl(new URL(value))).toBe(true);
  });

  it.each([
    "https://media1.giphy.com/media/abc123/giphy.gif",
    "https://media1.giphy.com/media/abc123/giphy.mp4?cid=1",
    "https://media1.giphy.com/media/abc123/giphy.mp4#t=1",
    "https://media1.giphy.com/media/abc123/giphy-preview.mp4",
    "https://media1.giphy.com/media/abc123/giphy.mp4/extra",
    "https://media1.giphy.com/other/abc123/giphy.mp4",
    "https://cdn.test/media/abc123/giphy.mp4",
    "http://media1.giphy.com/media/abc123/giphy.mp4",
  ])("refuses %s", (value) => {
    expect(isGiphyVideoRenditionUrl(new URL(value))).toBe(false);
  });
});
