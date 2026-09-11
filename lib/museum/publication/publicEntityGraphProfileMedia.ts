import {
  OPTIONAL_MEDIA_AFFORDANCES,
  REQUIRED_MEDIA_AFFORDANCES,
} from "./publicEntityGraphSchema";
import {
  assertMediaSourcePath,
  isRecord,
  optionalString,
  requiredObject,
  requiredString,
  stringArray,
} from "./publicEntityGraphPrimitives";
import { assertApprovedArtBlocksMediaUrl } from "./security";
import {
  isMuseumExternalProposalMediaUrl,
  isMuseumExternalProposalTokenSourceUrl,
} from "./entities";

const SUPPORTED_MEDIA_ROLES = new Set([
  "museum_retained_preservation_object",
  "token_linked_source_media",
  "museum_generated_public_derivative",
  "museum_authored_public_graphic",
  "historical_wave_proposal_presentation",
]);

export function validateMediaProfile(media: Record<string, unknown>): void {
  const role = requiredString(
    media,
    "media_role",
    "public_entity_graph_media_role"
  );
  if (!SUPPORTED_MEDIA_ROLES.has(role)) {
    throw new Error("public_entity_graph_media_role");
  }
  const locator = requiredObject(
    media,
    "source_locator",
    "public_entity_graph_media_locator"
  );
  const uri = optionalString(locator, "uri", "public_entity_graph_media_uri");
  const repositoryPath = optionalString(
    locator,
    "repository_path",
    "public_entity_graph_media_path"
  );
  const affordances = stringArray(
    media,
    "allowed_ui_affordances",
    "public_entity_graph_media_affordances",
    false
  );
  const visual = media["visual"] === true;
  const metadataOnly = !(visual && hasDirectVisualAffordance(affordances));
  assertMediaLocator(uri, repositoryPath, metadataOnly, role);
  const mediaType = requiredString(
    media,
    "media_type",
    "public_entity_graph_media_type"
  );
  if (!isSafeMediaType(mediaType)) {
    throw new Error("public_entity_graph_media_type");
  }
  assertMediaVisual(media, metadataOnly);
  assertMediaIdentity(media);
  const rights = requiredObject(
    media,
    "rights",
    "public_entity_graph_media_rights"
  );
  requiredString(rights, "status", "public_entity_graph_media_rights_status");
  const observation = requiredObject(
    media,
    "source_observation",
    "public_entity_graph_media_observation"
  );
  requiredString(
    observation,
    "status",
    "public_entity_graph_media_observation_status"
  );
  if (role === "historical_wave_proposal_presentation") {
    validateWaveProposalMediaProfile(uri, affordances, media, rights);
  }
}

function assertMediaLocator(
  uri: string | null,
  repositoryPath: string | null,
  metadataOnly: boolean,
  role: string
): void {
  if (uri === null && repositoryPath === null && !metadataOnly) {
    throw new Error("public_entity_graph_media_locator");
  }
  if (repositoryPath !== null) {
    assertMediaSourcePath(repositoryPath, "public_entity_graph_media_path");
  }
  if (metadataOnly || role === "historical_wave_proposal_presentation") {
    return;
  }
  if (role === "token_linked_source_media") {
    if (uri === null || !isArtBlocksMediaUrl(uri)) {
      throw new Error("public_entity_graph_media_uri");
    }
    return;
  }
  if (repositoryPath === null) {
    throw new Error("public_entity_graph_media_path");
  }
}

function isArtBlocksMediaUrl(value: string): boolean {
  try {
    assertApprovedArtBlocksMediaUrl(value);
    return true;
  } catch {
    return false;
  }
}

function assertMediaVisual(
  media: Record<string, unknown>,
  metadataOnly: boolean
): void {
  const visual = media["visual"];
  if (typeof visual !== "boolean") {
    throw new Error("public_entity_graph_media_visual");
  }
  const width = media["width"];
  const height = media["height"];
  if (
    visual &&
    !metadataOnly &&
    (typeof width !== "number" ||
      typeof height !== "number" ||
      width <= 0 ||
      height <= 0)
  ) {
    throw new Error("public_entity_graph_media_dimensions");
  }
  const alt = media["accessibility_text"];
  if (
    visual &&
    !metadataOnly &&
    typeof alt !== "string" &&
    media["accessibility_status"] !== "publication_join"
  ) {
    throw new Error("public_entity_graph_media_alt");
  }
}

function assertMediaIdentity(media: Record<string, unknown>): void {
  requiredString(
    media,
    "subject_entity_id",
    "public_entity_graph_media_subject"
  );
  requiredString(media, "credit", "public_entity_graph_media_credit");
}

function validateWaveProposalMediaProfile(
  uri: string | null,
  affordances: readonly string[],
  media: Record<string, unknown>,
  rights: Record<string, unknown>
): void {
  const signedWave = isRecord(media["signed_wave"])
    ? media["signed_wave"]
    : requiredObject(
        media,
        "wave_proposal_context",
        "public_entity_graph_media_wave"
      );
  requiredString(signedWave, "wave_id", "public_entity_graph_media_wave_id");
  requiredString(signedWave, "drop_id", "public_entity_graph_media_drop_id");
  requiredString(
    signedWave,
    "publication_record_id",
    "public_entity_graph_media_publication"
  );
  const hasDirectVisualLocator = hasDirectVisualAffordance(affordances);
  const tokenSource = media["token_source_locator"];
  const tokenSourceUri = isRecord(tokenSource)
    ? optionalString(
        tokenSource,
        "uri",
        "public_entity_graph_media_token_source_uri"
      )
    : null;
  if (
    new Set(affordances).size !== affordances.length ||
    affordances.some((affordance) => !isAllowedProposalAffordance(affordance))
  ) {
    throw new Error("public_entity_graph_media_proposal_contract");
  }
  if (!hasDirectVisualLocator) {
    if (uri !== null && !isMuseumExternalProposalMediaUrl(uri)) {
      throw new Error("public_entity_graph_media_proposal_contract");
    }
    assertWaveProposalRights(rights);
    return;
  }
  if (uri === null || !isMuseumExternalProposalMediaUrl(uri)) {
    throw new Error("public_entity_graph_media_proposal_contract");
  }
  if (
    affordances.includes("view") &&
    (tokenSourceUri === null ||
      !isMuseumExternalProposalTokenSourceUrl(tokenSourceUri))
  ) {
    throw new Error("public_entity_graph_media_proposal_contract");
  }
  if (
    REQUIRED_MEDIA_AFFORDANCES.some(
      (affordance) => !affordances.includes(affordance)
    )
  ) {
    throw new Error("public_entity_graph_media_proposal_contract");
  }
  assertWaveProposalRights(rights);
}

function assertWaveProposalRights(rights: Record<string, unknown>): void {
  const rightsStatus = rights["status"];
  if (rightsStatus !== "restricted" && rightsStatus !== "unknown") {
    throw new Error("public_entity_graph_media_proposal_rights");
  }
}

function hasDirectVisualAffordance(affordances: readonly string[]): boolean {
  return affordances.some((affordance) =>
    ["view", "thumbnail", "hero"].includes(affordance)
  );
}

function isSafeMediaType(value: string): boolean {
  const [type, subtype, ...rest] = value.split("/");
  return (
    type !== undefined &&
    subtype !== undefined &&
    rest.length === 0 &&
    type.length > 0 &&
    subtype.length > 0 &&
    [...type, ...subtype].every((character) =>
      /[a-z0-9!#$&^_.+-]/u.test(character)
    )
  );
}

function isAllowedProposalAffordance(value: string): boolean {
  return (
    REQUIRED_MEDIA_AFFORDANCES.includes(
      value as (typeof REQUIRED_MEDIA_AFFORDANCES)[number]
    ) ||
    OPTIONAL_MEDIA_AFFORDANCES.includes(
      value as (typeof OPTIONAL_MEDIA_AFFORDANCES)[number]
    )
  );
}
