"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { getEncryptedMessagesRoute } from "@/helpers/navigation.helpers";
import { useE2eeConversation, type UseE2eeResult } from "@/hooks/e2ee/useE2ee";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  E2eeConversation,
  E2eeEngine,
  E2eeEngineExt,
  E2eeMessage,
} from "@/lib/e2ee/types";
import { E2eeNewDeviceNotice } from "../devices/E2eeNewDeviceNotice";
import { getE2eeActionErrorKey } from "../e2eeErrors";
import { getScrollBehavior } from "../e2eeMotion";
import { E2eeLoadingState, E2eeRouteGate } from "../gate/E2eeRouteGate";
import { E2eeConversationInfo } from "../info/E2eeConversationInfo";
import { E2eeConfirmDialog } from "../ui/E2eeConfirmDialog";
import {
  E2eeCenteredMessage,
  E2eePageShell,
  useE2eeViewStyle,
} from "../ui/E2eePageShell";
import { E2eeComposer } from "./E2eeComposer";
import { E2eeConversationBanners } from "./E2eeConversationBanners";
import { E2eeConversationHeader } from "./E2eeConversationHeader";
import { type E2eeMessageActions, getMessageDomId } from "./E2eeMessageItem";
import { E2eeReportDialog } from "./E2eeReportDialog";
import { E2eeSearchPanel } from "./E2eeSearchPanel";
import { E2eeTimeline } from "./E2eeTimeline";

const hasOpenConversationHint = (
  engine: E2eeEngine
): engine is E2eeEngine & Pick<E2eeEngineExt, "setOpenConversation"> =>
  typeof (engine as Partial<E2eeEngineExt>).setOpenConversation === "function";

/** Tells the engine which chat is on screen (faster polling) and marks reads. */
function useOpenConversation(
  engine: E2eeEngine,
  g: string,
  hasConversation: boolean,
  lastSeq: number
) {
  useEffect(() => {
    if (!hasOpenConversationHint(engine)) {
      return;
    }
    engine.setOpenConversation(g);
    return () => engine.setOpenConversation(null);
  }, [engine, g]);

  useEffect(() => {
    if (!hasConversation) {
      return;
    }
    const markRead = () => {
      if (document.visibilityState === "visible") {
        engine.markRead(g);
      }
    };
    markRead();
    document.addEventListener("visibilitychange", markRead);
    return () => document.removeEventListener("visibilitychange", markRead);
  }, [engine, g, hasConversation, lastSeq]);
}

/** When a chat isn't in local state yet, sync once before calling it missing. */
function useInitialSync(engine: E2eeEngine, missing: boolean): boolean {
  const [synced, setSynced] = useState(false);
  useEffect(() => {
    if (!missing || synced) {
      return;
    }
    const run = { cancelled: false };
    const syncOnce = async () => {
      try {
        await engine.sync();
      } catch {
        // A failed sync still settles: the chat is shown as not found.
      }
      if (!run.cancelled) {
        setSynced(true);
      }
    };
    void syncOnce();
    return () => {
      run.cancelled = true;
    };
  }, [engine, missing, synced]);
  return synced;
}

const getDisabledReasonKey = (
  conversation: E2eeConversation
): MessageKey | null => {
  if (conversation.status !== "active") {
    return "e2ee.composer.unavailable";
  }
  if (conversation.delayed) {
    return "e2ee.composer.blocked";
  }
  return null;
};

interface ConversationScreenProps {
  readonly g: string;
  readonly e2ee: UseE2eeResult & { readonly engine: E2eeEngine };
}

function ConversationScreen({ g, e2ee }: ConversationScreenProps) {
  const locale = useBrowserLocale();
  const style = useE2eeViewStyle();
  const searchPanelId = useId();
  const { engine, profileId } = e2ee;
  const { conversation, messages } = useE2eeConversation(g);
  const lastSeq = messages.at(-1)?.seq ?? 0;
  useOpenConversation(engine, g, conversation !== null, lastSeq);
  const synced = useInitialSync(engine, conversation === null);

  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<E2eeMessage | null>(null);
  const [reportTarget, setReportTarget] = useState<E2eeMessage | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [actionErrorKey, setActionErrorKey] = useState<MessageKey | null>(null);
  const [reported, setReported] = useState(false);

  const actions = useMemo<E2eeMessageActions>(() => {
    const react = async (
      message: E2eeMessage,
      reaction: string,
      on: boolean
    ) => {
      setActionErrorKey(null);
      try {
        await engine.react(message.g, message.id, reaction, on);
      } catch (error) {
        setActionErrorKey(
          getE2eeActionErrorKey(error, "e2ee.message.actionFailed")
        );
      }
    };
    return {
      // The composer moves focus to itself for reply and edit.
      onReply: (message) => {
        setEditingId(null);
        setReplyToId(message.id);
      },
      onEdit: (message) => {
        setReplyToId(null);
        setEditingId(message.id);
      },
      onDelete: (message) => setDeleteTarget(message),
      onReport: (message) => setReportTarget(message),
      onReact: (message, reaction, on) => {
        void react(message, reaction, on);
      },
      onJumpTo: (id) => {
        const element = document.getElementById(getMessageDomId(id));
        if (!element) {
          return;
        }
        element.scrollIntoView({
          block: "center",
          behavior: getScrollBehavior(),
        });
        element.focus({ preventScroll: true });
      },
    };
  }, [engine]);

  if (!conversation) {
    return (
      <E2eePageShell
        title={t(locale, "e2ee.title")}
        backHref={getEncryptedMessagesRoute()}
        backLabel={t(locale, "e2ee.conversation.back")}
      >
        {synced ? (
          <E2eeCenteredMessage
            title={t(locale, "e2ee.conversation.notFound.title")}
            body={t(locale, "e2ee.conversation.notFound.body")}
          />
        ) : (
          <E2eeLoadingState label={t(locale, "e2ee.conversation.loading")} />
        )}
      </E2eePageShell>
    );
  }

  const replyTo = replyToId
    ? (messages.find((m) => m.id === replyToId) ?? null)
    : null;
  const editing = editingId
    ? (messages.find((m) => m.id === editingId) ?? null)
    : null;
  const canAct = conversation.status === "active";

  return (
    <div
      style={style}
      className="tw-flex tw-min-h-0 tw-w-full tw-flex-col tw-bg-black"
    >
      <E2eeConversationHeader
        conversation={conversation}
        selfProfileId={profileId}
        searchOpen={searchOpen}
        searchPanelId={searchPanelId}
        onToggleSearch={() => setSearchOpen((open) => !open)}
        onOpenInfo={() => setInfoOpen(true)}
      />
      {searchOpen ? (
        <div id={searchPanelId}>
          <E2eeSearchPanel
            engine={engine}
            conversation={conversation}
            selfProfileId={profileId}
            onClose={() => setSearchOpen(false)}
            onJumpTo={actions.onJumpTo}
          />
        </div>
      ) : null}
      <E2eeConversationBanners
        conversation={conversation}
        engine={engine}
        onCompareSafetyCodes={() => setInfoOpen(true)}
      />
      <E2eeNewDeviceNotice className="tw-flex-shrink-0 tw-px-4 tw-pt-2" />
      <E2eeTimeline
        conversation={conversation}
        messages={messages}
        engine={engine}
        selfProfileId={profileId}
        canAct={canAct}
        actions={actions}
      />
      <div role="status" className="tw-sr-only">
        {reported ? t(locale, "e2ee.report.success") : null}
      </div>
      {actionErrorKey ? (
        <p
          role="alert"
          className="tw-m-0 tw-flex-shrink-0 tw-px-4 tw-py-1 tw-text-xs tw-text-rose-300"
        >
          {t(locale, actionErrorKey)}
        </p>
      ) : null}
      <E2eeComposer
        conversation={conversation}
        engine={engine}
        selfProfileId={profileId}
        replyTo={replyTo}
        onCancelReply={() => setReplyToId(null)}
        editing={editing}
        onCancelEdit={() => setEditingId(null)}
        disabledReasonKey={getDisabledReasonKey(conversation)}
      />

      <E2eeConversationInfo
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        conversation={conversation}
        engine={engine}
        selfProfileId={profileId}
      />
      <E2eeReportDialog
        engine={engine}
        g={conversation.g}
        message={reportTarget}
        onClose={() => setReportTarget(null)}
        onReported={() => setReported(true)}
      />
      <E2eeConfirmDialog
        open={deleteTarget !== null}
        title={t(locale, "e2ee.message.deleteConfirmTitle")}
        body={t(locale, "e2ee.message.deleteConfirmBody")}
        confirmLabel={t(locale, "e2ee.message.deleteConfirm")}
        errorFallbackKey="e2ee.message.actionFailed"
        onConfirm={async () => {
          if (deleteTarget) {
            await engine.remove(conversation.g, deleteTarget.id);
          }
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/** `/messages/encrypted/[group]`: one encrypted chat. */
export function E2eeConversationView({ g }: { readonly g: string }) {
  const locale = useBrowserLocale();
  return (
    <E2eeRouteGate
      shell={(content) => (
        <E2eePageShell
          title={t(locale, "e2ee.title")}
          backHref={getEncryptedMessagesRoute()}
          backLabel={t(locale, "e2ee.conversation.back")}
        >
          {content}
        </E2eePageShell>
      )}
    >
      {(e2ee) => {
        const { engine } = e2ee;
        if (!engine) {
          return (
            <E2eeLoadingState label={t(locale, "e2ee.conversation.loading")} />
          );
        }
        return <ConversationScreen key={g} g={g} e2ee={{ ...e2ee, engine }} />;
      }}
    </E2eeRouteGate>
  );
}
