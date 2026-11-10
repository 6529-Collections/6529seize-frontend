"use client";

import { useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { E2eeConfirmDialog } from "../ui/E2eeConfirmDialog";
import { useRemoveE2eeLocalData } from "../useRemoveE2eeLocalData";

/**
 * The way out of a device stopped on an unconfirmed revocation: removes the
 * encrypted messages saved in this browser (after a confirmation), so it
 * can be turned on again as a new device. Needs no running engine.
 */
export function E2eeRemoveLocalData() {
  const locale = useBrowserLocale();
  const remove = useRemoveE2eeLocalData();
  const [open, setOpen] = useState(false);
  if (!remove) {
    return null;
  }
  return (
    <div className="tw-flex tw-justify-center">
      <Button
        variant="destructiveOutline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        {t(locale, "e2ee.enroll.removeLocal")}
      </Button>
      <E2eeConfirmDialog
        open={open}
        title={t(locale, "e2ee.enroll.removeLocalTitle")}
        body={t(locale, "e2ee.enroll.removeLocalBody")}
        confirmLabel={t(locale, "e2ee.enroll.removeLocalConfirm")}
        destructive
        errorFallbackKey="e2ee.enroll.removeLocalFailed"
        onConfirm={remove}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
