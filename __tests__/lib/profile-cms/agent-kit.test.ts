import {
  createCmsAgentKit,
  CMS_AGENT_FILE_PROPOSAL_SCHEMA,
} from "@/lib/profile-cms/agent-kit";
import { instantiateCmsStudioTemplate } from "@/lib/profile-cms/studio/templates";
import { withComputedCmsHashes } from "@/lib/profile-cms/protocol/v1";

it("exports the complete multipage document and file proposal contract without mutating the source", () => {
  const original = instantiateCmsStudioTemplate(
    "artist-studio",
    "ExampleProfile",
    new Date("2026-09-10T12:00:00.000Z")
  );
  const before = JSON.stringify(original);
  const kit = createCmsAgentKit(original);
  expect(kit.cms_package.payload.pages.length).toBeGreaterThan(1);
  expect(kit.cms_package).toEqual(withComputedCmsHashes(original));
  expect(kit.proposal_example.candidate_package).toEqual(kit.cms_package);
  expect(kit.proposal_example.schema).toBe(CMS_AGENT_FILE_PROPOSAL_SCHEMA);
  expect(kit.proposal_schema.properties.candidate_package.$ref).toBe(
    kit.package_schema.$id
  );
  expect(kit.constraints.protected_fields).toContain("payload.assets");
  expect(kit.constraints.publication_authority).toBe(false);
  expect(JSON.stringify(original)).toBe(before);
  kit.cms_package.site.title = "Agent working copy";
  expect(original.site.title).not.toBe("Agent working copy");
  expect(Object.keys(kit)).not.toEqual(
    expect.arrayContaining(["token", "authorization", "api_key"])
  );
});
