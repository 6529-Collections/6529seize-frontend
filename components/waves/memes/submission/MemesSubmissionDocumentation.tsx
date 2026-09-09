"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import ArtworkDocumentationInline, {
  type ArtworkDocumentationInlineHandle,
} from "@/components/artwork-documentation/ArtworkDocumentationInline";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
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
>(function MemesSubmissionDocumentation(
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
) {
  const access = useArtworkDocumentationAccess();
  const locale = useBrowserLocale();
  const inlineRef = useRef<ArtworkDocumentationInlineHandle>(null);
  const [context, setContext] = useState<ApiArtworkDocumentationContext | null>(
    null
  );
  const [submittedDropId, setSubmittedDropId] = useState<string | null>(null);
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
    if (!context || !submittedDropId || linking.current) return;
    linking.current = true;
    setLinkStatus("linking");
    try {
      const result = await inlineRef.current?.onDropSubmitted(submittedDropId);
      if (mounted.current) setLinkStatus(result?.linked ? "linked" : "failed");
    } catch {
      if (mounted.current) setLinkStatus("failed");
    } finally {
      linking.current = false;
    }
  }, [context, submittedDropId]);

  useEffect(() => {
    if (!context || !submittedDropId) return;
    const key = `${context.id}:${submittedDropId}`;
    if (attempt.current === key) return;
    attempt.current = key;
    void link();
  }, [context, submittedDropId, link]);

  useImperativeHandle(
    ref,
    () => ({
      onDropSubmitted: setSubmittedDropId,
      prepareClose: async () => {
        const saved =
          (await inlineRef.current?.flush().catch(() => false)) ?? true;
        if (mounted.current) setCloseFailed(!saved);
        return saved;
      },
    }),
    []
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
          ref={inlineRef}
          profileId={profile.profile_id}
          profileVersion={profile.version}
          programId={profile.program_id ?? undefined}
          sourceProposal={{ title, description, preferredCredit }}
          onContextCreated={(created) => {
            setContext(created);
            onStarted();
          }}
        />
      </div>
    </div>
  );
});

export default MemesSubmissionDocumentation;
