import { VERSION_RELOAD_IMAGE_SRC } from "../components/version-update/versionReloadImage";

// The reload cover artwork is a public file whose name carries a content hash
// (scripts/generate-version-reload-image.cjs). Next serves public files with
// max-age=0, so mark this one immutable: the incoming document after a deploy
// then paints the cover rocket from cache without a revalidation request.
export const versionReloadImageHeaders = {
  source: VERSION_RELOAD_IMAGE_SRC,
  headers: [
    { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
  ],
};
