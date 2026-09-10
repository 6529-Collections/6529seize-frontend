import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationOperation } from "@/generated/models/ApiArtworkDocumentationOperation";
import { ARTWORK_DOCUMENTATION_MESSAGES } from "@/i18n/messages/artwork-documentation";
import { MODULE_IDS } from "@/lib/artwork-documentation/registry";

export function documentationFixture(): ApiArtworkDocumentationContext {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    work_id: "22222222-2222-4222-8222-222222222222",
    owner_profile_id: "artist-a",
    program_id: null,
    draft_version: 1,
    artist_record_version: 0,
    artist_record_revision_id: null,
    latest_revision_id: null,
    confirmation_status: "unconfirmed",
    lifecycle: "active",
    updated_at: 1788998400000,
    profile: {
      profile_id: "photography_documentation_v1",
      version: 1,
      program_id: null,
      wave_id: null,
      required_for_review: ["artwork.title"],
      review_lanes: ["curatorial", "technical", "rights"],
      guidance_version: "artwork-documentation-copy-v1",
      confirmation_copy_version: "artwork-documentation-confirmation-v1",
      confirmation_copy:
        ARTWORK_DOCUMENTATION_MESSAGES["artworkDocumentation.confirmCopy"],
      limits: {
        context_payload_bytes: 262144,
        asset_bytes: 4294967296,
        context_stored_and_reserved_bytes: 21474836480,
      },
      storage_mode: "private_database_and_object_storage",
      submission_gate: "optional",
      group_order: [
        "artwork",
        "story",
        "artist",
        "rights",
        "preservation",
        "review",
      ],
      modules: MODULE_IDS.map((id) => ({
        id,
        version: 1,
        fields:
          id === "artwork"
            ? [
                {
                  id: "title",
                  value_schema: {
                    type: "string",
                    minLength: 1,
                    maxLength: 255,
                  },
                  allowed_statuses: ["provided"],
                  default_visibility: "public_record",
                  locked_restricted: false,
                },
                {
                  id: "location",
                  value_schema: {
                    type: "string",
                    minLength: 1,
                    maxLength: 300,
                  },
                  allowed_statuses: ["provided", "unknown", "withheld"],
                  default_visibility: "public_record",
                  locked_restricted: false,
                },
              ]
            : [],
      })),
    },
    modules: Object.fromEntries(
      MODULE_IDS.map((id) => [
        id,
        {
          schema_version: 1,
          answers:
            id === "artwork"
              ? {
                  title: {
                    status: "provided",
                    value: "মুক্তিযুদ্ধ — A long title",
                    intended_visibility: "public_record",
                  },
                }
              : {},
          completeness: {
            status: "in_progress",
            required: id === "artwork" ? 1 : 0,
            addressed: id === "artwork" ? 1 : 0,
            missing: [],
          },
        },
      ])
    ),
    capabilities: {
      read_context: true,
      edit_modules: [...MODULE_IDS],
      read_archival_files: true,
      read_rights_evidence: true,
      read_source_receipts: true,
      read_contact: true,
      confirm_as_artist: true,
      review_lanes: [],
      manage_assignments: true,
      manage_context: true,
    },
    assets: [],
    asset_links: [],
    reviews: [],
    source_links: [],
    issues: [],
  } as unknown as ApiArtworkDocumentationContext;
}

export function titleOperation(
  value: string
): ApiArtworkDocumentationOperation {
  return {
    op: "set",
    field: "title",
    answer: { status: "provided", value, intended_visibility: "public_record" },
  } as ApiArtworkDocumentationOperation;
}
