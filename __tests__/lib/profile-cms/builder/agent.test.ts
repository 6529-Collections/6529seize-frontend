import {
  CMS_BUILDER_LOCAL_DRAFT_ID,
  CMS_BUILDER_SCHEMA_BUNDLE_SCHEMA,
  CMS_BUILDER_SOURCE_PACKET_SCHEMA,
  createCmsBuilderSchemaBundle,
  createCmsBuilderSourcePacket,
  reviewCmsAgentPatch,
} from "@/lib/profile-cms/builder/agent";
import {
  createDefaultCmsBuilderState,
  validateCmsBuilderState,
} from "@/lib/profile-cms/builder/package";
import { CMS_AGENT_PATCH_SCHEMA } from "@/lib/profile-cms/protocol/v1";

describe("profile CMS builder agent helpers", () => {
  it("exports source packets and schema bundles for external tools", () => {
    const validation = validateCmsBuilderState(
      createDefaultCmsBuilderState("punk6529"),
      new Date("2026-06-18T00:00:00.000Z")
    );

    const sourcePacket = createCmsBuilderSourcePacket({
      canUseBuilderApi: true,
      cmsPackage: validation.cmsPackage,
      draftId: "draft-1",
      draftVersion: 3,
      profileId: "profile-punk6529",
      validation: validation.result,
    });
    const schemaBundle = createCmsBuilderSchemaBundle(
      "2026-06-18T00:00:00.000Z"
    );

    expect(sourcePacket.schema).toBe(CMS_BUILDER_SOURCE_PACKET_SCHEMA);
    expect(sourcePacket.draft).toEqual(
      expect.objectContaining({
        draft_id: "draft-1",
        base_version: 3,
        writable_by_connected_profile: true,
        owner_profile_id: "profile-punk6529",
      })
    );
    expect(sourcePacket.facts.profile_handle).toBe("punk6529");
    expect(sourcePacket.author_copy.blocks).toHaveLength(3);
    expect(sourcePacket.derived_metadata.package_hash).toMatch(
      /^sha256:[a-f0-9]{64}$/
    );
    expect(sourcePacket.validation_diagnostics.valid).toBe(true);
    expect(sourcePacket.prompt_injection_rules.join(" ")).toContain(
      "untrusted data"
    );
    expect(schemaBundle.schema).toBe(CMS_BUILDER_SCHEMA_BUNDLE_SCHEMA);
    expect(schemaBundle.schema_names.agent_patch).toBe(CMS_AGENT_PATCH_SCHEMA);
    expect(schemaBundle.schemas.cms_agent_patch_v1).toEqual(
      expect.objectContaining({ title: "6529 CMS Agent Patch v1" })
    );
  });

  it("reviews and applies a valid metadata patch to a local draft", () => {
    const validation = validateCmsBuilderState(
      createDefaultCmsBuilderState("punk6529"),
      new Date("2026-06-18T00:00:00.000Z")
    );
    const patchJson = JSON.stringify({
      schema: CMS_AGENT_PATCH_SCHEMA,
      patch_id: "patch-title",
      target: {
        draft_id: CMS_BUILDER_LOCAL_DRAFT_ID,
        base_version: 0,
        base_package_hash: validation.cmsPackage.integrity.package_hash,
      },
      operations: [
        {
          op: "update_page_metadata",
          path: "/payload/pages/0/metadata/title",
          value: "Agent reviewed homepage",
          reason: "Tighten the homepage title.",
        },
      ],
      provenance: {
        created_at: "2026-06-18T00:00:00.000Z",
        author_type: "user_agent",
        agent_name: "local-test-agent",
      },
    });

    const review = reviewCmsAgentPatch({
      currentDraftVersion: 0,
      currentPackage: validation.cmsPackage,
      patchJson,
    });

    expect(review.ok).toBe(true);
    if (!review.ok) {
      throw new Error("Expected patch review to pass.");
    }

    expect(review.changes).toEqual([
      expect.objectContaining({
        op: "update_page_metadata",
        path: "/payload/pages/0/metadata/title",
        after: "Agent reviewed homepage",
      }),
    ]);
    expect(review.proposedPackage.payload.pages[0]?.metadata.title).toBe(
      "Agent reviewed homepage"
    );
    expect(review.validation.valid).toBe(true);
  });

  it("rejects unsafe patch output before it can be applied", () => {
    const validation = validateCmsBuilderState(
      createDefaultCmsBuilderState("punk6529"),
      new Date("2026-06-18T00:00:00.000Z")
    );
    const patchJson = JSON.stringify({
      schema: CMS_AGENT_PATCH_SCHEMA,
      patch_id: "patch-unsafe-url",
      target: {
        draft_id: CMS_BUILDER_LOCAL_DRAFT_ID,
        base_version: 0,
        base_package_hash: validation.cmsPackage.integrity.package_hash,
      },
      operations: [
        {
          op: "add_block",
          path: "/payload/pages/0/blocks/-",
          value: {
            id: "block-unsafe-link",
            block_type: "button_link",
            label: "Unsafe link",
            href: "javascript:alert(1)",
          },
          reason: "Injected link.",
        },
      ],
      provenance: {
        created_at: "2026-06-18T00:00:00.000Z",
        author_type: "user_agent",
        agent_name: "local-test-agent",
      },
    });

    const review = reviewCmsAgentPatch({
      currentDraftVersion: 0,
      currentPackage: validation.cmsPackage,
      patchJson,
    });

    expect(review.ok).toBe(false);
    expect(review.changes).toHaveLength(1);
    expect(review.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "block.unsafe_url",
          path: "/payload/pages/0/blocks/3/href",
        }),
      ])
    );
  });

  it("rejects patches that target a different saved draft", () => {
    const validation = validateCmsBuilderState(
      createDefaultCmsBuilderState("punk6529"),
      new Date("2026-06-18T00:00:00.000Z")
    );
    const patchJson = JSON.stringify({
      schema: CMS_AGENT_PATCH_SCHEMA,
      patch_id: "patch-other-draft",
      target: {
        draft_id: "draft-other",
        base_version: 0,
      },
      operations: [
        {
          op: "update_theme",
          path: "/site/theme/accent",
          value: "#ffffff",
        },
      ],
      provenance: {
        created_at: "2026-06-18T00:00:00.000Z",
        author_type: "user_agent",
      },
    });

    const review = reviewCmsAgentPatch({
      currentDraftId: "draft-current",
      currentDraftVersion: 0,
      currentPackage: validation.cmsPackage,
      patchJson,
    });

    expect(review.ok).toBe(false);
    expect(review.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "patch.target_draft_mismatch",
          path: "/target/draft_id",
        }),
      ])
    );
  });

  it("rejects metadata object patches with unsupported fields", () => {
    const validation = validateCmsBuilderState(
      createDefaultCmsBuilderState("punk6529"),
      new Date("2026-06-18T00:00:00.000Z")
    );
    const patchJson = JSON.stringify({
      schema: CMS_AGENT_PATCH_SCHEMA,
      patch_id: "patch-metadata-object",
      target: {
        draft_id: CMS_BUILDER_LOCAL_DRAFT_ID,
        base_version: 0,
        base_package_hash: validation.cmsPackage.integrity.package_hash,
      },
      operations: [
        {
          op: "update_page_metadata",
          path: "/payload/pages/0/metadata",
          value: {
            title: "Allowed title",
            unexpected_field: "not allowed",
          },
        },
      ],
      provenance: {
        created_at: "2026-06-18T00:00:00.000Z",
        author_type: "user_agent",
      },
    });

    const review = reviewCmsAgentPatch({
      currentDraftVersion: 0,
      currentPackage: validation.cmsPackage,
      patchJson,
    });

    expect(review.ok).toBe(false);
    expect(review.changes).toHaveLength(0);
    expect(review.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "patch.metadata_field_unsupported",
          path: "/operations/0/value/unexpected_field",
        }),
      ])
    );
  });

  it("rejects block updates outside safe author-copy fields", () => {
    const validation = validateCmsBuilderState(
      createDefaultCmsBuilderState("punk6529"),
      new Date("2026-06-18T00:00:00.000Z")
    );
    const patchJson = JSON.stringify({
      schema: CMS_AGENT_PATCH_SCHEMA,
      patch_id: "patch-block-type",
      target: {
        draft_id: CMS_BUILDER_LOCAL_DRAFT_ID,
        base_version: 0,
        base_package_hash: validation.cmsPackage.integrity.package_hash,
      },
      operations: [
        {
          op: "update_block",
          path: "/payload/pages/0/blocks/0/block_type",
          value: "rich_text",
        },
      ],
      provenance: {
        created_at: "2026-06-18T00:00:00.000Z",
        author_type: "user_agent",
      },
    });

    const review = reviewCmsAgentPatch({
      currentDraftVersion: 0,
      currentPackage: validation.cmsPackage,
      patchJson,
    });

    expect(review.ok).toBe(false);
    expect(review.changes).toHaveLength(0);
    expect(review.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "patch.block_field_unsupported",
          path: "/operations/0/value/block_type",
        }),
      ])
    );
  });

  it("rejects invalid add_block payloads before insertion", () => {
    const validation = validateCmsBuilderState(
      createDefaultCmsBuilderState("punk6529"),
      new Date("2026-06-18T00:00:00.000Z")
    );
    const patchJson = JSON.stringify({
      schema: CMS_AGENT_PATCH_SCHEMA,
      patch_id: "patch-invalid-block",
      target: {
        draft_id: CMS_BUILDER_LOCAL_DRAFT_ID,
        base_version: 0,
        base_package_hash: validation.cmsPackage.integrity.package_hash,
      },
      operations: [
        {
          op: "add_block",
          path: "/payload/pages/0/blocks/-",
          value: {
            id: "block-invalid",
          },
        },
      ],
      provenance: {
        created_at: "2026-06-18T00:00:00.000Z",
        author_type: "user_agent",
      },
    });

    const review = reviewCmsAgentPatch({
      currentDraftVersion: 0,
      currentPackage: validation.cmsPackage,
      patchJson,
    });

    expect(review.ok).toBe(false);
    expect(review.changes).toHaveLength(0);
    expect(review.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "patch.value_invalid",
          path: "/operations/0/value",
        }),
      ])
    );
  });

  it("rejects duplicate add_block ids", () => {
    const validation = validateCmsBuilderState(
      createDefaultCmsBuilderState("punk6529"),
      new Date("2026-06-18T00:00:00.000Z")
    );
    const existingBlockId =
      validation.cmsPackage.payload.pages[0]?.blocks[0]?.id ??
      "block-heading-1";
    const patchJson = JSON.stringify({
      schema: CMS_AGENT_PATCH_SCHEMA,
      patch_id: "patch-duplicate-block",
      target: {
        draft_id: CMS_BUILDER_LOCAL_DRAFT_ID,
        base_version: 0,
        base_package_hash: validation.cmsPackage.integrity.package_hash,
      },
      operations: [
        {
          op: "add_block",
          path: "/payload/pages/0/blocks/-",
          value: {
            id: existingBlockId,
            block_type: "heading",
            text: "Duplicate",
          },
        },
      ],
      provenance: {
        created_at: "2026-06-18T00:00:00.000Z",
        author_type: "user_agent",
      },
    });

    const review = reviewCmsAgentPatch({
      currentDraftVersion: 0,
      currentPackage: validation.cmsPackage,
      patchJson,
    });

    expect(review.ok).toBe(false);
    expect(review.changes).toHaveLength(0);
    expect(review.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "patch.block_duplicate_id",
          path: "/operations/0/value/id",
        }),
      ])
    );
  });

  it("does not return staged changes when a later operation fails", () => {
    const validation = validateCmsBuilderState(
      createDefaultCmsBuilderState("punk6529"),
      new Date("2026-06-18T00:00:00.000Z")
    );
    const patchJson = JSON.stringify({
      schema: CMS_AGENT_PATCH_SCHEMA,
      patch_id: "patch-partial-failure",
      target: {
        draft_id: CMS_BUILDER_LOCAL_DRAFT_ID,
        base_version: 0,
        base_package_hash: validation.cmsPackage.integrity.package_hash,
      },
      operations: [
        {
          op: "update_page_metadata",
          path: "/payload/pages/0/metadata/title",
          value: "Staged title",
        },
        {
          op: "update_block",
          path: "/payload/pages/0/blocks/0/block_type",
          value: "rich_text",
        },
      ],
      provenance: {
        created_at: "2026-06-18T00:00:00.000Z",
        author_type: "user_agent",
      },
    });

    const review = reviewCmsAgentPatch({
      currentDraftVersion: 0,
      currentPackage: validation.cmsPackage,
      patchJson,
    });

    expect(review.ok).toBe(false);
    expect(review.changes).toHaveLength(0);
    expect(review.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "patch.block_field_unsupported",
        }),
      ])
    );
  });

  it("rejects patches that mix structural and indexed block mutations", () => {
    const validation = validateCmsBuilderState(
      createDefaultCmsBuilderState("punk6529"),
      new Date("2026-06-18T00:00:00.000Z")
    );
    const patchJson = JSON.stringify({
      schema: CMS_AGENT_PATCH_SCHEMA,
      patch_id: "patch-mixed-block-ops",
      target: {
        draft_id: CMS_BUILDER_LOCAL_DRAFT_ID,
        base_version: 0,
        base_package_hash: validation.cmsPackage.integrity.package_hash,
      },
      operations: [
        {
          op: "add_block",
          path: "/payload/pages/0/blocks/-",
          value: {
            id: "block-new-heading",
            block_type: "heading",
            text: "New heading",
          },
        },
        {
          op: "update_block",
          path: "/payload/pages/0/blocks/0/text",
          value: "Retargeted heading",
        },
      ],
      provenance: {
        created_at: "2026-06-18T00:00:00.000Z",
        author_type: "user_agent",
      },
    });

    const review = reviewCmsAgentPatch({
      currentDraftVersion: 0,
      currentPackage: validation.cmsPackage,
      patchJson,
    });

    expect(review.ok).toBe(false);
    expect(review.changes).toHaveLength(0);
    expect(review.errors).toEqual([
      expect.objectContaining({
        code: "patch.block_structural_mix",
        path: "/operations",
      }),
    ]);
  });
});
