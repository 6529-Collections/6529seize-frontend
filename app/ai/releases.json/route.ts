import { serveAiFeedObject } from "@/lib/ai-page/feedResponse";

// Public: 6529 AI's signed release feed, byte for byte. It holds only
// versions, hashes and notes.
export function GET(request: Request): Promise<Response> {
  return serveAiFeedObject(request, "feed");
}
