import { ActiveDropState } from "./chat/WaveChat";
import { ApiWave } from "../../../generated/models/ObjectSerializer";
import CreateDrop from "./CreateDrop";
import { useDropPrivileges } from "../../../hooks/useDropPriviledges";
import { useAuth } from "../../auth/Auth";
import DropPlaceholder from "./DropPlaceholder";

export enum DropMode {
  CHAT = "CHAT",
  PARTICIPATION = "PARTICIPATION",
  BOTH = "BOTH",
}

interface PrivilegedDropCreatorProps {
  readonly activeDrop: ActiveDropState | null;
  readonly onCancelReplyQuote: () => void;
  readonly onAllDropsAdded?: () => void;
  readonly wave: ApiWave;
  readonly dropId: string | null;
  readonly fixedDropMode: DropMode;
}

export default function PrivilegedDropCreator({
  activeDrop,
  onCancelReplyQuote,
  wave,
  dropId,
  fixedDropMode,
  onAllDropsAdded,
}: PrivilegedDropCreatorProps) {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { submissionRestriction, chatRestriction } = useDropPrivileges({
    isLoggedIn: !!connectedProfile?.profile?.handle,
    isProxy: !!activeProfileProxy,
    canChat: wave.chat.authenticated_user_eligible,
    canDrop: wave.participation.authenticated_user_eligible,
    chatDisabled: !wave.chat.enabled,
    submissionStarts: wave.participation.period?.min ?? null,
    submissionEnds: wave.participation.period?.max ?? null,
  });

  if (!!submissionRestriction && !!chatRestriction) {
    return (
      <DropPlaceholder
        type="both"
        chatRestriction={chatRestriction}
        submissionRestriction={submissionRestriction}
      />
    );
  }

  if (fixedDropMode === DropMode.CHAT && !!chatRestriction) {
    return <DropPlaceholder type="chat" chatRestriction={chatRestriction} />;
  }

  if (fixedDropMode === DropMode.PARTICIPATION && !!submissionRestriction) {
    return (
      <DropPlaceholder
        type="submission"
        submissionRestriction={submissionRestriction}
      />
    );
  }

  return (
    <CreateDrop
      activeDrop={activeDrop}
      onCancelReplyQuote={onCancelReplyQuote}
      onAllDropsAdded={onAllDropsAdded}
      wave={wave}
      dropId={dropId}
      fixedDropMode={fixedDropMode}
      privileges={{
        submissionRestriction,
        chatRestriction,
      }}
    />
  );
}
