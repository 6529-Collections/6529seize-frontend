"use client";

import { useState } from "react";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import CreateDropPoll, {
  type CreateDropPollDraft,
} from "@/components/waves/CreateDropPoll";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function CreateDropPollDialog({
  canSubmit,
  draft,
  locale,
  onChange,
  onRemove,
  onSubmit,
  submitting,
  validationError,
}: {
  readonly canSubmit: boolean;
  readonly draft: CreateDropPollDraft;
  readonly locale: SupportedLocale;
  readonly onChange: (draft: CreateDropPollDraft) => void;
  readonly onRemove: () => void;
  readonly onSubmit: () => Promise<void>;
  readonly submitting: boolean;
  readonly validationError: string | null;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const title = t(locale, "waves.poll.composer.title");
  const postLabel = t(locale, "waves.header.postLabel.one");
  const postingLabel = t(locale, "waves.header.postLabel.inProgress");
  const close = () => setIsOpen(false);
  const handleAfterLeave = () => {
    if (!isOpen) {
      onRemove();
    }
  };

  return (
    <MobileWrapperDialog
      title={title}
      ariaLabel={title}
      isOpen={isOpen}
      onClose={close}
      onBack={submitting ? undefined : close}
      onAfterLeave={handleAfterLeave}
      dismissible={!submitting}
      noPadding
      enableDragToClose
      showHeaderCloseButton={false}
      showHeaderDivider
      surfaceClassName="tw-bg-iron-950"
    >
      <CreateDropPoll
        draft={draft}
        disabled={submitting}
        validationError={validationError}
        onChange={onChange}
        onRemove={close}
        presentation="sheet"
      />
      <div className="tw-sticky tw-bottom-0 tw-z-10 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-bg-iron-950/95 tw-px-4 tw-pb-3 tw-pt-3 tw-backdrop-blur">
        <Button
          onClick={onSubmit}
          loading={submitting}
          disabled={!canSubmit}
          variant="primary"
          size="lg"
          fullWidth
          aria-label={submitting ? postingLabel : postLabel}
          hideChildrenWhenLoading
        >
          {postLabel}
        </Button>
      </div>
    </MobileWrapperDialog>
  );
}
