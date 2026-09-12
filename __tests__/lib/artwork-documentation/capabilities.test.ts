import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import {
  canEditDocumentationAsset,
  canEditDocumentationField,
  canParticipateInDocumentationThread,
  canReadFieldForMutation,
  canReferenceDocumentationAssetLink,
  canWriteDocumentation,
  canWriteDocumentationAssetRole,
  mutationCapabilities,
} from "@/lib/artwork-documentation/capabilities";
import type { ApiArtworkDocumentationAssetLink } from "@/generated/models/ApiArtworkDocumentationAssetLink";

function limitedEditor() {
  const context = documentationFixture();
  Object.assign(context.mutation_capabilities, {
    confirm_as_artist: false,
    manage_context: false,
    manage_assignments: false,
    read_archival_files: false,
    read_rights_evidence: false,
    read_source_receipts: false,
    read_contact: false,
    read_restricted_fields: false,
  });
  return context;
}
it("allows a public v3 instrument under original file grants while preserving legacy and sticky restrictions", () => {
  const context = limitedEditor();
  context.profile.version = 3;
  context.profile.intake_mode = "publication_only" as never;
  const asset = {
    id: "public-consent",
    role: "consent_instrument",
    access_class: "artwork",
    intended_visibility: "public_record",
  };
  const link = {
    asset_id: asset.id,
    role: asset.role,
    intended_visibility: asset.intended_visibility,
    manifest: asset,
  } as ApiArtworkDocumentationAssetLink;
  context.assets = [asset] as never;
  context.asset_links = [link];
  expect(canWriteDocumentationAssetRole(context, asset.role)).toBe(true);
  expect(canReferenceDocumentationAssetLink(context, link)).toBe(true);
  expect(canEditDocumentationAsset(context, asset.id)).toBe(true);
  context.mutation_restricted_paths = [`asset-rights:${asset.id}`];
  expect(canReferenceDocumentationAssetLink(context, link)).toBe(false);
  expect(canEditDocumentationAsset(context, asset.id)).toBe(false);
  context.mutation_restricted_paths = [];
  context.profile.version = 2;
  expect(canWriteDocumentationAssetRole(context, asset.role)).toBe(false);
  expect(canReferenceDocumentationAssetLink(context, link)).toBe(false);
});

it.each(["mutation_capabilities", "mutation_restricted_paths"] as const)(
  "fails closed when %s is absent despite expanded reader capabilities",
  (key) => {
    const context = limitedEditor();
    Reflect.deleteProperty(context, key);
    expect(canWriteDocumentation(mutationCapabilities(context))).toBe(false);
    expect(canEditDocumentationField(context, "artwork.title")).toBe(false);
    expect(canWriteDocumentationAssetRole(context, "artwork_final")).toBe(
      false
    );
  }
);

it("fails closed for malformed write policy metadata", () => {
  const context = limitedEditor();
  Reflect.set(context.mutation_capabilities, "confirm_as_artist", "yes");
  expect(canWriteDocumentation(mutationCapabilities(context))).toBe(false);
});

it("treats an omitted optional restricted-field flag as false without removing original editor permissions", () => {
  const context = limitedEditor();
  delete context.mutation_capabilities.read_restricted_fields;
  expect(canEditDocumentationField(context, "artwork.title")).toBe(true);
  expect(canEditDocumentationField(context, "artwork.title", true)).toBe(false);
});

it("rejects malformed optional restricted-field flags", () => {
  const context = limitedEditor();
  Reflect.set(context.mutation_capabilities, "read_restricted_fields", null);
  expect(canEditDocumentationField(context, "artwork.title")).toBe(false);
});

it("fails closed for an unknown writer module", () => {
  const context = limitedEditor();
  context.mutation_capabilities.edit_modules = ["unknown-module"] as never;
  expect(canWriteDocumentation(mutationCapabilities(context))).toBe(false);
});

it("does not borrow program viewer context-read permission to activate an otherwise unsupported write grant", () => {
  const context = limitedEditor();
  context.mutation_capabilities.read_context = false;
  expect(context.capabilities.read_context).toBe(true);
  expect(canWriteDocumentation(mutationCapabilities(context))).toBe(false);
  expect(canEditDocumentationField(context, "artwork.title")).toBe(false);
});

it("keeps ordinary fields editable while viewer reads do not authorize contact or rights fields", () => {
  const context = limitedEditor();
  expect(canEditDocumentationField(context, "artwork.title")).toBe(true);
  expect(canEditDocumentationField(context, "identity.private_contact")).toBe(
    false
  );
  expect(canEditDocumentationField(context, "rights.people_depicted")).toBe(
    false
  );
  expect(context.capabilities.read_contact).toBe(true);
  expect(context.capabilities.read_rights_evidence).toBe(true);
});

it.each([
  "artwork.location",
  "process.capture_method",
  "rights.third_party_material",
])(
  "preserves historical restriction on %s after its value becomes public",
  (path) => {
    const context = limitedEditor();
    context.mutation_restricted_paths = [path];
    expect(canEditDocumentationField(context, path)).toBe(false);
    context.mutation_capabilities.read_restricted_fields = true;
    expect(canEditDocumentationField(context, path)).toBe(true);
  }
);

it("requires original authority when a proposed answer becomes restricted", () => {
  const context = limitedEditor();
  expect(canEditDocumentationField(context, "artwork.title")).toBe(true);
  expect(canEditDocumentationField(context, "artwork.title", true)).toBe(false);
  context.mutation_capabilities.read_restricted_fields = true;
  expect(canEditDocumentationField(context, "artwork.title", true)).toBe(true);
});

it("preserves separate archival, rights and contact authority", () => {
  const context = limitedEditor();
  context.mutation_capabilities.read_archival_files = true;
  expect(canReadFieldForMutation(context, "process.capture_method", true)).toBe(
    true
  );
  expect(canReadFieldForMutation(context, "identity.private_contact")).toBe(
    false
  );
  expect(canReadFieldForMutation(context, "rights.people_depicted")).toBe(
    false
  );
});

it("keeps original artist permissions and archived field protection", () => {
  const context = documentationFixture();
  expect(canEditDocumentationField(context, "identity.private_contact")).toBe(
    true
  );
  context.lifecycle = "archived" as never;
  expect(canEditDocumentationField(context, "artwork.title")).toBe(false);
});

it.each(["rights", "archival", "contact"])(
  "does not allow a mixed viewer/editor to participate in a %s conversation",
  (restricted_class) => {
    const context = limitedEditor();
    expect(
      canParticipateInDocumentationThread(context, {
        audience: "artist_and_reviewers",
        restricted_class,
      })
    ).toBe(false);
    expect(
      canParticipateInDocumentationThread(context, {
        audience: "artist_and_reviewers",
        restricted_class: "ordinary",
      })
    ).toBe(true);
  }
);

it("checks a discussion field's historical restriction without requiring module editing", () => {
  const context = limitedEditor();
  context.mutation_capabilities.edit_modules = [];
  context.mutation_capabilities.review_lanes = ["curatorial"] as never;
  context.mutation_restricted_paths = ["artwork.title"];
  const thread = {
    audience: "reviewers_only",
    restricted_class: "ordinary",
    field_path: "artwork.title",
  };
  expect(canParticipateInDocumentationThread(context, thread)).toBe(false);
  context.mutation_capabilities.read_restricted_fields = true;
  expect(canParticipateInDocumentationThread(context, thread)).toBe(true);
});

it("keeps rights asset creation and historical asset reclassification within original permissions", () => {
  const context = limitedEditor();
  context.assets = [
    {
      id: "asset",
      role: "artwork_final",
      intended_visibility: "public_record",
      state: "ready",
      filename: "work.png",
      size_bytes: 100,
    },
  ];
  const link = {
    asset_id: "asset",
    role: "artwork_final",
    intended_visibility: "public_record",
  } as ApiArtworkDocumentationAssetLink;
  context.asset_links = [link];
  expect(canEditDocumentationAsset(context, "asset")).toBe(true);
  expect(canWriteDocumentationAssetRole(context, "rights_instrument")).toBe(
    false
  );
  context.mutation_restricted_paths = ["asset:asset"];
  expect(canEditDocumentationAsset(context, "asset")).toBe(false);
  expect(canReferenceDocumentationAssetLink(context, link)).toBe(false);
  context.mutation_capabilities.read_archival_files = true;
  expect(canEditDocumentationAsset(context, "asset")).toBe(true);
  context.mutation_restricted_paths.push("asset-rights:asset");
  expect(canEditDocumentationAsset(context, "asset")).toBe(false);
  context.mutation_capabilities.read_rights_evidence = true;
  expect(canEditDocumentationAsset(context, "asset")).toBe(true);
});
