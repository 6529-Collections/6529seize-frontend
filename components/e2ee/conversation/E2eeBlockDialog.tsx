"use client";

import { useProfileBlockState } from "@/hooks/content-moderation/useProfileBlockState";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { E2eeConfirmDialog } from "../ui/E2eeConfirmDialog";

interface E2eeBlockTarget {
  readonly profileId: string;
  readonly handle: string | null;
  readonly name: string;
}

/**
 * Confirms blocking a message's sender with the account-wide block. A block
 * stops new encrypted chats and adds in both directions (the server checks
 * it at every claim and add); chats already shared stay until left.
 */
function BlockConfirm({
  target,
  onClose,
  onBlocked,
}: {
  readonly target: E2eeBlockTarget;
  readonly onClose: () => void;
  readonly onBlocked: (name: string) => void;
}) {
  const locale = useBrowserLocale();
  const blockState = useProfileBlockState({
    profileId: target.profileId,
    profileHandle: target.handle,
  });
  return (
    <E2eeConfirmDialog
      open
      title={t(locale, "e2ee.block.title", { name: target.name })}
      body={t(locale, "e2ee.block.description")}
      confirmLabel={t(locale, "e2ee.block.confirm")}
      errorFallbackKey="e2ee.block.failed"
      onConfirm={async () => {
        await blockState.block();
        onBlocked(target.name);
      }}
      onClose={onClose}
    />
  );
}

export function E2eeBlockDialog({
  target,
  onClose,
  onBlocked,
}: {
  readonly target: E2eeBlockTarget | null;
  readonly onClose: () => void;
  readonly onBlocked: (name: string) => void;
}) {
  if (!target) {
    return null;
  }
  return (
    <BlockConfirm
      key={target.profileId}
      target={target}
      onClose={onClose}
      onBlocked={onBlocked}
    />
  );
}
