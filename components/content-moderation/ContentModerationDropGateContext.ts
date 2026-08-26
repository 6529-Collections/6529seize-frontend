"use client";

import type { ApiContentModerationReportStatus } from "@/generated/models/ApiContentModerationReportStatus";
import type { ApiDropModerationStatus } from "@/generated/models/ApiDropModerationStatus";
import { createContext, useContext } from "react";

interface ContentModerationDropGateContextValue {
  readonly setOptimisticHidden: (hidden: boolean) => () => void;
  readonly reportStatus: ApiContentModerationReportStatus | null;
  readonly globalModerationStatus: ApiDropModerationStatus | null;
  readonly openReportDetails: () => void;
}

export const ContentModerationDropGateContext =
  createContext<ContentModerationDropGateContextValue | null>(null);

export const useContentModerationDropGateContext = () =>
  useContext(ContentModerationDropGateContext);
