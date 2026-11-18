import IconButton from "@/components/utils/button/IconButton";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";

interface ComposerSendButtonProps {
  readonly onClick: () => void;
  readonly disabled: boolean;
  readonly loading?: boolean;
  readonly title?: string | undefined;
  readonly "aria-label": string;
}

export function ComposerSendButton({
  onClick,
  disabled,
  loading = false,
  title,
  "aria-label": ariaLabel,
}: ComposerSendButtonProps) {
  return (
    <IconButton
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      title={title}
      size={40}
      variant="action"
    >
      {loading ? (
        <CircleLoader />
      ) : (
        <PaperAirplaneIcon
          aria-hidden="true"
          className="tw-size-5 tw-flex-shrink-0"
        />
      )}
    </IconButton>
  );
}
