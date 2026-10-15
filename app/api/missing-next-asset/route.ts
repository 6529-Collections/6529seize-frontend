import { plainNotFoundResponse } from "@/lib/proxy/plainResponses";

// Rewrite target for missing `/_next/*` files; real files never reach it.
export function GET(): Response {
  return plainNotFoundResponse();
}
