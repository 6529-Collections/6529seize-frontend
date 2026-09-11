import React from "react";
import type { CreateDropPart } from "@/entities/IDrop";
import { AnimatePresence, motion } from "framer-motion";
import FilePreview from "./FilePreview";
import type { UploadingFile } from "./CreateDropContent";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

enum FileSource {
  Files,
  Parts,
}

interface FileWithSource {
  file: File;
  source: FileSource;
  label: string | null;
  partIndex?: number | undefined;
}

interface CreateDropContentFilesProps {
  readonly parts: CreateDropPart[];
  readonly files: File[];
  readonly uploadingFiles: UploadingFile[];
  readonly removeFile: (file: File, partIndex?: number) => void;
  readonly disabled: boolean;
  readonly showPartFiles?: boolean | undefined;
  readonly currentPartNumber?: number | null | undefined;
}

export const CreateDropContentFiles: React.FC<CreateDropContentFilesProps> = ({
  parts,
  files,
  uploadingFiles,
  removeFile,
  disabled,
  showPartFiles = true,
  currentPartNumber = null,
}) => {
  const locale = useBrowserLocale();
  let currentFilesLabel: string | null = null;
  if (currentPartNumber !== null) {
    currentFilesLabel = t(locale, "waves.stormComposer.part", {
      number: currentPartNumber,
    });
  } else if (parts.length > 0) {
    currentFilesLabel = t(locale, "waves.stormComposer.part", {
      number: parts.length + 1,
    });
  }

  const allFiles: FileWithSource[] = [
    ...(showPartFiles
      ? parts.flatMap((part, index) =>
          part.media.map((file) => ({
            file,
            source: FileSource.Parts,
            label: parts.length
              ? t(locale, "waves.stormComposer.part", { number: index + 1 })
              : null,
            partIndex: index,
          }))
        )
      : []),
    ...files.map((file) => ({
      file,
      source: FileSource.Files,
      label: currentFilesLabel,
    })),
  ];

  return (
    <div>
      <AnimatePresence>
        {!!allFiles.length && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FilePreview
              files={allFiles.map((fileWithSource) => ({
                file: fileWithSource.file,
                label: fileWithSource.label,
              }))}
              uploadingFiles={uploadingFiles}
              removeFile={(file) => {
                const fileWithSource = allFiles.find((f) => f.file === file);
                if (fileWithSource) {
                  removeFile(file, fileWithSource.partIndex);
                }
              }}
              disabled={disabled}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
