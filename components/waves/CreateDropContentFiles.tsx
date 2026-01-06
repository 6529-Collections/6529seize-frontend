import React from "react";
import type { CreateDropPart } from "@/entities/IDrop";
import { AnimatePresence, motion } from "framer-motion";
import FilePreview from "./FilePreview";
import type { UploadingFile } from "./CreateDropContent";

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
}

export const CreateDropContentFiles: React.FC<CreateDropContentFilesProps> = ({
  parts,
  files,
  uploadingFiles,
  removeFile,
  disabled,
}) => {
  const allFiles: FileWithSource[] = [
    ...parts.flatMap((part, index) =>
      part.media.map((file) => ({
        file,
        source: FileSource.Parts,
        label: parts.length ? `Part ${index + 1}` : null,
        partIndex: index,
      }))
    ),
    ...files.map((file) => ({
      file,
      source: FileSource.Files,
      label: parts.length ? `Part ${parts.length + 1}` : null,
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
