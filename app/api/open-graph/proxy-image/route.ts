import { NextRequest, NextResponse } from "next/server";

const IMAGE_PROXY_TIMEOUT_MS = 5000;
const ALLOWED_SUFFIXES = ["sinaimg.cn"];
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function isAllowedHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return ALLOWED_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");

  if (!target) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let remoteUrl: URL;
  try {
    remoteUrl = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid image url" }, { status: 400 });
  }

  if (!isAllowedHost(remoteUrl.hostname)) {
    return NextResponse.json({ error: "Unsupported image host" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_PROXY_TIMEOUT_MS);

  try {
    const response = await fetch(remoteUrl.toString(), {
      headers: {
        "user-agent": USER_AGENT,
        accept: "image/avif,image/webp,image/png,image/jpeg;q=0.8,*/*;q=0.5",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    if (!response.ok || !response.body) {
      return NextResponse.json(
        { error: `Failed to fetch image (${response.status})` },
        { status: 502 }
      );
    }

    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) {
      headers.set("content-type", contentType);
    }
    headers.set("Cache-Control", "public, max-age=86400");

    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json({ error: "Upstream timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to proxy image" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
