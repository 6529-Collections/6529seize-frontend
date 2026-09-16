"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { AppToastInput } from "@/components/utils/toast/AppToast";
import { filterValidDropUploadFiles } from "@/services/uploads/dropUploadValidation";
import { getContentType } from "@/services/uploads/mediaUploadMimeType";
import {
  getDropUploadOwner,
  rememberPreparedDropImage,
  validateDropImageSignature,
} from "@/services/uploads/prepareDropImage";
import { multiPartUpload } from "../create-wave/services/multiPartUpload";
import { t } from "@/i18n/messages";
import type { UploadingFile } from "./types";
import { selectNewComposerFiles } from "./content-helpers";

export function useDropFilePreparation({
  scopeKey: composerScope,
  existingFiles,
  disabled,
  setToast,
  onFiles,
}: {
  readonly scopeKey: string;
  readonly existingFiles: readonly File[];
  readonly disabled: boolean;
  readonly setToast: (toast: AppToastInput) => void;
  readonly onFiles: (files: File[]) => void;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const scopeKey = `${composerScope}:${connectedProfile?.id ?? ""}:${activeProfileProxy?.id ?? ""}`;
  const [preparation, setPreparation] = useState<{
    scope: string;
    count: number;
    files: UploadingFile[];
  }>({ scope: scopeKey, count: 0, files: [] });
  if (preparation.scope !== scopeKey) {
    setPreparation({ scope: scopeKey, count: 0, files: [] });
  }
  const scopeRef = useRef(scopeKey);
  useLayoutEffect(() => {
    scopeRef.current = scopeKey;
  }, [scopeKey]);
  const addFilesRef = useRef(onFiles);
  useLayoutEffect(() => {
    addFilesRef.current = onFiles;
  }, [onFiles]);
  const reservationsRef = useRef<File[]>([]);
  const controllersRef = useRef(new Set<AbortController>());
  useLayoutEffect(
    () => () => {
      for (const controller of controllersRef.current) controller.abort();
      controllersRef.current.clear();
      reservationsRef.current = [];
    },
    [scopeKey]
  );

  const handleFileChange = (newFiles: File[]) => {
    if (disabled) return;
    const validFiles = selectNewComposerFiles(
      filterValidDropUploadFiles(newFiles, setToast, locale),
      [...existingFiles, ...reservationsRef.current],
      setToast,
      locale
    );
    if (!validFiles.length) return;
    reservationsRef.current.push(...validFiles);
    const owner = getDropUploadOwner();
    const controller = new AbortController();
    controllersRef.current.add(controller);
    const active = () =>
      !controller.signal.aborted && scopeRef.current === scopeKey;
    const updateFile = (
      file: File,
      update: Partial<Pick<UploadingFile, "progress" | "phase">>
    ) => {
      if (!active()) return;
      setPreparation((current) => ({
        ...current,
        files: current.files.map((item) =>
          item.file === file ? { ...item, ...update } : item
        ),
      }));
    };
    setPreparation((current) => ({
      scope: scopeKey,
      count: (current.scope === scopeKey ? current.count : 0) + 1,
      files: current.scope === scopeKey ? current.files : [],
    }));
    const prepareFile = async (file: File) => {
      await validateDropImageSignature(file, locale);
      if (!active()) return;
      if (getContentType(file) === "image/avif") {
        setPreparation((current) => ({
          ...current,
          files: [
            ...current.files,
            { file, isUploading: true, progress: 0, phase: "uploading" },
          ],
        }));
        const media = await multiPartUpload({
          file,
          path: "drop",
          signal: controller.signal,
          onProgress: (progress) => updateFile(file, { progress }),
          onProcessing: () =>
            updateFile(file, { phase: "processing", progress: 100 }),
        });
        if (active()) rememberPreparedDropImage(file, media, owner);
      }
    };
    void (async () => {
      const readyFiles: File[] = [];
      for (const file of validFiles) {
        if (!active()) break;
        try {
          await prepareFile(file);
          readyFiles.push(file);
        } catch (error) {
          if (active())
            setToast({
              type: "error",
              title: t(locale, "drop.upload.invalidFile", { file: file.name }),
              description:
                error instanceof Error ? error.message : String(error),
              autoClose: false,
            });
        }
      }
      if (active()) {
        if (readyFiles.length) addFilesRef.current(readyFiles);
        setPreparation((current) => ({
          ...current,
          count: current.count - 1,
          files: current.files.filter(
            (item) => !validFiles.includes(item.file)
          ),
        }));
        reservationsRef.current = reservationsRef.current.filter(
          (file) => !validFiles.includes(file)
        );
        controllersRef.current.delete(controller);
      }
    })();
  };

  return {
    handleFileChange,
    isPreparingFiles: preparation.scope === scopeKey && preparation.count > 0,
    preparingFiles: preparation.scope === scopeKey ? preparation.files : [],
  };
}
