"use client";

import { AuthContext } from "@/components/auth/Auth";
import OverlappingAvatars from "@/components/common/OverlappingAvatars";
import GroupCreateIdentitySelectedItems from "@/components/groups/page/create/config/GroupCreateIdentitySelectedItems";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  AliasEditor,
  getAliasEditorDraft,
  type AliasEditorDraft,
} from "@/components/user/mention-shortcuts/UserPageMentionShortcutsEditor";
import Button from "@/components/utils/button/Button";
import {
  QuickTagsBackButton,
  QuickTagsDeleteConfirmation,
  QuickTagsLoadError,
} from "@/components/user/mention-shortcuts/UserPageMentionShortcutsInlineViews";
import type { MentionAlias, MentionAliasInput } from "@/entities/IMentionAlias";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useMentionAliases } from "@/hooks/useMentionAliases";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { t } from "@/i18n/messages";
import {
  createMentionAlias,
  deleteMentionAlias,
  updateMentionAlias,
} from "@/services/api/mention-aliases-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";

const VISIBLE_QUICK_TAGS = 3;
const LOADING_MESSAGE_KEY = "user.mentionShortcuts.loading";

type QuickTagsView = "summary" | "manage" | "editor";

type AliasEditorSaveVariables = {
  readonly aliasId: string | null;
  readonly input: MentionAliasInput;
};

function getQuickTagsLabelledBy(
  displayedView: QuickTagsView,
  hasDeleteConfirmation: boolean
) {
  if (displayedView === "manage" && hasDeleteConfirmation) {
    return "delete-mention-shortcut-title";
  }
  if (displayedView === "manage") return "quick-tags-manager-title";
  if (displayedView === "editor") return "quick-tag-editor-title";
  return "quick-tags-heading";
}

export default function UserPageMentionShortcuts({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy, setToast } =
    useContext(AuthContext);
  const isMobileScreen = useIsMobileScreen();
  const ownerProfileId = connectedProfile?.id ?? null;
  const isOwner =
    !!profile.id && ownerProfileId === profile.id && !activeProfileProxy;
  const queryClient = useQueryClient();
  const { aliases, isPending, isError, refetch } = useMentionAliases({
    enabled: isOwner,
  });
  const [view, setView] = useState<QuickTagsView>("summary");
  const [editorAlias, setEditorAlias] = useState<MentionAlias | null>(null);
  const [editorDraft, setEditorDraft] = useState<AliasEditorDraft | null>(null);
  const [editorReturnView, setEditorReturnView] =
    useState<Exclude<QuickTagsView, "editor">>("manage");
  const [aliasToDelete, setAliasToDelete] = useState<MentionAlias | null>(null);
  const viewHeadingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusViewHeadingRef = useRef(false);
  const shouldFocusAfterSheetLeaveRef = useRef(false);

  useEffect(() => {
    if (!shouldFocusViewHeadingRef.current) return;
    shouldFocusViewHeadingRef.current = false;
    viewHeadingRef.current?.focus();
  }, [aliasToDelete, view]);

  const requestViewHeadingFocus = () => {
    shouldFocusViewHeadingRef.current = true;
  };

  const changeView = (nextView: QuickTagsView) => {
    requestViewHeadingFocus();
    setAliasToDelete(null);
    setView(nextView);
  };

  const cancelDeletion = () => {
    requestViewHeadingFocus();
    setAliasToDelete(null);
  };

  const startDeleting = (alias: MentionAlias) => {
    requestViewHeadingFocus();
    setAliasToDelete(alias);
  };

  const clearEditorState = () => {
    setEditorAlias(null);
    setEditorDraft(null);
  };

  const editorSaveMutation = useMutation({
    mutationFn: async ({ aliasId, input }: AliasEditorSaveVariables) =>
      aliasId ? updateMentionAlias(aliasId, input) : createMentionAlias(input),
    onSuccess: async (_data, { aliasId }) => {
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.MENTION_ALIASES],
      });
      setToast({
        type: "success",
        message: aliasId
          ? t(locale, "user.mentionShortcuts.updated")
          : t(locale, "user.mentionShortcuts.created"),
      });

      if (isMobileScreen) {
        shouldFocusAfterSheetLeaveRef.current = true;
      } else {
        requestViewHeadingFocus();
        clearEditorState();
      }
      setView("manage");
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: t(locale, "user.mentionShortcuts.saveErrorTitle"),
        details: getToastErrorDetails(
          error,
          t(locale, "user.mentionShortcuts.saveErrorDetails")
        ),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMentionAlias,
    onSuccess: async (_data, deletedAliasId) => {
      const deletedLastAlias =
        aliases.length === 1 && aliases[0]?.id === deletedAliasId;
      await queryClient.invalidateQueries({
        queryKey: [QueryKey.MENTION_ALIASES],
      });
      setToast({
        type: "success",
        message: t(locale, "user.mentionShortcuts.deleted"),
      });
      requestViewHeadingFocus();
      if (deletedLastAlias) {
        setView("summary");
      }
      setAliasToDelete(null);
      clearEditorState();
    },
    onError: (error) =>
      setToast({
        type: "error",
        title: t(locale, "user.mentionShortcuts.deleteErrorTitle"),
        details: getToastErrorDetails(
          error,
          t(locale, "user.mentionShortcuts.deleteErrorDetails")
        ),
      }),
  });

  const sortedAliases = useMemo(
    () => [...aliases].sort((a, b) => a.alias.localeCompare(b.alias)),
    [aliases]
  );
  const visibleAliases = sortedAliases.slice(0, VISIBLE_QUICK_TAGS);
  const hiddenAliasCount = sortedAliases.length - visibleAliases.length;

  const getMemberCountLabel = (count: number) =>
    count === 1
      ? t(locale, "user.mentionShortcuts.memberCount", { count })
      : t(locale, "user.mentionShortcuts.memberCountMany", { count });

  const startEditing = (
    alias: MentionAlias | null,
    returnView: Exclude<QuickTagsView, "editor">
  ) => {
    shouldFocusAfterSheetLeaveRef.current = false;
    setEditorAlias(alias);
    setEditorDraft(getAliasEditorDraft(alias, ownerProfileId));
    setEditorReturnView(returnView);
    setAliasToDelete(null);
    setView("editor");
    if (!isMobileScreen) {
      requestViewHeadingFocus();
    }
  };

  const cancelEditing = () => {
    if (editorSaveMutation.isPending) return;

    shouldFocusAfterSheetLeaveRef.current = false;
    setView(editorReturnView);
    if (!isMobileScreen) {
      requestViewHeadingFocus();
      clearEditorState();
    }
  };

  const saveEditor = (input: MentionAliasInput) => {
    if (editorSaveMutation.isPending) return;
    editorSaveMutation.mutate({
      aliasId: editorAlias?.id ?? null,
      input,
    });
  };

  const handleEditorSheetAfterLeave = () => {
    if (view === "editor") return;

    clearEditorState();
    if (shouldFocusAfterSheetLeaveRef.current) {
      shouldFocusAfterSheetLeaveRef.current = false;
      viewHeadingRef.current?.focus();
    }
  };

  const showSummary = () => {
    setAliasToDelete(null);
    clearEditorState();
    changeView("summary");
  };

  if (!isOwner) {
    return null;
  }

  const displayedView =
    view === "editor" && isMobileScreen ? editorReturnView : view;
  const labelledBy = getQuickTagsLabelledBy(displayedView, !!aliasToDelete);

  let content: ReactNode;
  if (displayedView === "manage" && aliasToDelete) {
    content = (
      <QuickTagsDeleteConfirmation
        alias={aliasToDelete}
        headingRef={viewHeadingRef}
        isPending={deleteMutation.isPending}
        onCancel={cancelDeletion}
        onConfirm={() => deleteMutation.mutate(aliasToDelete.id)}
      />
    );
  } else if (displayedView === "summary") {
    content = (
      <div>
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
          <div className="tw-min-w-0">
            <h3
              ref={viewHeadingRef}
              id="quick-tags-heading"
              tabIndex={-1}
              className="tw-m-0 tw-text-sm tw-font-bold tw-tracking-wide tw-text-iron-50 focus:tw-outline-none"
            >
              {t(locale, "user.mentionShortcuts.title")}
            </h3>
            <p className="tw-mb-0 tw-mt-0.5 tw-max-w-2xl tw-text-sm tw-leading-5 tw-text-iron-400">
              {t(locale, "user.mentionShortcuts.summaryDescription")}
            </p>
          </div>
          {sortedAliases.length > 0 && (
            <button
              type="button"
              onClick={() => changeView("manage")}
              className="tw-min-h-11 tw-shrink-0 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-primary-300 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-primary-400 sm:tw-min-h-6 sm:tw-py-0"
            >
              {t(locale, "user.mentionShortcuts.manage")}
            </button>
          )}
        </div>

        <div className="tw-mt-2 tw-flex tw-min-w-0 tw-flex-wrap tw-gap-2">
          {isPending && (
            <p
              aria-live="polite"
              className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-400"
            >
              {t(locale, LOADING_MESSAGE_KEY)}
            </p>
          )}
          {isError && <QuickTagsLoadError onRetry={() => void refetch()} />}
          {!isPending && !isError && sortedAliases.length === 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => startEditing(null, "summary")}
              className="tw-min-h-11 sm:tw-min-h-9"
            >
              <PlusIcon aria-hidden="true" className="-tw-ml-0.5 tw-size-4" />
              {t(locale, "user.mentionShortcuts.new")}
            </Button>
          )}
          {!isPending &&
            !isError &&
            visibleAliases.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => startEditing(item, "summary")}
                className="group tw-inline-flex tw-min-h-11 tw-min-w-0 tw-max-w-full tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/70 tw-px-3 tw-py-2.5 tw-text-left tw-text-sm tw-font-medium tw-text-iron-100 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-bg-iron-900 sm:tw-min-h-9 sm:tw-max-w-[18rem] sm:tw-py-1.5"
              >
                <span className="tw-min-w-0 tw-truncate tw-text-primary-300">
                  @{item.alias}
                </span>
                {item.members.length > 0 && (
                  <span className="tw-inline-flex tw-shrink-0">
                    <OverlappingAvatars
                      items={item.members.map((member) => ({
                        key: member.profile_id,
                        pfpUrl: member.pfp,
                        ariaLabel: member.handle,
                        fallback: member.handle.charAt(0).toUpperCase(),
                        title: member.handle,
                      }))}
                      size="xs"
                      maxCount={5}
                    />
                  </span>
                )}
                <span className="tw-shrink-0 tw-whitespace-nowrap tw-text-iron-400">
                  {getMemberCountLabel(item.members.length)}
                </span>
              </button>
            ))}
          {!isPending && !isError && hiddenAliasCount > 0 && (
            <button
              type="button"
              onClick={() => changeView("manage")}
              className="tw-min-h-11 tw-shrink-0 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/70 tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white sm:tw-min-h-9"
            >
              {t(locale, "user.mentionShortcuts.more", {
                count: hiddenAliasCount,
              })}
            </button>
          )}
        </div>
      </div>
    );
  } else if (displayedView === "manage") {
    content = (
      <div data-testid="quick-tags-manager">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
            <QuickTagsBackButton
              label={t(locale, "user.mentionShortcuts.back")}
              onClick={showSummary}
            />
            <h3
              ref={viewHeadingRef}
              id="quick-tags-manager-title"
              tabIndex={-1}
              className="tw-m-0 tw-truncate tw-text-sm tw-font-bold tw-tracking-wide tw-text-iron-50 focus:tw-outline-none"
            >
              {t(locale, "user.mentionShortcuts.title")}
            </h3>
          </div>
          <button
            type="button"
            aria-label={t(locale, "user.mentionShortcuts.new")}
            onClick={() => startEditing(null, "manage")}
            className="tw-min-h-11 tw-shrink-0 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-primary-300 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-primary-400 sm:tw-min-h-9"
          >
            {t(locale, "user.mentionShortcuts.newShort")}
          </button>
        </div>
        <p className="tw-mb-0 tw-mt-1 tw-max-w-2xl tw-text-sm tw-leading-5 tw-text-iron-400">
          {t(locale, "user.mentionShortcuts.description")}
        </p>

        <div
          className="tw-mt-3 tw-max-h-80 tw-overflow-y-auto tw-overflow-x-hidden tw-pr-2 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700 desktop-hover:hover:tw-scrollbar-thumb-iron-500"
          style={{ scrollbarGutter: "stable" }}
        >
          <div className="tw-space-y-1">
            {isPending && (
              <p
                aria-live="polite"
                className="tw-m-0 tw-py-3 tw-text-sm tw-text-iron-400"
              >
                {t(locale, LOADING_MESSAGE_KEY)}
              </p>
            )}
            {isError && <QuickTagsLoadError onRetry={() => void refetch()} />}
            {!isPending && !isError && sortedAliases.length === 0 && (
              <div className="tw-rounded-xl tw-border tw-border-dashed tw-border-white/10 tw-p-4 tw-text-center tw-text-sm tw-text-iron-400">
                {t(locale, "user.mentionShortcuts.empty")}
              </div>
            )}
            {sortedAliases.map((item) => (
              <article
                key={item.id}
                className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-py-3 last:tw-border-b-0"
              >
                <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
                  <h3
                    id={`quick-tag-${item.id}`}
                    className="tw-m-0 tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold tw-text-primary-300"
                  >
                    @{item.alias}
                  </h3>
                  <div className="tw-flex tw-flex-none tw-items-center tw-gap-1">
                    <button
                      type="button"
                      aria-label={t(locale, "user.mentionShortcuts.editAction")}
                      aria-describedby={`quick-tag-${item.id}`}
                      onClick={() => startEditing(item, "manage")}
                      className="tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-500 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-white/5 desktop-hover:hover:tw-text-primary-300 sm:tw-size-9"
                    >
                      <PencilSquareIcon
                        aria-hidden="true"
                        className="tw-size-4"
                      />
                    </button>
                    <button
                      type="button"
                      aria-label={t(
                        locale,
                        "user.mentionShortcuts.deleteAction"
                      )}
                      aria-describedby={`quick-tag-${item.id}`}
                      onClick={() => startDeleting(item)}
                      disabled={deleteMutation.isPending}
                      aria-busy={deleteMutation.isPending}
                      className="tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-500 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-red disabled:tw-opacity-50 desktop-hover:hover:tw-bg-red/10 desktop-hover:hover:tw-text-red sm:tw-size-9"
                    >
                      <TrashIcon aria-hidden="true" className="tw-size-4" />
                    </button>
                  </div>
                </div>

                <GroupCreateIdentitySelectedItems
                  selectedIdentities={item.members.map((member) => ({
                    wallet: member.profile_id,
                    handle: member.handle,
                    pfp: member.pfp,
                  }))}
                  variant="quickTag"
                  handlePrefix="@"
                />
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  } else {
    content = editorDraft ? (
      <AliasEditor
        key={editorAlias?.id ?? "new"}
        backLabel={t(locale, "user.mentionShortcuts.back")}
        draft={editorDraft}
        headingRef={viewHeadingRef}
        isEditing={editorAlias !== null}
        isMobileSheet={false}
        isSaving={editorSaveMutation.isPending}
        onCancel={cancelEditing}
        onDraftChange={setEditorDraft}
        onSave={saveEditor}
        ownerProfileId={ownerProfileId}
      />
    ) : null;
  }

  return (
    <>
      <section
        aria-labelledby={labelledBy}
        className="tw-relative tw-rounded-xl tw-border tw-border-solid tw-border-white/15 tw-bg-black tw-px-4 tw-py-3 tw-shadow-2xl"
        data-testid="quick-tags-section"
      >
        {content}
      </section>

      <MobileWrapperDialog
        title={
          editorAlias
            ? t(locale, "user.mentionShortcuts.edit")
            : t(locale, "user.mentionShortcuts.create")
        }
        isOpen={isMobileScreen && view === "editor" && editorDraft !== null}
        onClose={cancelEditing}
        onBack={cancelEditing}
        onAfterLeave={handleEditorSheetAfterLeave}
        backLabel={t(locale, "user.mentionShortcuts.back")}
        dismissible={!editorSaveMutation.isPending}
        enableDragToClose
        showScrollbar
        tall
        headerClassName="tw-pb-2"
      >
        {editorDraft && (
          <div className="tw-px-4 sm:tw-px-6">
            <AliasEditor
              key={editorAlias?.id ?? "new"}
              backLabel={t(locale, "user.mentionShortcuts.back")}
              draft={editorDraft}
              isEditing={editorAlias !== null}
              isMobileSheet
              isSaving={editorSaveMutation.isPending}
              onCancel={cancelEditing}
              onDraftChange={setEditorDraft}
              onSave={saveEditor}
              ownerProfileId={ownerProfileId}
            />
          </div>
        )}
      </MobileWrapperDialog>
    </>
  );
}
