import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { CompetitionIdentity } from "@/services/api/competitions-api";
import { competitionScope } from "@/services/api/competitions-api";

export const competitionSubmissionReceiptKey = (
  identity: CompetitionIdentity,
  viewer: string | null,
  entryId: string
) =>
  [
    QueryKey.COMPETITION_RESOURCE,
    { ...competitionScope(identity), viewer },
    "submission-receipt",
    entryId,
  ] as const;
