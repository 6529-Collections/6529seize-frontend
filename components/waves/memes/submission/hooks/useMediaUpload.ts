"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";

export interface MediaUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  serverUrl: string | null;
  status: "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

interface UseMediaUploadReturn {
  items: MediaUploadItem[];
  addFiles: (files: File[]) => Promise<void>;
  removeItem: (id: string) => void;
  getServerUrls: () => string[];
  isUploading: boolean;
  hasErrors: boolean;
}

/**
 * Hook for managing multiple media file uploads
 */
export function useMediaUpload(maxFiles: number = 4): UseMediaUploadReturn {
  const [items, setItems] = useState<MediaUploadItem[]>([]);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  // Cleanup all preview URLs on unmount
  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      previewUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      previewUrls.clear();
    };
  }, []);

  const addFiles = useCallback(
    async (files: File[]): Promise<void> => {
      // Limit total files
      const availableSlots = maxFiles - items.length;
      const filesToAdd = files.slice(0, availableSlots);

      if (filesToAdd.length === 0) return;

      // Create initial items with uploading status
      const newItems: MediaUploadItem[] = filesToAdd.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.add(previewUrl);
        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          file,
          previewUrl,
          serverUrl: null,
          status: "uploading" as const,
          progress: 0,
        };
      });

      setItems((prev) => [...prev, ...newItems]);

      // Upload each file
      for (const item of newItems) {
        try {
          const result = await multiPartUpload({
            file: item.file,
            path: "drop",
            onProgress: (progress) => {
              setItems((prev) =>
                prev.map((i) =>
                  i.id === item.id ? { ...i, progress } : i
                )
              );
            },
          });

          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, serverUrl: result.url, status: "done" as const, progress: 100 }
                : i
            )
          );
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Upload failed";
          if (item.previewUrl) {
            URL.revokeObjectURL(item.previewUrl);
            previewUrlsRef.current.delete(item.previewUrl);
          }
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, previewUrl: "", status: "error" as const, error: errorMsg }
                : i
            )
          );
        }
      }
    },
    [items.length, maxFiles]
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
        previewUrlsRef.current.delete(item.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const getServerUrls = useCallback(() => {
    return items
      .filter((i) => i.status === "done" && !!i.serverUrl)
      .map((i) => i.serverUrl as string);
  }, [items]);

  const isUploading = items.some((i) => i.status === "uploading");
  const hasErrors = items.some((i) => i.status === "error");

  return {
    items,
    addFiles,
    removeItem,
    getServerUrls,
    isUploading,
    hasErrors,
  };
}
