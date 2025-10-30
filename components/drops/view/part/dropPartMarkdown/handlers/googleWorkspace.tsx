import GoogleWorkspacePreview from "@/components/waves/GoogleWorkspacePreview";

import type { LinkHandler } from "../linkTypes";

const GOOGLE_RESOURCES = new Set(["document", "spreadsheets", "presentation"]);

const isGoogleWorkspaceLink = (href: string): boolean => {
  try {
    const url = new URL(href);
    const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (hostname !== "docs.google.com") {
      return false;
    }

    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length < 3) {
      return false;
    }

    const [resource, marker] = segments;
    return GOOGLE_RESOURCES.has(resource.toLowerCase()) && marker.toLowerCase() === "d";
  } catch {
    return false;
  }
};

export const createGoogleWorkspaceHandler = (): LinkHandler => ({
  match: isGoogleWorkspaceLink,
  render: (href) => <GoogleWorkspacePreview href={href} />,
  display: "block",
});
