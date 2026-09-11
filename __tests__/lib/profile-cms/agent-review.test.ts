import {
  CmsAgentReviewError,
  reviewCmsAgentCandidate,
  reviewCmsAgentFile,
} from "@/lib/profile-cms/agent-review";
import {
  CMS_STUDIO_TEMPLATES,
  instantiateCmsStudioTemplate,
} from "@/lib/profile-cms/studio/templates";
import {
  cmsPackageSchema,
  withComputedCmsHashes,
} from "@/lib/profile-cms/protocol/v1";

function fixture() {
  return instantiateCmsStudioTemplate(CMS_STUDIO_TEMPLATES[0]!.id, "punk6529");
}

it("reviews edits on a later page and preserves every other page and original source asset", () => {
  const base = fixture();
  const proposed = cmsPackageSchema.parse(JSON.parse(JSON.stringify(base)));
  proposed.payload.pages[1]!.metadata.title = "My new page title";
  const review = reviewCmsAgentCandidate({
    base,
    candidate: proposed,
    expectedBaseHash: base.integrity.package_hash,
    summary: "Edit the second page",
  });
  expect(review.cmsPackage.payload.pages).toHaveLength(
    base.payload.pages.length
  );
  expect(review.cmsPackage.payload.pages[0]).toEqual(base.payload.pages[0]);
  expect(review.cmsPackage.payload.assets).toEqual(base.payload.assets);
  expect(review.changes).toEqual([
    {
      path: `/payload/pages/${proposed.payload.pages[1]!.id}`,
      before: base.payload.pages[1],
      after: proposed.payload.pages[1],
    },
  ]);
  expect(review.cmsPackage.integrity.package_hash).not.toBe(
    base.integrity.package_hash
  );
  expect(base.payload.pages[1]!.metadata.title).not.toBe("My new page title");
});

it("discards inherited signing and storage assertions and recomputes hashes", () => {
  const base = fixture();
  const candidate = cmsPackageSchema.parse(JSON.parse(JSON.stringify(base)));
  candidate.site.title = "A reviewed title";
  const review = reviewCmsAgentCandidate({
    base,
    candidate,
    expectedBaseHash: base.integrity.package_hash,
    summary: "Title",
  });
  expect(review.cmsPackage.signatures).toEqual([
    expect.objectContaining({ type: "fixture" }),
  ]);
  expect(review.cmsPackage.storage).toEqual([
    expect.objectContaining({
      provider: "fixture",
      canonical: false,
      content_hash: review.cmsPackage.integrity.package_hash,
    }),
  ]);
  expect(review.cmsPackage.integrity).toEqual(
    withComputedCmsHashes(candidate).integrity
  );
});

it.each(["package_id", "profile", "path", "assets"])(
  "rejects changes outside proposal scope: %s",
  (field) => {
    const base = fixture();
    const candidate = cmsPackageSchema.parse(JSON.parse(JSON.stringify(base)));
    if (field === "package_id") candidate.package_id = "another-package";
    if (field === "profile") candidate.profile.handle = "otherprofile";
    if (field === "path") candidate.site.base_path = "/other/index.html";
    if (field === "assets") candidate.payload.assets = [];
    expect(() =>
      reviewCmsAgentCandidate({
        base,
        candidate,
        expectedBaseHash: base.integrity.package_hash,
        summary: "Attempt",
      })
    ).toThrow(CmsAgentReviewError);
  }
);

it("rejects a stale file proposal even if its package is otherwise valid", () => {
  const base = fixture();
  const json = JSON.stringify({
    schema: "6529.cms.agent_file_proposal.v1",
    base_package_hash: `sha256:${"0".repeat(64)}`,
    candidate_package: base,
    summary: "Stale change",
  });
  expect(() => reviewCmsAgentFile(base, json)).toThrow("stale_base");
});

it("supports the complete file envelope and rejects malformed or oversized input", () => {
  const base = fixture();
  const envelope = {
    schema: "6529.cms.agent_file_proposal.v1",
    base_package_hash: base.integrity.package_hash,
    candidate_package: base,
    summary: "No changes",
  };
  expect(reviewCmsAgentFile(base, JSON.stringify(envelope)).changes).toEqual(
    []
  );
  expect(() => reviewCmsAgentFile(base, "{")).toThrow("invalid_file");
  expect(() => reviewCmsAgentFile(base, " ".repeat(1024 * 1024 + 1))).toThrow(
    "too_large"
  );
  expect(() =>
    reviewCmsAgentFile(base, JSON.stringify({ ...envelope, summary: "" }))
  ).toThrow("invalid_file");
});

it("rejects hostile property names and deeply nested data before schema traversal", () => {
  const base = fixture();
  const hostile: unknown = JSON.parse('{"__proto__":{"polluted":true}}');
  expect(() =>
    reviewCmsAgentCandidate({
      base,
      candidate: hostile,
      expectedBaseHash: base.integrity.package_hash,
      summary: "Hostile",
    })
  ).toThrow("invalid_file");
  let deep: unknown = {};
  for (let i = 0; i < 35; i++) deep = { value: deep };
  expect(() =>
    reviewCmsAgentCandidate({
      base,
      candidate: deep,
      expectedBaseHash: base.integrity.package_hash,
      summary: "Deep",
    })
  ).toThrow("too_large");
});
