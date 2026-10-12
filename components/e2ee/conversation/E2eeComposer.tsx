"use client";

import {
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { getMemberName } from "../e2eeFormat";
import { E2eeRenewalBanner } from "../gate/E2eeRenewalBanner";
import { E2eeAvatar } from "../ui/E2eeAvatar";
import { collectMentionIds } from "./e2eeMentions";
import {
  addComposerFiles,
  type ComposerError,
  E2EE_MAX_TEXT_LENGTH,
  handleMentionKey,
  isSendKey,
  useMentionPicker,
} from "./useE2eeComposerParts";

const TEXTAREA_MAX_HEIGHT_PX = 200;
const ICON_BUTTON =
  "tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400";

function FilePreview({
  file,
  onRemove,
}: {
  readonly file: File;
  readonly onRemove: () => void;
}) {
  const locale = useBrowserLocale();
  const isImage = file.type.startsWith("image/");
  const url = useMemo(
    () => (isImage ? URL.createObjectURL(file) : null),
    [file, isImage]
  );
  useEffect(
    () => () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    },
    [url]
  );

  return (
    <li className="tw-relative tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-1.5 tw-pr-9">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob: preview of a file that has not been uploaded; next/image cannot optimize it.
        <img
          src={url}
          alt=""
          className="tw-size-12 tw-flex-shrink-0 tw-rounded-md tw-object-cover"
        />
      ) : null}
      <span className="tw-max-w-[10rem] tw-truncate tw-text-xs tw-text-iron-200">
        {file.name}
      </span>
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
    </li>
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

function ComposerFooter({
  locale,
  hintId,
  error,
}: {
  readonly locale: SupportedLocale;
  readonly hintId: string;
  readonly error: ComposerError | null;
}) {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-px-4 tw-pb-2">
      <p
        id={hintId}
        className="tw-m-0 tw-hidden tw-text-[11px] tw-text-iron-500 sm:tw-block"
      >
        {t(locale, "e2ee.composer.hint")}
      </p>
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
}: E2eeComposerProps) {
  const locale = useBrowserLocale();
  const listboxId = useId();
  const hintId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<readonly File[]>([]);
  const [error, setError] = useState<ComposerError | null>(null);
  const [loadedEditId, setLoadedEditId] = useState<string | null>(null);
  const mentions = useMentionPicker(conversation.members, selfProfileId);

  // Entering edit mode loads the message text once per edited message.
  const editId = editing?.id ?? null;
  if (editId !== loadedEditId) {
    setLoadedEditId(editId);
    setText(editing ? editing.text : "");
    setFiles([]);
  }

  // Reply and edit move focus to the composer.
  const focusKey = editId ?? replyTo?.id ?? null;
  useEffect(() => {
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
    element.style.height = `${Math.min(element.scrollHeight, TEXTAREA_MAX_HEIGHT_PX)}px`;
  }, [text]);

  const isEmpty = text.trim().length === 0 && files.length === 0;
  const tooLong = text.length > E2EE_MAX_TEXT_LENGTH;

  const pickMention = (member: E2eeMember) => {
    const next = mentions.apply(text, member);
    if (!next) {
      return;
    }
    setText(next.text);
    globalThis.requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(next.caret, next.caret);
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
    } else if (!isEmpty) {
      await submitNew(trimmed);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (handleMentionKey(event, mentions, pickMention)) {
      return;
    }
    if (isSendKey(event)) {
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

  const onFilesChosen = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(event.target.files ?? []);
    event.target.value = "";
    const result = addComposerFiles(files, chosen);
    setFiles(result.files);
    setError(result.error);
  };

  if (disabledReasonKey) {
    return (
      <div className="tw-flex-shrink-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-pb-[env(safe-area-inset-bottom,0px)]">
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
    <div className="tw-flex-shrink-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-pb-[env(safe-area-inset-bottom,0px)]">
      <ComposerTopBars
        locale={locale}
        showRenewal={isEmpty && !editing}
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
      <div className="tw-relative tw-flex tw-items-end tw-gap-2 tw-px-3 tw-py-2">
        {mentions.open ? (
          <MentionList
            id={listboxId}
            candidates={mentions.candidates}
            activeIndex={mentions.activeIndex}
            onPick={pickMention}
            label={t(locale, "e2ee.composer.mentions.label")}
          />
        ) : null}
        {editing ? null : (
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
              title={t(locale, "e2ee.composer.attach")}
              className={ICON_BUTTON}
            >
              <PaperClipIcon aria-hidden="true" className="tw-size-5" />
            </button>
          </>
        )}
        <label className="tw-sr-only" htmlFor={`${listboxId}-input`}>
          {t(locale, "e2ee.composer.label")}
        </label>
        <textarea
          id={`${listboxId}-input`}
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onSelect={(event) =>
            mentions.update(
              event.currentTarget.value,
              event.currentTarget.selectionStart
            )
          }
          onBlur={mentions.close}
          placeholder={t(locale, "e2ee.composer.placeholder")}
          aria-describedby={hintId}
          aria-invalid={tooLong ? true : undefined}
          aria-autocomplete="list"
          aria-controls={mentions.open ? listboxId : undefined}
          aria-activedescendant={
            mentions.open ? `${listboxId}-${mentions.activeIndex}` : undefined
          }
          className="tw-min-h-10 tw-flex-1 tw-resize-none tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-leading-6 tw-text-iron-100 placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={isEmpty || tooLong}
          aria-label={t(
            locale,
            editing ? "e2ee.composer.saveEdit" : "e2ee.composer.send"
          )}
          className="tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-text-white hover:tw-bg-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-bg-iron-800 disabled:tw-text-iron-500"
        >
          <PaperAirplaneIcon aria-hidden="true" className="tw-size-5" />
        </button>
      </div>
      <ComposerFooter locale={locale} hintId={hintId} error={error} />
    </div>
  );
}
