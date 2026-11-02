import { serveFeedObject } from "@/lib/validator-page/feedResponse";

// Public: the signature over releases.json, served byte for byte.
export function GET(request: Request): Promise<Response> {
  return serveFeedObject(request, "signature");
}
