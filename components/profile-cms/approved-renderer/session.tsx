"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface ApprovedContactDraft {
  readonly name?: string;
  readonly replyTo?: string;
  readonly subject?: string;
  readonly message?: string;
}

interface ApprovedSession {
  readonly subject: string | null;
  readonly setSubject: (value: string | null) => void;
  readonly drafts: Readonly<Record<string, ApprovedContactDraft>>;
  readonly updateDraft: (id: string, patch: ApprovedContactDraft) => void;
}

const SessionContext = createContext<ApprovedSession | null>(null);
const DRAFT_CACHE_LIMIT = 24;
const visitorDrafts = new Map<string, Record<string, ApprovedContactDraft>>();

function rememberedDrafts(scope: string) {
  return typeof window === "undefined" ? {} : (visitorDrafts.get(scope) ?? {});
}

function remember(scope: string, drafts: Record<string, ApprovedContactDraft>) {
  if (typeof window === "undefined") return;
  visitorDrafts.delete(scope);
  visitorDrafts.set(scope, drafts);
  if (visitorDrafts.size > DRAFT_CACHE_LIMIT) {
    const oldest = visitorDrafts.keys().next().value;
    if (oldest !== undefined) visitorDrafts.delete(oldest);
  }
}

/** Visitor correspondence stays in memory, outside the editable publication. */
export function ApprovedSessionProvider({
  children,
  scope,
}: {
  readonly children: ReactNode;
  readonly scope: string;
}) {
  const [subject, setSubject] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ApprovedContactDraft>>(
    () => rememberedDrafts(scope)
  );
  return (
    <SessionContext
      value={{
        subject,
        setSubject,
        drafts,
        updateDraft: (id, patch) => {
          const next = { ...drafts, [id]: { ...drafts[id], ...patch } };
          const keys = Object.keys(next);
          if (keys.length > DRAFT_CACHE_LIMIT && keys[0]) delete next[keys[0]];
          remember(scope, next);
          setDrafts(next);
        },
      }}
    >
      {children}
    </SessionContext>
  );
}

export function useApprovedSession() {
  return useContext(SessionContext);
}
