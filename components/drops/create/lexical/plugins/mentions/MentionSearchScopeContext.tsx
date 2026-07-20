"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

export type DraftMentionSearchScope =
  | { readonly kind: "disabled" }
  | { readonly kind: "public" }
  | { readonly kind: "group"; readonly visibilityGroupId: string };

const DISABLED_DRAFT_MENTION_SEARCH_SCOPE: DraftMentionSearchScope = {
  kind: "disabled",
};

const MentionSearchScopeContext = createContext<DraftMentionSearchScope>(
  DISABLED_DRAFT_MENTION_SEARCH_SCOPE
);

export function MentionSearchScopeProvider({
  children,
  visibilityGroupId,
}: {
  readonly children: ReactNode;
  readonly visibilityGroupId: string | null;
}) {
  const scope = useMemo<DraftMentionSearchScope>(
    () =>
      visibilityGroupId === null
        ? { kind: "public" }
        : { kind: "group", visibilityGroupId },
    [visibilityGroupId]
  );

  return (
    <MentionSearchScopeContext.Provider value={scope}>
      {children}
    </MentionSearchScopeContext.Provider>
  );
}

export function useDraftMentionSearchScope(): DraftMentionSearchScope {
  return useContext(MentionSearchScopeContext);
}
