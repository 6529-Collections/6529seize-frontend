import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import { ApiArtworkDocumentationOperationOpEnum } from "@/generated/models/ApiArtworkDocumentationOperation";
import type { PendingEdit } from "./draft-controller";

/** Reading-only overlay. Save state and publication filtering remain separate. */
export function documentationDraftRecord(
  context: ApiArtworkDocumentationContext,
  edits: readonly PendingEdit[]
): ApiArtworkDocumentationContext {
  const modules = { ...context.modules };
  for (const { moduleId, operation } of edits) {
    const module = modules[moduleId];
    if (!module) continue;
    const answers = { ...module.answers };
    if (operation.op === ApiArtworkDocumentationOperationOpEnum.Unset) {
      delete answers[operation.field];
    } else if (operation.answer) {
      answers[operation.field] = operation.answer;
    }
    modules[moduleId] = { ...module, answers };
  }
  return { ...context, modules };
}
