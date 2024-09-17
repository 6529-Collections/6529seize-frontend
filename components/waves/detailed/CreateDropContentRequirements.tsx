import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wave } from "../../../generated/models/Wave";
import { WaveParticipationRequirement } from "../../../generated/models/WaveParticipationRequirement";
import { WaveRequiredMetadata } from "../../../generated/models/WaveRequiredMetadata";
import CreateDropContentRequirementsItem from "./CreateDropContentRequirementsItem";

export enum DropRequirementType {
  MEDIA = "MEDIA",
  METADATA = "METADATA",
}

interface CreateDropContentRequirementsProps {
  canSubmit: boolean;
  wave: Wave;
  missingMedia: WaveParticipationRequirement[];
  missingMetadata: string[];
}

const CreateDropContentRequirements: React.FC<
  CreateDropContentRequirementsProps
> = ({ canSubmit, wave, missingMedia, missingMetadata }) => {
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
            className="tw-w-full tw-inline-flex tw-space-x-4"
          >
            <CreateDropContentRequirementsItem
              isValid={!missingMedia.length}
              missingItems={missingMedia.map((m) => m.toLowerCase())}
              requirementType={DropRequirementType.MEDIA}
            />
            <CreateDropContentRequirementsItem
              isValid={!missingMetadata.length}
              missingItems={missingMetadata}
              requirementType={DropRequirementType.METADATA}
            />
          </motion.div>
        )}
    </AnimatePresence>
  );
};

export default CreateDropContentRequirements;
