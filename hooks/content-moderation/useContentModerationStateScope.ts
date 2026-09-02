import { clearContentModerationState } from "@/services/content-moderation/content-moderation-state";
import { useEffect } from "react";

export const useContentModerationStateScope = (
  connectedProfileId: string | null | undefined
) => {
  useEffect(() => {
    clearContentModerationState();
  }, [connectedProfileId]);
};
