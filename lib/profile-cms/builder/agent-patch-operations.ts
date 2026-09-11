import type {
  CmsAgentPatchV1,
  CmsBlockV1,
  CmsPackageV1,
} from "@/lib/profile-cms/protocol/v1";

type CmsAgentPatchOperation = CmsAgentPatchV1["operations"][number];
type PackagePage = CmsPackageV1["payload"]["pages"][number];
type PageMetadataField = keyof PackagePage["metadata"];

interface CmsAgentPatchChange {
  readonly op: CmsAgentPatchOperation["op"];
  readonly path: string;
  readonly before: unknown;
  readonly after: unknown;
  readonly reason?: string | undefined;
}

interface CmsAgentPatchReviewError {
  readonly code: string;
  readonly message: string;
  readonly path?: string | undefined;
  readonly params?: Readonly<Record<string, string | number>> | undefined;
}

const AUTHOR_COPY_FIELDS = [
  "title",
  "text",
  "content",
  "label",
  "quote",
  "citation",
  "caption",
] as const;
const AUTHOR_COPY_FIELD_SET = new Set<string>(AUTHOR_COPY_FIELDS);

const PAGE_METADATA_PATH = "/payload/pages/0/metadata";
const PAGE_METADATA_FIELDS = [
  "title",
  "description",
  "locale",
  "canonical_url",
  "social_image_asset_id",
  "square_social_image_asset_id",
  "navigation_label",
  "search",
  "robots",
  "last_updated",
] as const satisfies readonly PageMetadataField[];
const NAVIGATION_LABEL_PATH = "/payload/navigation/0/items/0/label";
const THEME_ACCENT_PATH = "/site/theme/accent";
const BLOCKS_PATH = "/payload/pages/0/blocks";
const BLOCK_PATH_PATTERN = /^\/payload\/pages\/0\/blocks\/(\d+)(?:\/(.+))?$/;

export function applyAgentPatchOperations(
  cmsPackage: CmsPackageV1,
  operations: readonly CmsAgentPatchOperation[],
  changes: CmsAgentPatchChange[]
): CmsAgentPatchReviewError[] {
  const blockOperationErrors = validateBlockOperationMix(operations);
  if (blockOperationErrors.length) {
    return blockOperationErrors;
  }

  const stagedChanges: CmsAgentPatchChange[] = [];
  for (let index = 0; index < operations.length; index += 1) {
    const operation = operations[index];
    if (!operation) {
      continue;
    }

    const operationErrors = applyAgentPatchOperation(
      cmsPackage,
      operation,
      index,
      stagedChanges
    );
    if (operationErrors.length) {
      return operationErrors;
    }
  }

  changes.push(...stagedChanges);
  return [];
}

function validateBlockOperationMix(
  operations: readonly CmsAgentPatchOperation[]
): CmsAgentPatchReviewError[] {
  const structuralBlockOperationCount = operations.filter((operation) =>
    isStructuralBlockOperation(operation)
  ).length;

  if (structuralBlockOperationCount > 1) {
    return [
      {
        code: "patch.block_structural_mix",
        message: "patch.block_structural_mix",
        path: "/operations",
      },
    ];
  }

  if (
    structuralBlockOperationCount &&
    operations.some((operation) => operation.op === "update_block")
  ) {
    return [
      {
        code: "patch.block_structural_mix",
        message: "patch.block_structural_mix",
        path: "/operations",
      },
    ];
  }

  return [];
}

function isStructuralBlockOperation(
  operation: CmsAgentPatchOperation
): boolean {
  return (
    operation.op === "add_block" ||
    operation.op === "remove_block" ||
    operation.op === "reorder_blocks"
  );
}

function applyAgentPatchOperation(
  cmsPackage: CmsPackageV1,
  operation: CmsAgentPatchOperation,
  index: number,
  changes: CmsAgentPatchChange[]
): CmsAgentPatchReviewError[] {
  switch (operation.op) {
    case "update_page_metadata":
    case "update_share_metadata":
      return applyPageMetadataOperation(cmsPackage, operation, index, changes);
    case "update_theme":
      return applyStringFieldOperation(
        {
          expectedPath: THEME_ACCENT_PATH,
          operation,
          setter: (value) => {
            cmsPackage.site.theme.accent = value;
          },
          value: cmsPackage.site.theme.accent,
        },
        index,
        changes
      );
    case "update_navigation":
      return applyNavigationOperation(cmsPackage, operation, index, changes);
    case "add_block":
      return applyAddBlockOperation(cmsPackage, operation, index, changes);
    case "update_block":
      return applyUpdateBlockOperation(cmsPackage, operation, index, changes);
    case "remove_block":
      return applyRemoveBlockOperation(cmsPackage, operation, index, changes);
    case "reorder_blocks":
      return applyReorderBlocksOperation(cmsPackage, operation, index, changes);
    case "add_page":
    case "remove_page":
    case "attach_source_packet":
    case "set_taxonomy_terms":
      return [
        {
          code: "patch.operation_unsupported",
          message: "patch.operation_unsupported",
          path: `/operations/${index}/op`,
          params: { op: operation.op },
        },
      ];
  }
}

function applyPageMetadataOperation(
  cmsPackage: CmsPackageV1,
  operation: CmsAgentPatchOperation,
  index: number,
  changes: CmsAgentPatchChange[]
): CmsAgentPatchReviewError[] {
  const page = getBuilderPage(cmsPackage);
  if (!page) {
    return missingPageError(index);
  }

  if (operation.path === PAGE_METADATA_PATH) {
    if (!isRecord(operation.value)) {
      return invalidValueError(index);
    }

    const unsupportedField = Object.keys(operation.value).find(
      (field) => !isPageMetadataField(field)
    );
    if (unsupportedField) {
      return unsupportedFieldError(
        index,
        unsupportedField,
        "patch.metadata_field_unsupported"
      );
    }

    const before = { ...page.metadata };
    page.metadata = { ...page.metadata, ...operation.value };
    addChange(changes, operation, before, page.metadata);
    return [];
  }

  const field = getPageMetadataField(operation.path);
  if (!field) {
    return unsupportedPathError(index, operation.path);
  }

  const before = page.metadata[field];
  (page.metadata as Record<string, unknown>)[field] = operation.value;
  addChange(changes, operation, before, operation.value);
  return [];
}

function applyNavigationOperation(
  cmsPackage: CmsPackageV1,
  operation: CmsAgentPatchOperation,
  index: number,
  changes: CmsAgentPatchChange[]
): CmsAgentPatchReviewError[] {
  if (operation.path !== NAVIGATION_LABEL_PATH) {
    return unsupportedPathError(index, operation.path);
  }

  if (typeof operation.value !== "string") {
    return invalidValueError(index);
  }

  const item = cmsPackage.payload.navigation[0]?.items[0];
  if (!item) {
    return [
      {
        code: "patch.navigation_missing",
        message: "patch.navigation_missing",
        path: `/operations/${index}/path`,
      },
    ];
  }

  const before = item.label;
  item.label = operation.value;
  addChange(changes, operation, before, operation.value);
  return [];
}

function applyStringFieldOperation(
  {
    expectedPath,
    operation,
    setter,
    value,
  }: {
    readonly expectedPath: string;
    readonly operation: CmsAgentPatchOperation;
    readonly setter: (value: string) => void;
    readonly value?: string | undefined;
  },
  index: number,
  changes: CmsAgentPatchChange[]
): CmsAgentPatchReviewError[] {
  if (operation.path !== expectedPath) {
    return unsupportedPathError(index, operation.path);
  }

  if (typeof operation.value !== "string") {
    return invalidValueError(index);
  }

  setter(operation.value);
  addChange(changes, operation, value ?? "", operation.value);
  return [];
}

function applyAddBlockOperation(
  cmsPackage: CmsPackageV1,
  operation: CmsAgentPatchOperation,
  index: number,
  changes: CmsAgentPatchChange[]
): CmsAgentPatchReviewError[] {
  const page = getBuilderPage(cmsPackage);
  if (!page) {
    return missingPageError(index);
  }

  if (!isRecord(operation.value)) {
    return invalidValueError(index);
  }

  const block = operation.value as CmsBlockV1;
  if (typeof block.id !== "string" || typeof block.block_type !== "string") {
    return invalidValueError(index);
  }
  if (page.blocks.some((currentBlock) => currentBlock.id === block.id)) {
    return [
      {
        code: "patch.block_duplicate_id",
        message: "patch.block_duplicate_id",
        path: `/operations/${index}/value/id`,
        params: { id: block.id },
      },
    ];
  }

  const insertIndex = getInsertBlockIndex(operation.path, page.blocks.length);
  if (insertIndex === undefined) {
    return unsupportedPathError(index, operation.path);
  }

  page.blocks.splice(insertIndex, 0, block);
  addChange(changes, operation, null, block);
  return [];
}

function applyUpdateBlockOperation(
  cmsPackage: CmsPackageV1,
  operation: CmsAgentPatchOperation,
  index: number,
  changes: CmsAgentPatchChange[]
): CmsAgentPatchReviewError[] {
  const page = getBuilderPage(cmsPackage);
  if (!page) {
    return missingPageError(index);
  }

  const blockPath = parseBlockPath(operation.path);
  if (!blockPath) {
    return unsupportedPathError(index, operation.path);
  }

  const block = page.blocks[blockPath.index];
  if (!block) {
    return unsupportedPathError(index, operation.path);
  }

  if (!blockPath.field) {
    if (!isRecord(operation.value)) {
      return invalidValueError(index);
    }

    const unsupportedField = Object.keys(operation.value).find(
      (field) => !isAuthorCopyField(field)
    );
    if (unsupportedField) {
      return unsupportedFieldError(
        index,
        unsupportedField,
        "patch.block_field_unsupported"
      );
    }
    const before = { ...block };
    page.blocks[blockPath.index] = { ...block, ...operation.value };
    addChange(changes, operation, before, page.blocks[blockPath.index]);
    return [];
  }

  if (!isAuthorCopyField(blockPath.field)) {
    return unsupportedFieldError(
      index,
      blockPath.field,
      "patch.block_field_unsupported"
    );
  }

  const record = block as Record<string, unknown>;
  const before = record[blockPath.field];
  record[blockPath.field] = operation.value;
  addChange(changes, operation, before, operation.value);
  return [];
}

function applyRemoveBlockOperation(
  cmsPackage: CmsPackageV1,
  operation: CmsAgentPatchOperation,
  index: number,
  changes: CmsAgentPatchChange[]
): CmsAgentPatchReviewError[] {
  const page = getBuilderPage(cmsPackage);
  if (!page) {
    return missingPageError(index);
  }

  const blockPath = parseBlockPath(operation.path);
  if (!blockPath || blockPath.field) {
    return unsupportedPathError(index, operation.path);
  }

  const block = page.blocks[blockPath.index];
  if (!block) {
    return unsupportedPathError(index, operation.path);
  }

  page.blocks.splice(blockPath.index, 1);
  addChange(changes, operation, block, null);
  return [];
}

function applyReorderBlocksOperation(
  cmsPackage: CmsPackageV1,
  operation: CmsAgentPatchOperation,
  index: number,
  changes: CmsAgentPatchChange[]
): CmsAgentPatchReviewError[] {
  const page = getBuilderPage(cmsPackage);
  if (!page) {
    return missingPageError(index);
  }

  if (operation.path !== BLOCKS_PATH || !Array.isArray(operation.value)) {
    return invalidValueError(index);
  }

  const requestedIds = operation.value.filter(
    (value): value is string => typeof value === "string"
  );
  if (requestedIds.length !== operation.value.length) {
    return invalidValueError(index);
  }

  const blockById = new Map(page.blocks.map((block) => [block.id, block]));
  if (
    requestedIds.length !== page.blocks.length ||
    requestedIds.some((id) => !blockById.has(id))
  ) {
    return invalidValueError(index);
  }

  const before = page.blocks.map((block) => block.id);
  page.blocks = requestedIds.map((id) => blockById.get(id) as CmsBlockV1);
  addChange(changes, operation, before, requestedIds);
  return [];
}

function getBuilderPage(cmsPackage: CmsPackageV1): PackagePage | undefined {
  return cmsPackage.payload.pages[0];
}

function getPageMetadataField(path: string): PageMetadataField | undefined {
  if (!path.startsWith(`${PAGE_METADATA_PATH}/`)) {
    return undefined;
  }

  const field = path.slice(PAGE_METADATA_PATH.length + 1);
  if (!field || field.includes("/")) {
    return undefined;
  }

  const unescapedField = unescapePointerSegment(field);
  return isPageMetadataField(unescapedField) ? unescapedField : undefined;
}

function isPageMetadataField(value: string): value is PageMetadataField {
  return (PAGE_METADATA_FIELDS as readonly string[]).includes(value);
}

function isAuthorCopyField(value: string): boolean {
  return AUTHOR_COPY_FIELD_SET.has(value);
}

function getInsertBlockIndex(
  path: string,
  blockCount: number
): number | undefined {
  if (path === `${BLOCKS_PATH}/-`) {
    return blockCount;
  }

  const blockPath = parseBlockPath(path);
  if (!blockPath || blockPath.field || blockPath.index > blockCount) {
    return undefined;
  }

  return blockPath.index;
}

function parseBlockPath(
  path: string
): { readonly index: number; readonly field?: string | undefined } | undefined {
  const match = BLOCK_PATH_PATTERN.exec(path);
  if (!match?.[1]) {
    return undefined;
  }

  const index = Number.parseInt(match[1], 10);
  if (!Number.isSafeInteger(index) || index < 0) {
    return undefined;
  }

  return {
    index,
    ...(match[2] ? { field: unescapePointerSegment(match[2]) } : {}),
  };
}

function addChange(
  changes: CmsAgentPatchChange[],
  operation: CmsAgentPatchOperation,
  before: unknown,
  after: unknown
): void {
  changes.push({
    op: operation.op,
    path: operation.path,
    before,
    after,
    ...(operation.reason ? { reason: operation.reason } : {}),
  });
}

function missingPageError(index: number): CmsAgentPatchReviewError[] {
  return [
    {
      code: "patch.page_missing",
      message: "patch.page_missing",
      path: `/operations/${index}/path`,
    },
  ];
}

function invalidValueError(index: number): CmsAgentPatchReviewError[] {
  return [
    {
      code: "patch.value_invalid",
      message: "patch.value_invalid",
      path: `/operations/${index}/value`,
    },
  ];
}

function unsupportedFieldError(
  index: number,
  field: string,
  code: "patch.metadata_field_unsupported" | "patch.block_field_unsupported"
): CmsAgentPatchReviewError[] {
  return [
    {
      code,
      message: code,
      path: `/operations/${index}/value/${escapePointerSegment(field)}`,
      params: { field },
    },
  ];
}

function unsupportedPathError(
  index: number,
  path: string
): CmsAgentPatchReviewError[] {
  return [
    {
      code: "patch.path_unsupported",
      message: "patch.path_unsupported",
      path: `/operations/${index}/path`,
      params: { path },
    },
  ];
}

function escapePointerSegment(segment: string): string {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}

function unescapePointerSegment(segment: string): string {
  return segment.replaceAll("~1", "/").replaceAll("~0", "~");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
