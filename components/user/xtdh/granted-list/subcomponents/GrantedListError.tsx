import Button from "@/components/utils/button/Button";

interface GrantedListErrorProps {
  readonly message?: string | undefined;
  readonly onRetry: () => void;
}

export function GrantedListError({
  message,
  onRetry,
}: Readonly<GrantedListErrorProps>) {
  const displayMessage = message ?? "Failed to load granted xTDH.";

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <p className="tw-text-sm tw-text-red-400 tw-m-0 group-data-[typography=profile]/profile-xtdh:tw-text-[15px] group-data-[typography=profile]/profile-xtdh:tw-font-normal" role="alert">
        {displayMessage}
      </p>
      <Button
        variant="tertiary"
        size="sm"
        onClick={onRetry}
        className="tw-self-start"
      >
        Retry
      </Button>
    </div>
  );
}
