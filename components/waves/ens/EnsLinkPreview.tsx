"use client";

import { useEffect, useState } from "react";

import { LinkPreviewCardLayout } from "@/components/waves/OpenGraphPreview";
import { fetchLinkPreview } from "@/services/api/link-preview-api";

import EnsPreviewCard from "./EnsPreviewCard";
import { isEnsPreview, type EnsPreview } from "./types";

interface EnsLinkPreviewProps {
  readonly href: string;
}

type PreviewState =
  | { readonly type: "loading" }
  | { readonly type: "success"; readonly data: EnsPreview }
  | { readonly type: "error"; readonly error: Error };

export default function EnsLinkPreview({ href }: EnsLinkPreviewProps) {
  const [state, setState] = useState<PreviewState>({ type: "loading" });

  useEffect(() => {
    let active = true;

    setState({ type: "loading" });

    fetchLinkPreview(href)
      .then((response) => {
        if (!active) {
          return;
        }

        if (isEnsPreview(response)) {
          setState({ type: "success", data: response });
          return;
        }

        setState({
          type: "error",
          error: new Error("ENS preview unavailable"),
        });
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setState({
          type: "error",
          error: error instanceof Error ? error : new Error("Failed to load ENS preview"),
        });
      });

    return () => {
      active = false;
    };
  }, [href]);

  if (state.type === "error") {
    throw state.error;
  }

  if (state.type === "success") {
    return (
      <LinkPreviewCardLayout href={href}>
        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
          <EnsPreviewCard preview={state.data} />
        </div>
      </LinkPreviewCardLayout>
    );
  }

  return (
    <LinkPreviewCardLayout href={href}>
      <div
        className="tw-animate-pulse tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4"
        data-testid="ens-preview-loading">
        <div className="tw-flex tw-flex-col tw-gap-y-3">
          <div className="tw-h-6 tw-w-1/3 tw-rounded tw-bg-iron-800/60" />
          <div className="tw-h-4 tw-w-2/3 tw-rounded tw-bg-iron-800/40" />
          <div className="tw-h-3 tw-w-full tw-rounded tw-bg-iron-800/30" />
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
}
