"use client";

import { useAuth } from "@/components/auth/Auth";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiContentModerationReportStatus } from "@/generated/models/ApiContentModerationReportStatus";
import {
  getDropReportStatusOverride,
  subscribeToContentModerationState,
} from "@/services/content-moderation/content-moderation-state";
import { useCallback, useSyncExternalStore } from "react";

export const useContentModerationReportStatus = (
  drop: Pick<ApiDrop, "id" | "viewer_context">
): ApiContentModerationReportStatus | null => {
  const { connectedProfile } = useAuth();
  const viewerProfileId = connectedProfile?.id ?? null;
  const getOverride = useCallback(
    () =>
      viewerProfileId
        ? getDropReportStatusOverride(viewerProfileId, drop.id)
        : undefined,
    [drop.id, viewerProfileId]
  );
  const override = useSyncExternalStore(
    subscribeToContentModerationState,
    getOverride,
    () => undefined
  );
  if (override !== undefined) return override;
  const persisted = drop.viewer_context?.report_status;
  return Object.values(ApiContentModerationReportStatus).includes(
    persisted as ApiContentModerationReportStatus
  )
    ? (persisted as ApiContentModerationReportStatus)
    : null;
};
