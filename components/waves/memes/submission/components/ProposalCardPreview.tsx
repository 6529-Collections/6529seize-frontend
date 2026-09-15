"use client";

import { canonicalizeInteractiveMediaUrl } from "../constants/security";
import {
  buildProposalCardDocument,
  type ProposalCardDocumentInput,
} from "@/lib/proposal-card/document";
import { useMemo } from "react";
import { normalizeDecentralizedMediaUrl } from "@/lib/media/decentralized-media";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function ProposalCardPreview(props: ProposalCardDocumentInput) {
  const { mediaUrl, mimeType, title, layout } = props;
  const locale = useBrowserLocale();
  const artworkTitle = title.trim() || t(locale, "memes.proposalFrame.artwork");
  const document = useMemo(() => {
    const isHtml =
      mimeType === "text/html" || mimeType === "application/xhtml+xml";
    const source = isHtml
      ? canonicalizeInteractiveMediaUrl(mediaUrl)
      : (normalizeDecentralizedMediaUrl(mediaUrl) ?? mediaUrl);
    if (!source) return null;
    try {
      return buildProposalCardDocument(
        { mediaUrl: source, mimeType, title: artworkTitle, layout },
        { localPreview: true }
      );
    } catch {
      return null;
    }
  }, [mediaUrl, mimeType, artworkTitle, layout]);

  if (!document)
    return (
      <p role="alert" className="tw-p-4 tw-text-sm tw-text-iron-300">
        {t(locale, "memes.proposalFrame.previewError")}
      </p>
    );
  return (
    <iframe
      title={t(locale, "memes.proposalFrame.preview")}
      srcDoc={document}
      // This document is our fixed, escaped template. Same-origin access lets it
      // display locally selected blob URLs. User HTML lives in a second iframe
      // whose sandbox deliberately omits allow-same-origin.
      sandbox="allow-scripts allow-same-origin"
      allow="fullscreen"
      referrerPolicy="no-referrer"
      className="tw-block tw-h-full tw-w-full tw-flex-1 tw-border-0"
    />
  );
}
