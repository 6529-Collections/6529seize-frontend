import { useCallback, useEffect, useState } from "react";

export function usePendingObjectUrl() {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(
    null
  );

  const clearPendingFile = useCallback(() => {
    setPendingFile(null);
    setPendingPreviewUrl((previousPreviewUrl) => {
      if (previousPreviewUrl) URL.revokeObjectURL(previousPreviewUrl);
      return null;
    });
  }, []);

  const setPendingObjectUrlFile = useCallback((file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setPendingFile(file);
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
    setPendingFile: setPendingObjectUrlFile,
  };
}
