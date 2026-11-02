import {
  VERSION_RELOAD_IMAGE_SRC,
  VERSION_UPDATE_ROCKET_IMAGE_SRC,
} from "../components/version-update/versionReloadImage";

const IMMUTABLE_HEADERS = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];

// The version-update artwork is public files whose names carry a content hash
// (scripts/generate-version-reload-image.cjs). Next serves public files with
// max-age=0, so mark them immutable: the incoming document after a deploy
// then paints the cover rocket from cache without a revalidation request.
export const versionReloadImageHeaders = {
  source: VERSION_RELOAD_IMAGE_SRC,
  headers: IMMUTABLE_HEADERS,
};

export const versionUpdateRocketImageHeaders = {
  source: VERSION_UPDATE_ROCKET_IMAGE_SRC,
  headers: IMMUTABLE_HEADERS,
};
