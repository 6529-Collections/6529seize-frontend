import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { DropPrivileges } from "@/hooks/useDropPriviledges";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type {
  CurationComposerVariant,
  DropMode,
  IdentityPickerPlacement,
} from "../dropComposer.types";

export interface CreateDropProps {
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly onReplyTargetUnavailable?: (() => void) | undefined;
  readonly onDropAddedToQueue: () => void;
  readonly onAllDropsAdded?: (() => void) | undefined;
  readonly onServerDropCreated?:
    | ((drop: ApiDrop) => Promise<void> | void)
    | undefined;
  readonly onExitFixedDropMode?: (() => void) | undefined;
  readonly wave: ApiWave;
  readonly dropId: string | null;
  readonly fixedDropMode: DropMode;
  readonly privileges: DropPrivileges;
  readonly curationComposerVariant?: CurationComposerVariant | undefined;
  readonly initialCurationUrl?: string | null | undefined;
  readonly onSubmitCurationUrl?: ((url: string) => void) | undefined;
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
  readonly forceStandardDropComposer?: boolean | undefined;
  readonly focusOnInitialActiveDrop?: boolean | undefined;
  readonly initialMarkdown?: string | null | undefined;
  readonly initialMarkdownKey?: string | null | undefined;
}
