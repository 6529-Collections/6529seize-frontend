"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
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
import { findMember, getMemberName } from "../e2eeFormat";
import { setE2eeChatMuted, useMutedE2eeChats } from "../e2eeMutedChats";
import { getScrollBehavior } from "../e2eeMotion";
import { E2eeLoadingState, E2eeRouteGate } from "../gate/E2eeRouteGate";
import { E2eeConversationInfo } from "../info/E2eeConversationInfo";
import { E2eeBanner } from "../ui/E2eeBanner";
import { E2eeConfirmDialog } from "../ui/E2eeConfirmDialog";
import {
  E2eeCenteredMessage,
  E2eePageShell,
  useE2eeViewStyle,
} from "../ui/E2eePageShell";
import { E2eeBlockDialog } from "./E2eeBlockDialog";
import { E2eeComposer } from "./E2eeComposer";
import { E2eeConversationBanners } from "./E2eeConversationBanners";
import { E2eeUntrustedDeviceBanners } from "./E2eeUntrustedDeviceBanners";
import { E2eeConversationHeader } from "./E2eeConversationHeader";
import { type E2eeMessageActions, getMessageDomId } from "./E2eeMessageItem";
import { E2eeReportDialog } from "./E2eeReportDialog";
import { E2eeSearchPanel } from "./E2eeSearchPanel";
import { E2eeTimeline } from "./E2eeTimeline";
import {
  type E2eeDroppedMessage,
  useE2eeDroppedMessage,
} from "./useE2eeDroppedMessage";

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
  const composerInputId = useId();
  const { engine, profileId } = e2ee;
  const { conversation, messages } = useE2eeConversation(g);
  const lastSeq = messages.at(-1)?.seq ?? 0;
  useOpenConversation(engine, g, conversation !== null, lastSeq);
  const synced = useInitialSync(engine, conversation === null);

  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<E2eeMessage | null>(null);
  const [reportTarget, setReportTarget] = useState<E2eeMessage | null>(null);
  const [blockSender, setBlockSender] = useState<E2eeMessage | null>(null);
  const { setToast } = useAuth();
  const { dropped, dismiss: dismissDropped } = useE2eeDroppedMessage(
    messages,
    profileId
  );
  const [restoredDraft, setRestoredDraft] = useState<E2eeDroppedMessage | null>(
    null
  );
  const muted = useMutedE2eeChats(profileId).has(g);
  const [infoOpen, setInfoOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [actionErrorKey, setActionErrorKey] = useState<MessageKey | null>(null);

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
      onBlock: (message) => setBlockSender(message),
      onToggleMute: () => {
        if (profileId) {
          setE2eeChatMuted(profileId, g, !muted);
        }
      },
      muted,
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
  }, [engine, g, muted, profileId]);

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
      <E2eeUntrustedDeviceBanners
        conversation={conversation}
        engine={engine}
        selfProfileId={profileId}
      />
      <E2eeNewDeviceNotice className="tw-flex-shrink-0 tw-px-4 tw-pt-2" />
      {getDisabledReasonKey(conversation) === null ? (
        // One stop past the whole timeline for keyboard users.
        <button
          type="button"
          onClick={() => document.getElementById(composerInputId)?.focus()}
          className="tw-sr-only focus:tw-not-sr-only focus:tw-mx-4 focus:tw-my-1 focus:tw-self-start focus:tw-rounded-lg focus:tw-border-0 focus:tw-bg-iron-900 focus:tw-px-3 focus:tw-py-1.5 focus:tw-text-xs focus:tw-font-semibold focus:tw-text-iron-100 focus:tw-outline focus:tw-outline-2 focus:tw-outline-primary-400"
        >
          {t(locale, "e2ee.conversation.skipToComposer")}
        </button>
      ) : null}
      <E2eeTimeline
        conversation={conversation}
        messages={messages}
        engine={engine}
        selfProfileId={profileId}
        canAct={canAct}
        actions={actions}
      />
      {actionErrorKey ? (
        <p
          role="alert"
          className="tw-m-0 tw-flex-shrink-0 tw-px-4 tw-py-1 tw-text-xs tw-text-rose-300"
        >
          {t(locale, actionErrorKey)}
        </p>
      ) : null}
      {dropped ? (
        <div className="tw-flex-shrink-0 tw-px-4 tw-pb-2">
          <E2eeBanner
            tone="danger"
            action={
              <>
                {dropped.text ? (
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => {
                      setRestoredDraft(dropped);
                      dismissDropped();
                    }}
                  >
                    {t(locale, "e2ee.composer.dropped.restore")}
                  </Button>
                ) : null}
                <Button variant="secondary" size="xs" onClick={dismissDropped}>
                  {t(locale, "e2ee.action.dismiss")}
                </Button>
              </>
            }
          >
            <span>{t(locale, "e2ee.composer.dropped.body")}</span>
            {dropped.text ? (
              <span className="tw-mt-0.5 tw-block tw-truncate tw-text-rose-200/80">
                {t(locale, "e2ee.composer.dropped.quote", {
                  text: dropped.text.replaceAll(/\s+/g, " ").trim(),
                })}
              </span>
            ) : null}
          </E2eeBanner>
        </div>
      ) : null}
      <E2eeComposer
        restoredDraft={restoredDraft}
        inputId={composerInputId}
        conversation={conversation}
        engine={engine}
        selfProfileId={profileId}
        replyTo={replyTo}
        onCancelReply={() => setReplyToId(null)}
        editing={editing}
        onCancelEdit={() => setEditingId(null)}
        disabledReasonKey={getDisabledReasonKey(conversation)}
        attachmentsEnabled={e2ee.attachmentsEnabled}
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
        onReported={() =>
          setToast({
            type: "success",
            message: t(locale, "e2ee.report.success"),
          })
        }
      />
      <E2eeBlockDialog
        target={
          blockSender?.senderProfileId
            ? {
                profileId: blockSender.senderProfileId,
                handle:
                  findMember(conversation.members, blockSender.senderProfileId)
                    ?.handle ?? null,
                name: getMemberName(
                  locale,
                  conversation.members,
                  blockSender.senderProfileId,
                  profileId
                ),
              }
            : null
        }
        onClose={() => setBlockSender(null)}
        onBlocked={(name) =>
          setToast({
            type: "success",
            message: t(locale, "e2ee.block.done", { name }),
          })
        }
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
