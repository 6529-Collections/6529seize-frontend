import { serveDesktopReleaseObject } from "@/lib/desktop-releases/releaseList";

// Public: 6529 Desktop fetches its signed release list here to find updates.
// 404 until the first list is published.
export function GET(request: Request): Promise<Response> {
  return serveDesktopReleaseObject(request, "feed");
}
