"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ArtworkDocumentationInline,
  type ArtworkDocumentationInlineHandle,
} from "@/components/artwork-documentation/ArtworkDocumentationInline";
import { useArtworkDocumentationAccess } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export interface MemesSubmissionDocumentationHandle {
  onDropSubmitted(dropId: string): void;
  prepareClose(): Promise<boolean>;
}

interface Props {
  readonly waveId: string;
  readonly title: string;
  readonly description: string;
  readonly preferredCredit?: string | undefined;
  readonly visible: boolean;
  readonly onStarted: () => void;
  readonly onDiscardClose: () => void;
}

const linkMessages = {
  idle: "artworkDocumentation.submission.linkPending",
  linking: "artworkDocumentation.submission.linkPending",
  linked: "artworkDocumentation.submission.linked",
  failed: "artworkDocumentation.submission.linkFailed",
} as const;

const MemesSubmissionDocumentation = forwardRef<
  MemesSubmissionDocumentationHandle,
  Props
>(
  (
    {
      waveId,
      title,
      description,
      preferredCredit,
      visible,
      onStarted,
      onDiscardClose,
    },
    ref
  ) => {
    const access = useArtworkDocumentationAccess();
    const locale = useBrowserLocale();
    const inlineRef = useRef<ArtworkDocumentationInlineHandle>(null);
    const contextId = useRef<string | null>(null);
    const submittedDropId = useRef<string | null>(null);
    const [linkStatus, setLinkStatus] = useState<
      "idle" | "linking" | "linked" | "failed"
    >("idle");
    const [closeFailed, setCloseFailed] = useState(false);
    const attempt = useRef<string | null>(null);
    const mounted = useRef(false);
    const linking = useRef(false);
    useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
      };
    }, []);

    const link = useCallback(async () => {
      const dropId = submittedDropId.current;
      const inline = inlineRef.current;
      if (!contextId.current || !dropId || !inline || linking.current) return;
      linking.current = true;
      setLinkStatus("linking");
      try {
        const result = await inline.onDropSubmitted(dropId);
        if (mounted.current) setLinkStatus(result.linked ? "linked" : "failed");
      } catch {
        if (mounted.current) setLinkStatus("failed");
      } finally {
        linking.current = false;
      }
    }, []);

    const tryLink = useCallback(() => {
      if (!contextId.current || !submittedDropId.current || !inlineRef.current)
        return;
      const key = `${contextId.current}:${submittedDropId.current}`;
      if (attempt.current === key) return;
      attempt.current = key;
      void link();
    }, [link]);

    const receiveInlineHandle = useCallback(
      (handle: ArtworkDocumentationInlineHandle | null) => {
        inlineRef.current = handle;
        if (handle) tryLink();
      },
      [tryLink]
    );

    useImperativeHandle(
      ref,
      () => ({
        onDropSubmitted: (dropId) => {
          submittedDropId.current = dropId;
          tryLink();
        },
        prepareClose: async () => {
          const saved =
            (await inlineRef.current?.flush().catch(() => false)) ?? true;
          if (mounted.current) setCloseFailed(!saved);
          return saved;
        },
      }),
      [tryLink]
    );

    const profile =
      access.profiles.find((item) => item.wave_id === waveId) ??
      (access.selfServiceEnabled
        ? access.profiles.find(
            (item) => item.profile_id === "stream_artwork_basic_v1"
          )
        : undefined);
    if (!access.enabled || !profile) return null;

    return (
      <div
        hidden={!visible && !closeFailed}
        className="tw-max-h-[45vh] tw-shrink-0 tw-overflow-y-auto tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 md:tw-px-8"
      >
        <div className="tw-mx-auto tw-max-w-4xl tw-space-y-3">
          {linkStatus !== "idle" && (
            <div
              role="status"
              aria-live="polite"
              className="tw-text-sm tw-leading-6 tw-text-iron-200"
            >
              {t(locale, linkMessages[linkStatus])}
            </div>
          )}
          {linkStatus === "failed" && (
            <button
              type="button"
              onClick={() => {
                void link();
              }}
              className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
            >
              {t(locale, "artworkDocumentation.submission.retryLink")}
            </button>
          )}
          {closeFailed && (
            <div
              role="alert"
              className="tw-space-y-2 tw-text-sm tw-text-iron-200"
            >
              <p>{t(locale, "artworkDocumentation.submission.closeFailed")}</p>
              <button
                type="button"
                onClick={onDiscardClose}
                className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-4 tw-font-semibold tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              >
                {t(locale, "artworkDocumentation.submission.discardClose")}
              </button>
            </div>
          )}
          <ArtworkDocumentationInline
            ref={receiveInlineHandle}
            profileId={profile.profile_id}
            profileVersion={profile.version}
            programId={profile.program_id ?? undefined}
            sourceProposal={{ title, description, preferredCredit }}
            onContextCreated={(created) => {
              contextId.current = created.id;
              onStarted();
              tryLink();
            }}
          />
        </div>
      </div>
    );
  }
);

MemesSubmissionDocumentation.displayName = "MemesSubmissionDocumentation";

export default MemesSubmissionDocumentation;
