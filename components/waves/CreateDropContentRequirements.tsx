import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveParticipationRequirement } from "@/generated/models/ApiWaveParticipationRequirement";
import CreateDropContentRequirementsItem from "./CreateDropContentRequirementsItem";

export enum DropRequirementType {
  MEDIA = "MEDIA",
  METADATA = "METADATA",
}

interface CreateDropContentRequirementsProps {
  readonly canSubmit: boolean;
  readonly wave: ApiWave;
  readonly missingMedia: ApiWaveParticipationRequirement[];
  readonly missingMetadata: string[];
  readonly disabled: boolean;
  readonly onOpenMetadata: () => void;
  readonly setFiles: (files: File[]) => void;
}

const CreateDropContentRequirements: React.FC<
  CreateDropContentRequirementsProps
> = ({
  canSubmit,
  wave,
  missingMedia,
  missingMetadata,
  disabled,
  onOpenMetadata,
  setFiles,
}) => {
  return (
    <AnimatePresence>
      {canSubmit &&
        (!!wave.participation.required_media.length ||
          !!wave.participation.required_metadata.length) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="tw-mt-2 tw-w-full tw-inline-flex tw-space-x-2"
          >
            {wave.participation.required_media.length > 0 && (
              <CreateDropContentRequirementsItem
                isValid={!missingMedia.length}
                missingItems={missingMedia.map((m) => m.toLowerCase())}
                requirementType={DropRequirementType.MEDIA}
                onOpenMetadata={onOpenMetadata}
                setFiles={setFiles}
                disabled={disabled}
              />
            )}
            {wave.participation.required_metadata.length > 0 && (
              <CreateDropContentRequirementsItem
                isValid={!missingMetadata.length}
                missingItems={missingMetadata}
                requirementType={DropRequirementType.METADATA}
                onOpenMetadata={onOpenMetadata}
                setFiles={setFiles}
                disabled={disabled}
              />
            )}
          </motion.div>
        )}
    </AnimatePresence>
  );
};

export default CreateDropContentRequirements;
