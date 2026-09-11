import type { SolidityDefinitionIndexEntry } from "@/lib/public-review/solidityReferenceTypes";
import type { PublicReviewCodeSelection } from "@/services/api/public-review/types";

export function getStreamDefinitionFeedbackSelection(
  definition: SolidityDefinitionIndexEntry
): PublicReviewCodeSelection {
  return {
    kind: "code",
    path: definition.sourcePath,
    sourceSha256: definition.range.sourceSha256,
    lineStart: definition.range.lineStart,
    lineEnd: definition.range.lineEnd,
    contract: definition.name,
    declaration: definition.id,
    snippetSha256: definition.range.snippetSha256,
  };
}

export function getStreamDeclarationFeedbackSelection({
  contract,
  declaration,
  sourcePath,
}: {
  readonly contract?: string | undefined;
  readonly declaration: {
    readonly canonicalSignature: string | null;
    readonly displaySignature: string;
    readonly range: {
      readonly lineEnd: number;
      readonly lineStart: number;
      readonly snippetSha256: string;
      readonly sourceSha256: string;
    };
  };
  readonly sourcePath: string;
}): PublicReviewCodeSelection {
  return {
    kind: "code",
    path: sourcePath,
    sourceSha256: declaration.range.sourceSha256,
    lineStart: declaration.range.lineStart,
    lineEnd: declaration.range.lineEnd,
    ...(contract ? { contract } : {}),
    declaration: declaration.canonicalSignature ?? declaration.displaySignature,
    snippetSha256: declaration.range.snippetSha256,
  };
}

export function getStreamSourceFeedbackSelection({
  lineCount,
  path,
  sourceSha256,
}: {
  readonly lineCount: number;
  readonly path: string;
  readonly sourceSha256: string;
}): PublicReviewCodeSelection {
  return {
    kind: "code",
    path,
    sourceSha256,
    lineStart: 1,
    lineEnd: lineCount,
  };
}
