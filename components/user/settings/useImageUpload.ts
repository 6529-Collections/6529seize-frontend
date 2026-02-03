"use client";

import { useCallback, useContext, useRef, useState } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { isValidImageType } from "./imageValidation";

interface UseImageUploadOptions {
  maxSizeBytes: number;
  maxSizeLabel: string;
  setFile: (file: File) => void;
}

export function useImageUpload({
  maxSizeBytes,
  maxSizeLabel,
  setFile,
}: UseImageUploadOptions) {
  const { setToast } = useContext(AuthContext);
  const dragDepth = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState<boolean>(false);
  const [dragging, setDragging] = useState(false);

  const onFileChange = useCallback(
    (file: File) => {
      setError(null);
      if (!isValidImageType(file)) {
        setToast({
          type: "error",
          message: "Invalid file type",
        });
        return;
      }

      if (file.size > maxSizeBytes) {
        setError(`File size must be less than ${maxSizeLabel}`);
        setShake(true);
        setTimeout(() => setShake(false), 300);
        return;
      }

      setFile(file);
    },
    [setFile, setToast, maxSizeBytes, maxSizeLabel]
  );

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragging(false);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current = 0;
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        onFileChange(file);
      }
    },
    [onFileChange]
  );

  return {
    error,
    shake,
    dragging,
    onFileChange,
    dragHandlers: {
      onDrop,
      onDragEnter,
      onDragLeave,
      onDragOver,
    },
  };
}
