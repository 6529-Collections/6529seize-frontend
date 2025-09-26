"use client";

import { useEffect, useState } from "react";

import OpenGraphPreview from "./OpenGraphPreview";
import CompoundCard, { toCompoundResponse } from "./compound/CompoundCard";
import type { CompoundResponse } from "./compound/types";
import { fetchLinkPreview } from "@/services/api/link-preview-api";

interface CompoundPreviewProps {
  readonly href: string;
}

type PreviewState =
  | { readonly type: "loading" }
  | { readonly type: "success"; readonly data: CompoundResponse }
  | { readonly type: "error"; readonly error: Error };

export default function CompoundPreview({ href }: CompoundPreviewProps) {
  const [state, setState] = useState<PreviewState>({ type: "loading" });

  useEffect(() => {
    let active = true;

    setState({ type: "loading" });

    fetchLinkPreview(href)
      .then((response) => {
        if (!active) {
          return;
        }

        const compound = toCompoundResponse(response);
        if (compound) {
          setState({ type: "success", data: compound });
          return;
        }

        setState({
          type: "error",
          error: new Error("Compound preview data unavailable"),
        });
      })
      .catch((error) => {
        if (active) {
          setState({ type: "error", error: error instanceof Error ? error : new Error("Failed to load Compound preview") });
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
    return <CompoundCard href={href} response={state.data} />;
  }

  return <OpenGraphPreview href={href} preview={undefined} />;
}
