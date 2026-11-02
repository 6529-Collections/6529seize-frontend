import { getAppleAppSiteAssociation } from "@/helpers/appleAppSiteAssociation";

// Built once; Apple's CDN fetches it at this exact path, without a redirect.
export const dynamic = "force-static";

// Next's static default (s-maxage of a year) would let shared caches,
// including Apple's associated-domains CDN, keep an edited file for a year.
const CACHE_CONTROL = "public, max-age=3600";

export function GET() {
  return Response.json(getAppleAppSiteAssociation(), {
    headers: { "Cache-Control": CACHE_CONTROL },
  });
}
