"use client";

import { useEffect, useState } from "react";

import OpenGraphPreview from "./OpenGraphPreview";
import GoogleWorkspaceCard from "./GoogleWorkspaceCard";
import {
  fetchLinkPreview,
  type GoogleWorkspaceLinkPreview,
} from "@/services/api/link-preview-api";

interface GoogleWorkspacePreviewProps {
  readonly href: string;
}

type PreviewState =
  | { readonly type: "loading" }
  | { readonly type: "success"; readonly data: GoogleWorkspaceLinkPreview }
  | { readonly type: "error"; readonly error: Error };

const isGoogleWorkspacePreview = (
  response: Awaited<ReturnType<typeof fetchLinkPreview>>
): response is GoogleWorkspaceLinkPreview => {
  if (!response || typeof response !== "object") {
    return false;
  }
  const type = (response as { readonly type?: unknown }).type;
  return typeof type === "string" && type.startsWith("google.");
};

export default function GoogleWorkspacePreview({
  href,
}: GoogleWorkspacePreviewProps) {
  const [state, setState] = useState<PreviewState>({ type: "loading" });

  useEffect(() => {
    let active = true;

    setState({ type: "loading" });

    fetchLinkPreview(href)
      .then((response) => {
        if (!active) {
          return;
        }

        if (isGoogleWorkspacePreview(response)) {
          setState({ type: "success", data: response });
          return;
        }

        setState({
          type: "error",
          error: new Error("Google workspace preview data unavailable"),
        });
      })
      .catch((error) => {
        if (active) {
          setState({ type: "error", error: error instanceof Error ? error : new Error("Failed to load Google workspace preview") });
        }
      });

    return () => {
      active = false;
    };
  }, [href]);

  if (state.type === "error") {
    throw state.error;
  }

  if (state.type === "success") {
    return <GoogleWorkspaceCard href={href} data={state.data} />;
  }

  return <OpenGraphPreview href={href} preview={undefined} />;
}
