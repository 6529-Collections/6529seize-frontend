import type { DropMutationBody } from "@/components/waves/CreateDrop";
import type { CreateDropConfig } from "@/entities/IDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import type { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type React from "react";
import type { IdentityPickerPlacement } from "../dropComposer.types";

export type CreateDropMetadataType =
  | {
      readonly id: string;
      key: string;
      readonly type: ApiWaveMetadataType.String;
      value: string | null;
      readonly required: boolean;
    }
  | {
      readonly id: string;
      key: string;
      readonly type: ApiWaveMetadataType.Number;
      value: number | null;
      readonly required: boolean;
    }
  | {
      readonly id: string;
      key: string;
      readonly type: null;
      value: string | null;
      readonly required: boolean;
    };

export type ScopedValueState<T> = {
  readonly scopeKey: string;
  readonly value: T;
};

export interface UploadingFile {
  file: File;
  isUploading: boolean;
  progress: number;
  phase: "uploading" | "processing";
}

export interface CreateDropContentProps {
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly wave: ApiWave;
  readonly drop: CreateDropConfig | null;
  readonly isStormMode: boolean;
  readonly isDropMode: boolean;
  readonly dropId: string | null;
  readonly setDrop: React.Dispatch<
    React.SetStateAction<CreateDropConfig | null>
  >;
  readonly setIsStormMode: React.Dispatch<React.SetStateAction<boolean>>;
  readonly onDropModeChange: (newIsDropMode: boolean) => void;
  readonly onSwitchToDropModeWithUrl: (url: string) => void;
  readonly submitDrop: (dropRequest: DropMutationBody) => boolean;
  readonly dropModeToggleExitLabel: string | null;
  readonly canExitDropMode: boolean;
  readonly isChatBlockedBySlowMode: boolean;
  readonly submissionExperience: WaveSubmissionExperience;
  readonly canSubmitCurationUrl?: boolean | undefined;
  readonly curationUrlSubmitRestrictionMessage?: string | null | undefined;
  readonly externalAttachmentDrop?:
    | {
        readonly token: number;
        readonly files: File[];
      }
    | null
    | undefined;
  readonly onExternalAttachmentDropConsumed?: (() => void) | undefined;
  readonly termsSignatureFlowEnabled?: boolean | undefined;
  readonly identityPickerPlacement?: IdentityPickerPlacement | undefined;
}
