import { serveDesktopReleaseObject } from "@/lib/desktop-releases/releaseList";

// Public: the signature over releases.json, served byte for byte.
export function GET(request: Request): Promise<Response> {
  return serveDesktopReleaseObject(request, "signature");
}
