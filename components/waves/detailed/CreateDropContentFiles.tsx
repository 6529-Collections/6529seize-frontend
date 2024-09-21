import React from "react";
import { CreateDropPart } from "../../../entities/IDrop";
import { AnimatePresence, motion } from "framer-motion";
import FilePreview from "./FilePreview";
import { UploadingFile } from "./CreateDropContent";

enum FileSource {
  Files,
  Parts,
}

interface FileWithSource {
  file: File;
  source: FileSource;
  partIndex?: number;
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
        partIndex: index,
      }))
    ),
    ...files.map((file) => ({ file, source: FileSource.Files })),
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
              files={allFiles.map((fileWithSource) => fileWithSource.file)}
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
