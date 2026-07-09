import { useCallback, useEffect, useState } from "react";

export function usePendingObjectUrl() {
  const [pendingFile, setPendingFileState] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(
    null
  );

  const clearPendingFile = useCallback(() => {
    setPendingFileState(null);
    setPendingPreviewUrl((previousPreviewUrl) => {
      if (previousPreviewUrl) URL.revokeObjectURL(previousPreviewUrl);
      return null;
    });
  }, []);

  const setPendingFile = useCallback((file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setPendingFileState(file);
    setPendingPreviewUrl((previousPreviewUrl) => {
      if (previousPreviewUrl) URL.revokeObjectURL(previousPreviewUrl);
      return previewUrl;
    });
  }, []);

  useEffect(() => clearPendingFile, [clearPendingFile]);

  return {
    pendingFile,
    pendingPreviewUrl,
    clearPendingFile,
    setPendingFile,
  };
}
