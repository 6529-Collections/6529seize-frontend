"use client";

import type { ApiContentModerationReportStatus } from "@/generated/models/ApiContentModerationReportStatus";
import type { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { createContext, useContext } from "react";

interface ContentModerationDropGateContextValue {
  readonly setOptimisticHidden: (hidden: boolean) => () => void;
  readonly reportStatus: ApiContentModerationReportStatus | null;
  readonly globalModerationStatus: ApiDropModerationStatus | null;
  readonly canViewGlobalModeratedContent: boolean;
  readonly openReportDetails: () => void;
  readonly revealedPersonalModeration: {
    readonly hideAgain: () => void;
    readonly persist: () => void;
    readonly persistLabel: string;
    readonly persistTooltip: string;
    readonly persistPending: boolean;
  } | null;
}

export const ContentModerationDropGateContext =
  createContext<ContentModerationDropGateContextValue | null>(null);

export const useContentModerationDropGateContext = () =>
  useContext(ContentModerationDropGateContext);
