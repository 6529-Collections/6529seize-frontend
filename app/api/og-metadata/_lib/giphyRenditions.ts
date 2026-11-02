// Giphy serves each GIF beside smaller MP4 and still renditions in the same
// media directory. Only exact Giphy media hosts and rendition names that have
// an MP4 counterpart qualify; everything else keeps the existing GIF path.
export const GIPHY_MEDIA_HOSTS: readonly string[] = [
  "media.giphy.com",
  "media0.giphy.com",
  "media1.giphy.com",
  "media2.giphy.com",
  "media3.giphy.com",
  "media4.giphy.com",
  "i.giphy.com",
];

// Path: /media/[v1.<signed id>/]<gif id>/<rendition>.<extension>, where the
// rendition is giphy (original), 200w (fixed width), 200 (fixed height), ...
const GIPHY_SIGNED_ID = /^v1\.[\w=-]{1,512}$/;
const GIPHY_MEDIA_ID = /^[A-Za-z\d]{1,64}$/;
const GIPHY_VIDEO_RENDITION_FILE = /^(giphy|\d{2,4}w?)\.(gif|mp4)$/;
// Giphy's 480w still (a JPEG of the first frame) exists for every GIF.
const GIPHY_STILL_RENDITION = "480w_s.jpg";

const parseRenditionPath = (
  pathname: string
): {
  readonly directory: string;
  readonly rendition: string;
  readonly extension: string;
} | null => {
  const [root, media, ...rest] = pathname.split("/");
  const file = rest.pop();
  const mediaId = rest.pop();
  const signedId = rest.pop();
  const match = file ? GIPHY_VIDEO_RENDITION_FILE.exec(file) : null;
  if (
    root !== "" ||
    media !== "media" ||
    rest.length > 0 ||
    !mediaId ||
    !GIPHY_MEDIA_ID.test(mediaId) ||
    (signedId !== undefined && !GIPHY_SIGNED_ID.test(signedId)) ||
    !file ||
    !match?.[1] ||
    !match[2]
  ) {
    return null;
  }
  return {
    directory: pathname.slice(0, pathname.length - file.length),
    rendition: match[1],
    extension: match[2],
  };
};

const parseGiphyMediaUrl = (value: string): URL | null => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  // The URL parser lowercases the host and drops the default port.
  return url.protocol === "https:" &&
    url.port === "" &&
    url.username === "" &&
    url.password === "" &&
    GIPHY_MEDIA_HOSTS.includes(url.hostname)
    ? url
    : null;
};

/**
 * Maps a Giphy GIF rendition to its MP4 rendition and still frame. Giphy's
 * tracking query (cid, rid, ct) is dropped so every viewer shares one cached
 * rendition. Returns null for every other URL.
 */
export function getGiphyVideoRendition(
  src: string
): { readonly videoUrl: string; readonly stillUrl: string } | null {
  const url = parseGiphyMediaUrl(src);
  const path = url ? parseRenditionPath(url.pathname) : null;
  if (!url || path?.extension !== "gif") {
    return null;
  }
  return {
    videoUrl: `${url.origin}${path.directory}${path.rendition}.mp4`,
    stillUrl: `${url.origin}${path.directory}${GIPHY_STILL_RENDITION}`,
  };
}

/** The proxy's pass-through accepts exactly one shape: a Giphy MP4 rendition. */
export function isGiphyVideoRenditionUrl(url: URL): boolean {
  return (
    parseGiphyMediaUrl(url.href) !== null &&
    url.search === "" &&
    url.hash === "" &&
    parseRenditionPath(url.pathname)?.extension === "mp4"
  );
}
