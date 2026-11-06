import AllMentionConfirmationDialog from "./AllMentionConfirmationDialog";
import WaveGuidelinesAgreementDialog from "./WaveGuidelinesAgreementDialog";
import type { useAllMentionConfirmation } from "./useAllMentionConfirmation";
import type { useWaveGuidelinesAgreement } from "./useWaveGuidelinesAgreement";

export default function CreateDropSubmissionDialogs({
  allMention,
  guidelinesAgreement,
}: {
  readonly allMention: ReturnType<typeof useAllMentionConfirmation>;
  readonly guidelinesAgreement: ReturnType<typeof useWaveGuidelinesAgreement>;
}) {
  return (
    <>
      <AllMentionConfirmationDialog
        state={allMention.confirmation}
        onCancel={allMention.cancel}
        onConfirm={allMention.confirm}
        onRetry={allMention.retry}
      />
      <WaveGuidelinesAgreementDialog
        guidelines={guidelinesAgreement.dialogGuidelines}
        onAgree={guidelinesAgreement.agreeToGuidelines}
        onDecline={guidelinesAgreement.declineGuidelines}
      />
    </>
  );
}
