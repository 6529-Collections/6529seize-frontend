import { useEffect, useState } from "react";
import type { ApiArtworkDocumentationAsset } from "@/generated/models/ApiArtworkDocumentationAsset";
import { downloadDocumentationAsset } from "@/services/api/artwork-documentation-assets-api";
import { fetchDocumentationCaptions } from "@/lib/artwork-documentation/media-alternatives";

export function useDocumentationCaption(
  contextId: string,
  asset: ApiArtworkDocumentationAsset | undefined,
  active: boolean,
  attempt: number
) {
  const assetId = asset?.id;
  const assetHash = asset?.sha256;
  const requestKey = JSON.stringify([
    contextId,
    assetId,
    assetHash,
    active,
    attempt,
  ]);
  const [result, setResult] = useState<{
    key: string;
    url?: string;
    failed?: boolean;
  } | null>(null);
  useEffect(() => {
    if (!active || !assetId) return;
    const abort = new AbortController();
    let objectUrl: string | undefined;
    const load = async () => {
      try {
        const grant = await downloadDocumentationAsset(
          contextId,
          assetId,
          "original",
          abort.signal
        );
        const bytes = await fetchDocumentationCaptions(grant.url, abort.signal);
        if (abort.signal.aborted) return;
        objectUrl = URL.createObjectURL(bytes);
        setResult({ key: requestKey, url: objectUrl });
      } catch {
        if (!abort.signal.aborted) setResult({ key: requestKey, failed: true });
      }
    };
    void load();
    return () => {
      abort.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [contextId, assetId, active, requestKey]);
  return result?.key === requestKey ? result : null;
}
