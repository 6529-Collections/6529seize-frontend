import type {
  CmsBlockV1,
  CmsPackageV1,
  CmsPageV1,
  CmsValidationIssueV1,
} from "./schemas";
import { addIssue } from "./validation-helpers";

const NATIVE_DESIGNS = new Set([
  "personal-v2",
  "artist-v2",
  "collector-v2",
  "meme-v2",
  "organization-v2",
  "fund-v2",
]);

type ValidationTarget = {
  readonly path: string;
  readonly location: { pageId: string; blockId: string };
  readonly issues: CmsValidationIssueV1[];
};

/** Native presentation extends V1 JSON without changing older publications. */
export function validateNativeCmsContent(
  cmsPackage: CmsPackageV1,
  issues: CmsValidationIssueV1[]
): void {
  const design = cmsPackage.site.theme.tokens?.["studio_design"];
  if (typeof design !== "string" || !NATIVE_DESIGNS.has(design)) return;
  const assets = new Set(cmsPackage.payload.assets.map((asset) => asset.id));
  const pages = new Set(cmsPackage.payload.pages.map((page) => page.id));
  const pagesById = new Map(
    cmsPackage.payload.pages.map((page) => [page.id, page])
  );
  cmsPackage.payload.pages.forEach((page, pageIndex) => {
    page.blocks.forEach((block, blockIndex) => {
      const blockPath = `/payload/pages/${pageIndex}/blocks/${blockIndex}`;
      const context = { pageId: page.id, blockId: block.id };
      const target = { path: blockPath, location: context, issues };
      const fields = block as CmsBlockV1 & Record<string, unknown>;
      if (block.block_type === "button_link") {
        validateSectionLink(fields, pagesById, blockPath, context, issues);
        validateStrings(fields, ["subject"], false, target);
      }
      if (block.block_type === "callout") {
        validateContact(fields, blockPath, context, issues);
        validateProjectMockup(fields, blockPath, context, issues);
      }
      const gallery = ["gallery", "lightbox_gallery"].includes(
        block.block_type
      );
      const field = gallery ? "items" : "rows";
      if (!gallery && block.block_type !== "callout") return;
      const entries: unknown = fields[field];
      if (entries === undefined) return;
      const path = `${blockPath}/${field}`;
      if (!Array.isArray(entries)) {
        addIssue(issues, {
          ...context,
          path,
          code: "block.native_items_invalid",
          message: "Artwork items and record rows must be arrays.",
        });
        return;
      }
      // Rendering can salvage item-only data, but authored native galleries
      // require canonical placements so annotations cannot silently disappear.
      const remainingAssets = countCanonicalAssets(fields["asset_ids"]);
      entries.forEach((entry: unknown, index) => {
        const entryPath = `${path}/${index}`;
        if (!isRecord(entry)) {
          addIssue(issues, {
            ...context,
            path: entryPath,
            code: "block.native_item_invalid",
            message: "An artwork item or record row must be an object.",
          });
          return;
        }
        validateStrings(
          entry,
          gallery ? ["title", "subtitle", "category"] : ["label", "value"],
          !gallery,
          { ...target, path: entryPath }
        );
        if (gallery) {
          checkReference(entry["asset_id"], assets, "asset", true, {
            ...target,
            path: `${entryPath}/asset_id`,
          });
          const assetId = entry["asset_id"];
          if (
            typeof assetId === "string" &&
            (remainingAssets.get(assetId) ?? 0) === 0
          ) {
            addIssue(issues, {
              ...context,
              path: `${entryPath}/asset_id`,
              code: "block.gallery_item_unlisted",
              message:
                "Each artwork item needs its own placement in the gallery's asset_ids.",
            });
          } else if (typeof assetId === "string") {
            remainingAssets.set(
              assetId,
              (remainingAssets.get(assetId) ?? 0) - 1
            );
          }
        }
        checkReference(entry["page_id"], pages, "page", false, {
          ...target,
          path: `${entryPath}/page_id`,
        });
      });
    });
  });
}

function countCanonicalAssets(value: unknown): Map<string, number> {
  const counts = new Map<string, number>();
  if (!Array.isArray(value)) return counts;
  for (const id of value) {
    if (typeof id === "string") counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

function validateStrings(
  fields: Readonly<Record<string, unknown>>,
  keys: readonly string[],
  required: boolean,
  target: ValidationTarget
): void {
  for (const key of keys) {
    if (
      typeof fields[key] === "string" ||
      (!required && fields[key] === undefined)
    )
      continue;
    addIssue(target.issues, {
      ...target.location,
      path: `${target.path}/${key}`,
      code: "block.native_field_invalid",
      message:
        "Artwork labels, record text and contact fields must be strings.",
    });
  }
}

function validateContact(
  fields: Readonly<Record<string, unknown>>,
  path: string,
  context: { pageId: string; blockId: string },
  issues: CmsValidationIssueV1[]
): void {
  const presentation = fields["presentation"];
  if (!isRecord(presentation) || presentation["variant"] !== "contact") return;
  validateStrings(fields, ["email", "subject"], false, {
    path,
    location: context,
    issues,
  });
  if (fields["form"] === undefined || typeof fields["form"] === "boolean")
    return;
  addIssue(issues, {
    ...context,
    path: `${path}/form`,
    code: "block.native_field_invalid",
    message: "The contact form setting must be a boolean.",
  });
}

function validateProjectMockup(
  fields: Readonly<Record<string, unknown>>,
  path: string,
  context: { pageId: string; blockId: string },
  issues: CmsValidationIssueV1[]
): void {
  validateStrings(
    fields,
    [
      "mockup_kicker",
      "mockup_heading",
      "mockup_period",
      "mockup_footer",
      "mockup_description",
    ],
    false,
    { path, location: context, issues }
  );
  const style = fields["mockup_style"];
  if (style === undefined || style === "planner" || style === "catalogue")
    return;
  addIssue(issues, {
    ...context,
    path: `${path}/mockup_style`,
    code: "block.native_field_invalid",
    message: "The project mockup style must be planner or catalogue.",
  });
}

function validateSectionLink(
  block: CmsBlockV1 & Record<string, unknown>,
  pages: ReadonlyMap<string, CmsPageV1>,
  path: string,
  context: { pageId: string; blockId: string },
  issues: CmsValidationIssueV1[]
): void {
  const blockId = block["block_id"];
  if (blockId === undefined) return;
  const pageId = block["page_id"];
  const page = typeof pageId === "string" ? pages.get(pageId) : undefined;
  if (
    typeof blockId === "string" &&
    page?.blocks.some((candidate) => candidate.id === blockId)
  )
    return;
  addIssue(issues, {
    ...context,
    path: `${path}/block_id`,
    code: "block.reference_missing",
    message: "The section link must identify a block on its destination page.",
  });
}

function checkReference(
  value: unknown,
  ids: ReadonlySet<string>,
  kind: "asset" | "page",
  required: boolean,
  target: ValidationTarget
): void {
  if (value === undefined && !required) return;
  if (typeof value === "string" && ids.has(value)) return;
  addIssue(target.issues, {
    ...target.location,
    path: target.path,
    code: `${kind}.reference_missing`,
    message: `The ${kind} reference must identify an existing ${kind}.`,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
