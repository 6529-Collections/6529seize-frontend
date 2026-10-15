import { getAppleAppSiteAssociation } from "@/helpers/appleAppSiteAssociation";

// Built once; Apple's CDN fetches it at this exact path, without a redirect.
export const dynamic = "force-static";

export function GET() {
  return Response.json(getAppleAppSiteAssociation());
}
