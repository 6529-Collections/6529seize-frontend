import { matchesDomainOrSubdomain } from "@/lib/url/domains";

interface YoutubeLinkInfo {
  readonly videoId: string;
  readonly url: string;
}

export const parseYoutubeLink = (href: string): YoutubeLinkInfo | null => {
  try {
    const url = new URL(href);
    const normalizedHost = url.hostname.replace(/^www\./i, "").toLowerCase();
    const youtubeDomains = ["youtube.com", "youtube-nocookie.com"];
    const isYoutubeDomain = youtubeDomains.some((domain) =>
      matchesDomainOrSubdomain(normalizedHost, domain)
    );

    let videoId: string | null = null;

    if (normalizedHost === "youtu.be") {
      const pathSegments = url.pathname.split("/").filter(Boolean);
      videoId = pathSegments[0] ?? null;
    } else if (isYoutubeDomain) {
      const pathSegments = url.pathname.split("/").filter(Boolean);

      if (url.pathname === "/watch" || url.pathname === "/watch/") {
        videoId = url.searchParams.get("v");
      } else if (pathSegments[0] === "shorts") {
        videoId = pathSegments[1] ?? null;
      } else if (pathSegments[0] === "embed") {
        videoId = pathSegments[1] ?? null;
      } else if (pathSegments[0] === "live") {
        videoId = pathSegments[1] ?? null;
      } else if (pathSegments[0] === "v") {
        videoId = pathSegments[1] ?? null;
      }
    }

    if (!videoId) {
      return null;
    }

    const trimmed = videoId.trim();
    if (!trimmed.match(/^[A-Za-z0-9_-]{6,}$/)) {
      return null;
    }

    return { videoId: trimmed, url: href };
  } catch {
    return null;
  }
};

export const getYoutubeFetchUrl = (href: string, videoId: string): string => {
  try {
    const url = new URL(href);
    const canonical = new URL(`https://www.youtube.com/watch?v=${videoId}`);
    const preservedParams = ["list", "index"] as const;

    preservedParams.forEach((param) => {
      const value = url.searchParams.get(param);
      if (value) {
        canonical.searchParams.set(param, value);
      }
    });

    return canonical.toString();
  } catch {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
};
