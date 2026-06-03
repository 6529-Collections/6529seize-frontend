import { ARWEAVE_FALLBACK_HOSTS } from "@/lib/media/arweave-gateways";
import {
  fetchPublicUrl,
  parsePublicUrl,
  UrlGuardError,
  type FetchPublicUrlOptions,
} from "@/lib/security/urlGuard";
import {
  detectContentType,
  optimizeImage,
} from "next/dist/server/image-optimizer";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const revalidate = 604800;

const DEFAULT_WIDTH = 1200;
const MAX_WIDTH = 1200;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const PNG_CONTENT_TYPE = "image/png";
const CACHE_CONTROL =
  "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=2592000";
const IMAGE_ACCEPT_HEADER =
  "image/png,image/jpeg,image/gif,image/webp,image/svg+xml,*/*;q=0.5";
const USER_AGENT =
  "Mozilla/5.0 (compatible; 6529-og-image/1.0; +https://6529.io)";
const ALLOWED_HOST_SUFFIXES = [
  "6529.io",
  "staging.6529.io",
  "media.generator.seize.io",
  "d3lqz0a4bldqgf.cloudfront.net",
  "dnclu2fna0b2b.cloudfront.net",
  "img.youtube.com",
  "i.seadn.io",
  "i2.seadn.io",
  "i2c.seadn.io",
  "i.ytimg.com",
  "res.cloudinary.com",
  "ipfs.6529.io",
  "ipfs.io",
  "ar.io",
  ...ARWEAVE_FALLBACK_HOSTS,
] as const;

const FETCH_OPTIONS: FetchPublicUrlOptions = {
  policy: {
    allowedHostSuffixes: ALLOWED_HOST_SUFFIXES,
  },
  timeoutMs: 7000,
  userAgent: USER_AGENT,
};

const parseWidth = (value: string | null): number => {
  if (!value) {
    return DEFAULT_WIDTH;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_WIDTH;
  }

  return Math.min(parsed, MAX_WIDTH);
};

const ensureDefaultHttpsPort = (url: URL): void => {
  if (url.protocol !== "https:") {
    throw new UrlGuardError(
      "Only HTTPS image URLs are supported.",
      "unsupported-protocol"
    );
  }

  if (url.port && url.port !== "443") {
    throw new UrlGuardError(
      "Only default HTTPS image ports are supported.",
      "host-not-allowed"
    );
  }
};

const jsonError = (error: string, status: number): NextResponse =>
  NextResponse.json({ error }, { status });

const getContentLength = (response: Response): number | null => {
  const contentLength = response.headers.get("content-length");
  if (!contentLength) {
    return null;
  }

  const parsed = Number.parseInt(contentLength, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const ensureAllowedImageSize = (byteLength: number): void => {
  if (byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image response exceeded maximum size.");
  }
};

const mapErrorToResponse = (error: unknown): NextResponse => {
  if (error instanceof UrlGuardError) {
    switch (error.kind) {
      case "missing-url":
      case "invalid-url":
      case "unsupported-protocol":
        return jsonError("Invalid image url", 400);
      case "host-not-allowed":
      case "dns-lookup-failed":
      case "ip-not-allowed":
        return jsonError("Unsupported image host", 400);
      case "timeout":
        return jsonError("Upstream timeout", 504);
      default:
        return jsonError("Failed to fetch image", 502);
    }
  }

  return jsonError("Failed to normalize image", 502);
};

const readImageResponseBuffer = async (response: Response): Promise<Buffer> => {
  if (!response.body) {
    throw new Error("Image response did not include a readable body.");
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunk = Buffer.from(value);
      totalBytes += chunk.byteLength;
      if (totalBytes > MAX_IMAGE_BYTES) {
        await reader.cancel("Image response exceeded maximum size.");
        ensureAllowedImageSize(totalBytes);
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, totalBytes);
};

const fetchImageBuffer = async (url: URL): Promise<Buffer> => {
  const response = await fetchPublicUrl(
    url,
    {
      headers: {
        accept: IMAGE_ACCEPT_HEADER,
      },
    },
    FETCH_OPTIONS
  );

  if (!response.ok) {
    throw new Error(`Image request failed: ${response.status}`);
  }

  const contentLength = getContentLength(response);
  if (contentLength !== null) {
    ensureAllowedImageSize(contentLength);
  }

  return readImageResponseBuffer(response);
};

const normalizeImageToPng = async ({
  buffer,
  width,
}: {
  readonly buffer: Buffer;
  readonly width: number;
}): Promise<Buffer> => {
  const detectedContentType = await detectContentType(buffer, false);
  if (!detectedContentType?.startsWith("image/")) {
    throw new Error("Upstream response is not an image.");
  }

  return optimizeImage({
    buffer,
    contentType: PNG_CONTENT_TYPE,
    quality: 100,
    width,
  });
};

const parseImageUrl = (value: string | null): URL => {
  const parsed = parsePublicUrl(value, { allowedProtocols: ["https:"] });
  ensureDefaultHttpsPort(parsed);
  return parsed;
};

export async function GET(request: NextRequest) {
  try {
    const imageUrl = parseImageUrl(request.nextUrl.searchParams.get("url"));
    const width = parseWidth(request.nextUrl.searchParams.get("w"));
    const buffer = await fetchImageBuffer(imageUrl);
    const png = await normalizeImageToPng({ buffer, width });

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "Content-Type": PNG_CONTENT_TYPE,
      },
    });
  } catch (error) {
    console.error("Unable to normalize OG metadata image.", error);
    return mapErrorToResponse(error);
  }
}
