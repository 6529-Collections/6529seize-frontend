"use client";

import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

import type { SavedRecoveryFile } from "./app-wallet-recovery-files";
import {
  findSavedRecoveryFiles,
  removeSavedRecoveryFiles,
} from "./app-wallet-recovery-files";

type RemovalState = "idle" | "removing" | "removed" | "failed";

/**
 * Offers to remove recovery files that earlier app versions kept in the
 * Documents folder for this wallet. Renders nothing when there are none or
 * the folder cannot be listed. Key it by address so state resets per wallet.
 */
export default function AppWalletSavedRecoveryFilesNotice({
  address,
}: Readonly<{ address: string }>) {
  const locale = useBrowserLocale();
  const titleId = useId();
  const removedRef = useRef<HTMLParagraphElement>(null);
  const removeButtonRef = useRef<HTMLButtonElement>(null);
  const [files, setFiles] = useState<readonly SavedRecoveryFile[]>([]);
  const [removal, setRemoval] = useState<RemovalState>("idle");

  useEffect(() => {
    let active = true;
    findSavedRecoveryFiles(address)
      .then((found) => {
        if (active) {
          setFiles(found);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [address]);

  if (removal === "removed") {
    return (
      <p
        ref={removedRef}
        role="status"
        tabIndex={-1}
        className="tw-m-0 tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-900/70 tw-p-4 tw-text-sm tw-leading-6 tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
      >
        {t(locale, "appWallets.savedRecoveryFiles.removed")}
      </p>
    );
  }

  if (files.length === 0) {
    return null;
  }

  const hasPlaintext = files.some((file) => file.plaintext);

  const onRemove = () => {
    setRemoval("removing");
    void removeSavedRecoveryFiles(files).then((remaining) => {
      const removed = remaining.length === 0;
      // Render the outcome before moving focus: the button is disabled while
      // removing, which drops focus, so put it somewhere meaningful.
      flushSync(() => {
        setFiles(remaining);
        setRemoval(removed ? "removed" : "failed");
      });
      if (removed) {
        removedRef.current?.focus();
      } else {
        removeButtonRef.current?.focus();
      }
    });
  };

  return (
    <section
      aria-labelledby={titleId}
      className="tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-amber-400/20 tw-bg-amber-400/5 tw-p-5 sm:tw-p-6"
    >
      <h2
        id={titleId}
        className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-amber-200"
      >
        {t(locale, "appWallets.savedRecoveryFiles.title")}
      </h2>
      <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-200">
        {t(
          locale,
          hasPlaintext
            ? "appWallets.savedRecoveryFiles.plaintextBody"
            : "appWallets.savedRecoveryFiles.encryptedBody"
        )}
      </p>
      <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-200">
        {t(locale, "appWallets.savedRecoveryFiles.beforeRemoving")}
      </p>
      {removal === "failed" && (
        <p
          role="alert"
          className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-red"
        >
          {t(locale, "appWallets.savedRecoveryFiles.removeFailed")}
        </p>
      )}
      <div className="tw-mt-4">
        <Button
          ref={removeButtonRef}
          type="button"
          variant="secondary"
          size="md"
          loading={removal === "removing"}
          onClick={onRemove}
        >
          {removal === "removing"
            ? t(locale, "appWallets.savedRecoveryFiles.removing")
            : t(locale, "appWallets.savedRecoveryFiles.remove")}
        </Button>
      </div>
    </section>
  );
}
