import { serveAiFeedObject } from "@/lib/ai-page/feedResponse";

// Public: the signature over releases.json, served byte for byte.
export function GET(request: Request): Promise<Response> {
  return serveAiFeedObject(request, "signature");
}
