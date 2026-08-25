import Button from "@/components/utils/button/Button";
import type { Ref } from "react";

export default function EULAFooter({
  agreeButtonRef,
  hasReachedBottom,
  isSaving,
  saveError,
  agreeLabel,
  retryLabel,
  onAgree,
}: {
  readonly agreeButtonRef: Ref<HTMLButtonElement>;
  readonly hasReachedBottom: boolean;
  readonly isSaving: boolean;
  readonly saveError: string | null;
  readonly agreeLabel: string;
  readonly retryLabel: string;
  readonly onAgree: () => void;
}) {
  return (
    <div
      data-testid="eula-action-bar"
      className="tw-shrink-0 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-black/50 tw-px-4 tw-pb-[clamp(0.75rem,env(safe-area-inset-bottom,0px),2.25rem)] tw-pt-4 tw-backdrop-blur-xl sm:tw-px-8 sm:tw-py-4"
    >
      <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-4xl tw-flex-col tw-items-center tw-gap-3 sm:tw-flex-row sm:tw-justify-end">
        {saveError && (
          <p
            className="tw-m-0 tw-flex-1 tw-text-center tw-text-sm tw-text-error sm:tw-text-left"
            role="alert"
          >
            {saveError}
          </p>
        )}
        <Button
          ref={agreeButtonRef}
          onClick={onAgree}
          disabled={!hasReachedBottom}
          loading={isSaving}
          variant="primary"
          size="lg"
          className="tw-w-full sm:tw-w-auto sm:tw-min-w-40"
        >
          {saveError ? retryLabel : agreeLabel}
        </Button>
      </div>
    </div>
  );
}
