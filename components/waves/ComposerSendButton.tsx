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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      title={title}
      className="tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-text-white hover:tw-bg-primary-600 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-bg-iron-800 disabled:tw-text-iron-500"
    >
      {loading ? (
        <CircleLoader />
      ) : (
        <PaperAirplaneIcon
          aria-hidden="true"
          className="tw-size-5 tw-flex-shrink-0"
        />
      )}
    </button>
  );
}
