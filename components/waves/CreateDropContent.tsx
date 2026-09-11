"use client";

import React, { memo } from "react";
import CreateDropLayout from "./create-drop-content/CreateDropLayout";
import { useCreateDropContentController } from "./create-drop-content/useCreateDropContentController";
import type { CreateDropContentProps } from "./create-drop-content/types";

export type {
  CreateDropMetadataType,
  UploadingFile,
} from "./create-drop-content/types";

const CreateDropContent: React.FC<CreateDropContentProps> = (props) => {
  const layoutProps = useCreateDropContentController(props);
  return <CreateDropLayout {...layoutProps} />;
};

export default memo(CreateDropContent);
