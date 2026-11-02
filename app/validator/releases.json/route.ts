import { serveFeedObject } from "@/lib/validator-page/feedResponse";

// Public: validators fetch the signed feed to find updates. It holds only
// versions, hashes and notes.
export function GET(request: Request): Promise<Response> {
  return serveFeedObject(request, "feed");
}
