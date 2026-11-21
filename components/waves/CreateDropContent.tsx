"use client";

import React, { memo } from "react";
import CreateDropLayout from "./create-drop-content/CreateDropLayout";
import { useCreateDropContentController } from "./create-drop-content/useCreateDropContentController";
import type { CreateDropContentProps } from "./create-drop-content/types";
import { useDropComposerDesktopBusy } from "@/services/desktop/desktopBusy";

export type {
  CreateDropMetadataType,
  UploadingFile,
} from "./create-drop-content/types";

const CreateDropContent: React.FC<CreateDropContentProps> = (props) => {
  const layoutProps = useCreateDropContentController(props);
  // 6529 Desktop waits to restart for an update while these would be lost.
  useDropComposerDesktopBusy(
    layoutProps.uploadingFiles.length > 0,
    layoutProps.submitting
  );
  return <CreateDropLayout {...layoutProps} />;
};

export default memo(CreateDropContent);
