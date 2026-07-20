"use client";

import { createContext, useContext, type ReactNode } from "react";

type DraftVisibilityGroupId = string | null | undefined;

const MentionSearchScopeContext =
  createContext<DraftVisibilityGroupId>(undefined);

export function MentionSearchScopeProvider({
  children,
  visibilityGroupId,
}: {
  readonly children: ReactNode;
  readonly visibilityGroupId: string | null;
}) {
  return (
    <MentionSearchScopeContext.Provider value={visibilityGroupId}>
      {children}
    </MentionSearchScopeContext.Provider>
  );
}

export function useDraftMentionVisibilityGroupId(): DraftVisibilityGroupId {
  return useContext(MentionSearchScopeContext);
}
