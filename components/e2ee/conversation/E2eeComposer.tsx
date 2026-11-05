"use client";

import {
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import useCapacitor from "@/hooks/useCapacitor";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import { useBlurOnNativeKeyboardDismiss } from "@/hooks/useBlurOnNativeKeyboardDismiss";
import {
  COMPOSER_INPUT_CLASS_NAME,
  COMPOSER_MAX_HEIGHT_PX,
  getNativeComposerStyle,
} from "@/components/waves/composerPresentation";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  E2eeConversation,
  E2eeEngine,
  E2eeMember,
  E2eeMessage,
} from "@/lib/e2ee/types";
import { getE2eeActionErrorKey } from "../e2eeErrors";
import { getMemberName, tCount } from "../e2eeFormat";
import { E2eeRenewalBanner } from "../gate/E2eeRenewalBanner";
import { E2eeAvatar } from "../ui/E2eeAvatar";
import DropActionTooltip from "@/components/waves/drops/DropActionTooltip";
import { E2eeComposerEmojiPicker } from "./E2eeEmojiPicker";
import { collectMentionIds } from "./e2eeMentions";
import {
  addComposerFiles,
  type ComposerError,
  type ComposerText,
  E2EE_MAX_TEXT_LENGTH,
  handleMentionKey,
  isSendKey,
  isComposerEmpty,
  isEditLastMessageKey,
  type PasteNotice,
  useMentionPicker,
  usePastedImages,
} from "./useE2eeComposerParts";
import { isSafeInlineImageMime } from "@/lib/e2ee/media";

const ICON_BUTTON =
  "tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

/** Thumbnails are drawn at twice their 48 px box for sharp displays. */
const THUMBNAIL_PX = 96;

/** Draws `image` centered and cropped to fill the canvas (object-fit: cover). */
function drawCover(canvas: HTMLCanvasElement, image: ImageBitmap): void {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }
  const scale = Math.max(
    canvas.width / image.width,
    canvas.height / image.height
  );
  const width = image.width * scale;
  const height = image.height * scale;
  context.drawImage(
    image,
    (canvas.width - width) / 2,
    (canvas.height - height) / 2,
    width,
    height
  );
}

function FilePreview({
  file,
  onRemove,
}: {
  readonly file: File;
  /** Absent while the file is being encrypted and uploaded. */
  readonly onRemove?: (() => void) | undefined;
}) {
  const locale = useBrowserLocale();
  // Raster images only, the same rule as received attachments. The preview
  // is decoded and painted on a canvas, so the picked file never becomes a
  // URL in the DOM.
  const isImage = isSafeInlineImageMime(file.type);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!isImage || !canvas || typeof createImageBitmap !== "function") {
      return;
    }
    let cancelled = false;
    createImageBitmap(file)
      .then((decoded) => {
        if (!cancelled) {
          drawCover(canvas, decoded);
        }
        decoded.close();
      })
      .catch(() => {
        // An undecodable image keeps an empty thumbnail box.
      });
    return () => {
      cancelled = true;
    };
  }, [file, isImage]);

  return (
    <li
      className={`tw-relative tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-1.5 ${
        onRemove ? "tw-pr-9" : "tw-pr-3 tw-opacity-70"
      }`}
    >
      {isImage ? (
        <canvas
          ref={canvasRef}
          width={THUMBNAIL_PX}
          height={THUMBNAIL_PX}
          aria-hidden="true"
          className="tw-size-12 tw-flex-shrink-0 tw-rounded-md tw-bg-iron-800"
        />
      ) : null}
      <span className="tw-max-w-[10rem] tw-truncate tw-text-xs tw-text-iron-200">
        {file.name}
      </span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={t(locale, "e2ee.composer.removeAttachment", {
            name: file.name,
          })}
          className="tw-absolute tw-right-1 tw-top-1/2 tw-flex tw-size-7 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          <XMarkIcon aria-hidden="true" className="tw-size-4" />
        </button>
      ) : null}
    </li>
  );
}

/** The files of a message being encrypted and uploaded, before it appears. */
function UploadingFiles({
  locale,
  files,
}: {
  readonly locale: SupportedLocale;
  readonly files: readonly File[];
}) {
  return (
    <div className="tw-px-3 tw-pt-2">
      <output className="tw-mb-1.5 tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-iron-300">
        <CircleLoader />
        {tCount(
          locale,
          {
            one: "e2ee.composer.uploading.one",
            other: "e2ee.composer.uploading.other",
          },
          files.length
        )}
      </output>
      <ul className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0">
        {files.map((file) => (
          <FilePreview
            key={`${file.name}:${file.size}:${file.lastModified}`}
            file={file}
          />
        ))}
      </ul>
    </div>
  );
}

function ContextBar({
  label,
  detail,
  cancelLabel,
  onCancel,
}: {
  readonly label: string;
  readonly detail?: string | undefined;
  readonly cancelLabel: string;
  readonly onCancel: () => void;
}) {
  return (
    <div className="tw-flex tw-items-center tw-gap-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-3 tw-py-1.5">
      <div className="tw-min-w-0 tw-flex-1">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-text-iron-200">
          {label}
        </p>
        {detail ? (
          <p className="tw-m-0 tw-truncate tw-text-xs tw-text-iron-400">
            {detail}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onCancel}
        aria-label={cancelLabel}
        className="tw-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <XMarkIcon aria-hidden="true" className="tw-size-4" />
      </button>
    </div>
  );
}

function MentionList({
  id,
  candidates,
  activeIndex,
  onPick,
  label,
}: {
  readonly id: string;
  readonly candidates: readonly E2eeMember[];
  readonly activeIndex: number;
  readonly onPick: (member: E2eeMember) => void;
  readonly label: string;
}) {
  return (
    <ul
      id={id}
      role="listbox"
      aria-label={label}
      className="tw-absolute tw-bottom-full tw-left-2 tw-right-2 tw-z-20 tw-m-0 tw-mb-1 tw-max-h-56 tw-list-none tw-overflow-y-auto tw-rounded-xl tw-bg-iron-950 tw-p-1 tw-shadow-2xl tw-ring-1 tw-ring-iron-700"
    >
      {candidates.map((member, index) => (
        <li
          key={member.profileId}
          id={`${id}-${index}`}
          role="option"
          aria-selected={index === activeIndex}
          // Keep focus in the textarea while choosing with the pointer.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(member)}
          // Arrow keys and Enter are handled by the textarea (active
          // descendant); this covers assistive tech that sends keys here.
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onPick(member);
            }
          }}
          className={`tw-flex tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-lg tw-px-2 tw-py-1.5 tw-text-sm ${
            index === activeIndex
              ? "tw-bg-iron-800 tw-text-iron-50"
              : "tw-text-iron-200"
          }`}
        >
          <E2eeAvatar pfp={member.pfp} name={member.handle ?? ""} size="xs" />
          <span className="tw-truncate">@{member.handle}</span>
        </li>
      ))}
    </ul>
  );
}

const snippetOf = (message: E2eeMessage): string =>
  message.text.replaceAll(/\s+/g, " ").trim().slice(0, 120);

function ComposerTopBars({
  locale,
  showRenewal,
  replyTo,
  replyName,
  onCancelReply,
  editing,
  onCancelEdit,
  files,
  onRemoveFile,
}: {
  readonly locale: SupportedLocale;
  readonly showRenewal: boolean;
  readonly replyTo: E2eeMessage | null;
  readonly replyName: string;
  readonly onCancelReply: () => void;
  readonly editing: boolean;
  readonly onCancelEdit: () => void;
  readonly files: readonly File[];
  readonly onRemoveFile: (index: number) => void;
}) {
  return (
    <>
      {showRenewal ? (
        // Renewal asks for a signature only while the user is not typing (8.8).
        <E2eeRenewalBanner className="tw-mx-3 tw-mt-2" />
      ) : null}
      {replyTo ? (
        <ContextBar
          label={t(locale, "e2ee.composer.replyingTo", { name: replyName })}
          detail={snippetOf(replyTo)}
          cancelLabel={t(locale, "e2ee.composer.cancelReply")}
          onCancel={onCancelReply}
        />
      ) : null}
      {editing ? (
        <ContextBar
          label={t(locale, "e2ee.composer.editing")}
          cancelLabel={t(locale, "e2ee.composer.cancelEdit")}
          onCancel={onCancelEdit}
        />
      ) : null}
      {files.length > 0 ? (
        <ul
          aria-label={t(locale, "e2ee.composer.attachments")}
          className="tw-m-0 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-px-3 tw-pt-2"
        >
          {files.map((file, index) => (
            <FilePreview
              key={`${file.name}:${file.size}:${file.lastModified}`}
              file={file}
              onRemove={() => onRemoveFile(index)}
            />
          ))}
        </ul>
      ) : null}
    </>
  );
}

/**
 * Announces images taken from a paste. They become attachments instead of
 * text in the box, so a screen reader would otherwise say nothing.
 */
function PastedImagesStatus({
  locale,
  notice,
}: {
  readonly locale: SupportedLocale;
  readonly notice: PasteNotice | null;
}) {
  return (
    <output className="tw-sr-only">
      {notice ? (
        // A new node per paste, so the same count is announced again.
        <span key={notice.id}>
          {tCount(
            locale,
            {
              one: "e2ee.composer.pastedImages.one",
              other: "e2ee.composer.pastedImages.other",
            },
            notice.count
          )}
        </span>
      ) : null}
    </output>
  );
}

function ComposerFooter({
  locale,
  error,
}: {
  readonly locale: SupportedLocale;
  readonly error: ComposerError | null;
}) {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-px-4 tw-pb-2">
      {error ? (
        <p role="alert" className="tw-m-0 tw-text-xs tw-text-rose-300">
          {t(locale, error.key, error.params)}
        </p>
      ) : null}
    </div>
  );
}

interface E2eeComposerProps {
  readonly conversation: E2eeConversation;
  readonly engine: E2eeEngine;
  readonly selfProfileId: string | null;
  readonly replyTo: E2eeMessage | null;
  readonly onCancelReply: () => void;
  readonly editing: E2eeMessage | null;
  readonly onCancelEdit: () => void;
  /** Why sending is blocked (paused change, inactive chat), if it is. */
  readonly disabledReasonKey: MessageKey | null;
  /** Server switch: without it there is no attach control at all. */
  readonly attachmentsEnabled: boolean;
  readonly onRequestEditLastMessage?: (() => boolean) | undefined;
  /** Id for the textarea, so a skip link can move focus to it. */
  readonly inputId?: string | undefined;
  /** A refused message whose text goes back into the box once. */
  readonly restoredDraft?:
    | { readonly id: string; readonly text: string }
    | null
    | undefined;
}

/**
 * Loads text into the box once per source: the message being edited (which
 * also clears picked files) or a refused message coming back to resend.
 */
function useLoadedComposerText(
  editing: E2eeMessage | null,
  restoredDraft: { readonly id: string; readonly text: string } | null,
  setText: (text: string) => void,
  clearFiles: () => void
): { readonly editId: string | null; readonly draftId: string | null } {
  const [loadedEditId, setLoadedEditId] = useState<string | null>(null);
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);
  const editId = editing?.id ?? null;
  if (editId !== loadedEditId) {
    setLoadedEditId(editId);
    setText(editing ? editing.text : "");
    clearFiles();
  }
  const draftId = restoredDraft?.id ?? null;
  if (draftId !== loadedDraftId) {
    setLoadedDraftId(draftId);
    if (restoredDraft) {
      setText(restoredDraft.text);
    }
  }
  return { editId, draftId };
}

function getComposerContainerClassName(isApp: boolean): string {
  const bottomPadding = isApp ? "" : "tw-pb-[env(safe-area-inset-bottom,0px)]";
  return `tw-flex-shrink-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950 ${bottomPadding}`;
}

/**
 * Encrypted composer: text with @mentions, reply and edit modes, image
 * previews for attachments, Enter to send. Sends optimistically: the engine
 * shows the message as pending until it is sequenced.
 */
export function E2eeComposer({
  conversation,
  engine,
  selfProfileId,
  replyTo,
  onCancelReply,
  editing,
  onCancelEdit,
  disabledReasonKey,
  attachmentsEnabled,
  restoredDraft = null,
  onRequestEditLastMessage,
  inputId,
}: E2eeComposerProps) {
  const locale = useBrowserLocale();
  const { isCapacitor } = useCapacitor();
  const isMobile = useIsMobileDevice();
  const listboxId = useId();
  const textareaId = inputId ?? `${listboxId}-input`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const blurInput = useCallback(() => textareaRef.current?.blur(), []);
  useBlurOnNativeKeyboardDismiss(blurInput, isCapacitor);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const emojiSelection = useRef({ start: 0, end: 0 });
  const [files, setFiles] = useState<readonly File[]>([]);
  const [error, setError] = useState<ComposerError | null>(null);
  // Files of the message being encrypted and uploaded right now.
  const [uploading, setUploading] = useState<readonly File[]>([]);
  const mentions = useMentionPicker(conversation.members, selfProfileId);

  // Attachments switched off server-side drop anything already picked.
  if (!attachmentsEnabled && files.length > 0) {
    setFiles([]);
  }

  const { editId, draftId } = useLoadedComposerText(
    editing,
    restoredDraft,
    setText,
    () => setFiles([])
  );

  // Reply, edit and a restored draft move focus to the composer.
  const focusKey = editId ?? replyTo?.id ?? draftId ?? null;
  useEffect(() => {
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-event-handler -- The reply or edit is chosen in the message list; focus moves here once the composer has rendered it.
    if (focusKey !== null) {
      textareaRef.current?.focus();
    }
  }, [focusKey]);

  useLayoutEffect(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, COMPOSER_MAX_HEIGHT_PX)}px`;
  }, [text]);

  const isEmpty = isComposerEmpty(text, files);
  const containerClassName = getComposerContainerClassName(isCapacitor);
  const isUploading = uploading.length > 0;
  const tooLong = text.length > E2EE_MAX_TEXT_LENGTH;
  // Editing changes only the text, and the server can switch attachments off.
  const canAttach = editing === null && attachmentsEnabled;

  /** Puts `next.text` in the box with the caret at `next.caret`. */
  const placeText = (next: ComposerText) => {
    setText(next.text);
    globalThis.requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(next.caret, next.caret);
    });
  };

  const pickMention = (member: E2eeMember) => {
    const next = mentions.apply(text, member);
    if (next) {
      placeText(next);
    }
  };

  const pickEmoji = (emoji: string) => {
    const { start, end } = emojiSelection.current;
    const next = {
      text: text.slice(0, start) + emoji + text.slice(end),
      caret: start + emoji.length,
    };
    setText(next.text);
    mentions.update(next.text, next.caret);
    // Let the dialog release its focus trap and restore its trigger first.
    globalThis.requestAnimationFrame(() => {
      globalThis.requestAnimationFrame(() => {
        textareaRef.current?.focus({ preventScroll: true });
        textareaRef.current?.setSelectionRange(next.caret, next.caret);
      });
    });
  };

  const submitEdit = async (message: E2eeMessage, trimmed: string) => {
    if (!trimmed || trimmed === message.text) {
      onCancelEdit();
      return;
    }
    try {
      await engine.edit(conversation.g, message.id, trimmed);
      onCancelEdit();
    } catch (caught) {
      setError({
        key: getE2eeActionErrorKey(caught, "e2ee.message.actionFailed"),
        params: {},
      });
    }
  };

  const submitNew = async (trimmed: string) => {
    const pendingFiles = [...files];
    const reply = replyTo?.id ?? null;
    const mentioned = collectMentionIds(trimmed, conversation.members).filter(
      (id) => id !== selfProfileId
    );
    setText("");
    setFiles([]);
    onCancelReply();
    setUploading(pendingFiles);
    try {
      await engine.send(conversation.g, {
        text: trimmed,
        mentions: mentioned,
        reply,
        files: pendingFiles,
      });
    } catch (caught) {
      setText(trimmed);
      setFiles(pendingFiles);
      setError({
        key: getE2eeActionErrorKey(caught, "e2ee.composer.sendFailed"),
        params: {},
      });
    } finally {
      setUploading([]);
    }
  };

  const submit = async () => {
    const trimmed = text.trim();
    if (tooLong) {
      setError({
        key: "e2ee.composer.tooLong",
        params: { max: formatInteger(locale, E2EE_MAX_TEXT_LENGTH) },
      });
      return;
    }
    if (editing) {
      await submitEdit(editing, trimmed);
    } else if (!isEmpty && !isUploading) {
      await submitNew(trimmed);
    }
  };

  const canEditLastMessage =
    !text.trim() && files.length === 0 && !editing && !replyTo && !isUploading;

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (handleMentionKey(event, mentions, pickMention)) {
      return;
    }
    if (event.nativeEvent.isComposing) {
      return;
    }
    if (
      canEditLastMessage &&
      isEditLastMessageKey(event) &&
      onRequestEditLastMessage?.()
    ) {
      event.preventDefault();
      return;
    }
    if (!isMobile && !isCapacitor && isSendKey(event)) {
      event.preventDefault();
      void submit();
    } else if (event.key === "Escape") {
      if (editing) {
        onCancelEdit();
      } else if (replyTo) {
        onCancelReply();
      }
    }
  };

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
    setError(null);
    mentions.update(event.target.value, event.target.selectionStart);
  };

  const addFiles = (incoming: readonly File[]) => {
    const result = addComposerFiles(files, incoming);
    setFiles(result.files);
    setError(result.error);
    return result.files;
  };

  const onFilesChosen = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const paste = usePastedImages({
    canAttach,
    files,
    addFiles,
    onText: (next) => {
      placeText(next);
      mentions.update(next.text, next.caret);
    },
  });

  if (disabledReasonKey) {
    return (
      <div
        className={containerClassName}
        style={getNativeComposerStyle(isCapacitor)}
      >
        <p className="tw-m-0 tw-px-4 tw-py-3 tw-text-sm tw-text-iron-400">
          {t(locale, disabledReasonKey)}
        </p>
      </div>
    );
  }

  const replyName = replyTo
    ? getMemberName(
        locale,
        conversation.members,
        replyTo.senderProfileId,
        selfProfileId
      )
    : "";

  return (
    <div
      className={containerClassName}
      style={getNativeComposerStyle(isCapacitor)}
    >
      <ComposerTopBars
        locale={locale}
        showRenewal={isEmpty && !editing && !isUploading}
        replyTo={editing ? null : replyTo}
        replyName={replyName}
        onCancelReply={onCancelReply}
        editing={editing !== null}
        onCancelEdit={onCancelEdit}
        files={files}
        onRemoveFile={(index) =>
          setFiles((current) => current.filter((_, i) => i !== index))
        }
      />
      {isUploading ? (
        <UploadingFiles locale={locale} files={uploading} />
      ) : null}
      <div className="tw-relative tw-flex tw-items-end tw-gap-1 tw-px-2 tw-py-2 sm:tw-gap-2 sm:tw-px-3">
        {mentions.open ? (
          <MentionList
            id={listboxId}
            candidates={mentions.candidates}
            activeIndex={mentions.activeIndex}
            onPick={pickMention}
            label={t(locale, "e2ee.composer.mentions.label")}
          />
        ) : null}
        {canAttach ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              tabIndex={-1}
              aria-hidden="true"
              className="tw-hidden"
              onChange={onFilesChosen}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label={t(locale, "e2ee.composer.attach")}
              className={ICON_BUTTON}
            >
              <PaperClipIcon aria-hidden="true" className="tw-size-5" />
            </button>
          </>
        ) : null}
        <div className="tw-relative tw-min-w-0 tw-flex-1">
          <label className="tw-sr-only" htmlFor={textareaId}>
            {t(locale, "e2ee.composer.label")}
          </label>
          <textarea
            id={textareaId}
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onPaste={paste.onPaste}
            onSelect={(event) =>
              mentions.update(
                event.currentTarget.value,
                event.currentTarget.selectionStart
              )
            }
            onBlur={mentions.close}
            placeholder={t(locale, "e2ee.composer.placeholder")}
            aria-invalid={tooLong ? true : undefined}
            aria-autocomplete="list"
            aria-controls={mentions.open ? listboxId : undefined}
            aria-activedescendant={
              mentions.open ? `${listboxId}-${mentions.activeIndex}` : undefined
            }
            className={COMPOSER_INPUT_CLASS_NAME}
          />
          <E2eeComposerEmojiPicker
            onOpen={() => {
              const input = textareaRef.current;
              emojiSelection.current = {
                start: input?.selectionStart ?? text.length,
                end: input?.selectionEnd ?? text.length,
              };
              mentions.close();
            }}
            onSelect={pickEmoji}
          />
        </div>
        <DropActionTooltip content={t(locale, "e2ee.composer.hint")}>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={isEmpty || tooLong || isUploading}
            aria-label={t(
              locale,
              editing ? "e2ee.composer.saveEdit" : "e2ee.composer.send"
            )}
            className="tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-text-white hover:tw-bg-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-bg-iron-800 disabled:tw-text-iron-500"
          >
            <PaperAirplaneIcon aria-hidden="true" className="tw-size-5" />
          </button>
        </DropActionTooltip>
      </div>
      <PastedImagesStatus locale={locale} notice={paste.notice} />
      {error ? <ComposerFooter locale={locale} error={error} /> : null}
    </div>
  );
}
