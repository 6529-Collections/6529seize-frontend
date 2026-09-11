import type { ApiArtworkDocumentationCapabilities } from "@/generated/models/ApiArtworkDocumentationCapabilities";
import {
  ApiArtworkDocumentationCapabilitiesEditModulesEnum,
  ApiArtworkDocumentationCapabilitiesReviewLanesEnum,
} from "@/generated/models/ApiArtworkDocumentationCapabilities";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import { ApiArtworkDocumentationContextLifecycleEnum } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationAssetLink } from "@/generated/models/ApiArtworkDocumentationAssetLink";
import { ApiArtworkDocumentationAnswerIntendedVisibilityEnum } from "@/generated/models/ApiArtworkDocumentationAnswer";
import { ApiArtworkDocumentationAssetAccessClassEnum } from "@/generated/models/ApiArtworkDocumentationAsset";

const NO_MUTATIONS: ApiArtworkDocumentationCapabilities = {
  read_context: false,
  read_archival_files: false,
  read_rights_evidence: false,
  read_source_receipts: false,
  read_contact: false,
  read_restricted_fields: false,
  edit_modules: [],
  confirm_as_artist: false,
  review_lanes: [],
  manage_context: false,
  manage_assignments: false,
};

const RIGHTS_FIELDS = new Set([
  "rights.people_depicted",
  "rights.consent_status",
  "rights.consent_asset_ids",
  "rights.identifiability_note",
  "rights.sensitive_context_note",
]);

export function mutationCapabilities(
  context: ApiArtworkDocumentationContext
): ApiArtworkDocumentationCapabilities {
  const capabilities = (context as Partial<ApiArtworkDocumentationContext>)
    .mutation_capabilities;
  // Read grants must never be used as a fallback when write policy is absent.
  if (
    capabilities?.read_context !== true ||
    !Array.isArray(capabilities.edit_modules) ||
    !Array.isArray(capabilities.review_lanes) ||
    capabilities.edit_modules.some(
      (moduleId) =>
        !Object.values(
          ApiArtworkDocumentationCapabilitiesEditModulesEnum
        ).includes(moduleId)
    ) ||
    capabilities.review_lanes.some(
      (lane) =>
        !Object.values(
          ApiArtworkDocumentationCapabilitiesReviewLanesEnum
        ).includes(lane)
    ) ||
    Object.entries(NO_MUTATIONS).some(
      ([key, value]) =>
        typeof value === "boolean" &&
        typeof capabilities[
          key as keyof ApiArtworkDocumentationCapabilities
        ] !== "boolean"
    ) ||
    !Array.isArray(context.mutation_restricted_paths) ||
    context.mutation_restricted_paths.some((path) => typeof path !== "string")
  )
    return NO_MUTATIONS;
  return capabilities;
}

export function canWriteDocumentation(
  capabilities: ApiArtworkDocumentationCapabilities
): boolean {
  return (
    capabilities.confirm_as_artist ||
    capabilities.edit_modules.length > 0 ||
    capabilities.review_lanes.length > 0 ||
    capabilities.manage_context ||
    capabilities.manage_assignments
  );
}

export function canReadFieldForMutation(
  context: ApiArtworkDocumentationContext,
  path: string,
  restricted = false
): boolean {
  const capabilities = mutationCapabilities(context);
  if (!capabilities.read_context) return false;
  if (capabilities.confirm_as_artist) return true;
  if (path === "identity.private_contact") return capabilities.read_contact;
  if (RIGHTS_FIELDS.has(path)) return capabilities.read_rights_evidence;
  const [moduleId, field] = path.split(".");
  const answer = context.modules[moduleId ?? ""]?.answers[field ?? ""];
  if (answer && "redacted" in answer && answer.redacted) return false;
  const isRestricted =
    restricted ||
    answer?.intended_visibility ===
      ApiArtworkDocumentationAnswerIntendedVisibilityEnum.Restricted ||
    context.mutation_restricted_paths.includes(path);
  if (!isRestricted) return true;
  if (capabilities.read_restricted_fields) return true;
  if (moduleId === "rights") return capabilities.read_rights_evidence;
  if (["files", "preservation", "process"].includes(moduleId ?? ""))
    return capabilities.read_archival_files;
  return false;
}

export function canEditDocumentationField(
  context: ApiArtworkDocumentationContext,
  path: string,
  restricted = false
): boolean {
  return (
    context.lifecycle === ApiArtworkDocumentationContextLifecycleEnum.Active &&
    mutationCapabilities(context).edit_modules.some(
      (moduleId) => moduleId === path.split(".")[0]
    ) &&
    canReadFieldForMutation(context, path, restricted)
  );
}

export function canParticipateInDocumentationThread(
  context: ApiArtworkDocumentationContext,
  thread: {
    readonly audience: string;
    readonly restricted_class: string;
    readonly field_path?: string | null | undefined;
  }
): boolean {
  const capabilities = mutationCapabilities(context);
  if (!canWriteDocumentation(capabilities)) return false;
  if (
    thread.audience === "reviewers_only" &&
    !capabilities.review_lanes.length &&
    !(capabilities.manage_context && !capabilities.confirm_as_artist)
  )
    return false;
  if (thread.field_path && !canReadFieldForMutation(context, thread.field_path))
    return false;
  if (capabilities.confirm_as_artist) return true;
  return (
    thread.restricted_class === "ordinary" ||
    (thread.restricted_class === "rights" &&
      capabilities.read_rights_evidence) ||
    (thread.restricted_class === "archival" &&
      capabilities.read_archival_files) ||
    (thread.restricted_class === "contact" && capabilities.read_contact)
  );
}

export function canWriteDocumentationAssetRole(
  context: ApiArtworkDocumentationContext,
  role: string
): boolean {
  const capabilities = mutationCapabilities(context);
  return (
    context.lifecycle === ApiArtworkDocumentationContextLifecycleEnum.Active &&
    capabilities.edit_modules.includes(
      ApiArtworkDocumentationCapabilitiesEditModulesEnum.Files
    ) &&
    (!["rights_instrument", "consent_instrument"].includes(role) ||
      capabilities.read_rights_evidence)
  );
}

export function canReferenceDocumentationAssetLink(
  context: ApiArtworkDocumentationContext,
  link: ApiArtworkDocumentationAssetLink
): boolean {
  const capabilities = mutationCapabilities(context);
  if (!capabilities.read_context) return false;
  if (capabilities.confirm_as_artist) return true;
  if (
    ["rights_instrument", "consent_instrument"].includes(link.role) ||
    context.mutation_restricted_paths.includes(`asset-rights:${link.asset_id}`)
  )
    return capabilities.read_rights_evidence;
  return (
    (link.intended_visibility !== "restricted" &&
      !context.mutation_restricted_paths.includes(`asset:${link.asset_id}`)) ||
    capabilities.read_archival_files
  );
}

export function canEditDocumentationAsset(
  context: ApiArtworkDocumentationContext,
  assetId: string
): boolean {
  const capabilities = mutationCapabilities(context);
  const asset = context.assets.find((item) => item.id === assetId);
  if (!asset || !canWriteDocumentationAssetRole(context, asset.role))
    return false;
  if (capabilities.confirm_as_artist) return true;
  const paths = context.mutation_restricted_paths;
  const links = context.asset_links.filter((link) => link.asset_id === assetId);
  const rightsEvidence =
    asset.access_class ===
      ApiArtworkDocumentationAssetAccessClassEnum.RightsEvidence ||
    paths.includes(`asset-rights:${assetId}`) ||
    [asset, ...links].some((item) =>
      ["rights_instrument", "consent_instrument"].includes(item.role)
    );
  if (rightsEvidence) return capabilities.read_rights_evidence;
  return (
    (!paths.includes(`asset:${assetId}`) &&
      [asset, ...links].every(
        (item) => item.intended_visibility !== "restricted"
      )) ||
    capabilities.read_archival_files
  );
}
