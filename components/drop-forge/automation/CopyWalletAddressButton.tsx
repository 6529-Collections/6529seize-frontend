import { CheckIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import { useAuth } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/drop-forge";

export default function CopyWalletAddressButton({
  address,
}: Readonly<{ address: string }>) {
  const locale = useBrowserLocale();
  const { setToast } = useAuth();
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const request = useRef(0);
  const reset = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      request.current++;
      clearTimeout(reset.current);
    },
    []
  );

  async function copyAddress() {
    const current = ++request.current;
    clearTimeout(reset.current);
    try {
      await navigator.clipboard.writeText(address);
      if (current !== request.current) return;
      setStatus("copied");
      reset.current = setTimeout(() => setStatus("idle"), 2000);
    } catch {
      if (current === request.current) {
        setStatus("error");
        setToast({
          type: "error",
          message: t(locale, "dropForge.settings.copyError"),
        });
      }
    }
  }

  const label = t(locale, "dropForge.settings.copy");
  let feedback = label;
  if (status === "copied") feedback = t(locale, "dropForge.settings.copied");
  if (status === "error") feedback = t(locale, "dropForge.settings.copyError");

  return (
    <>
      <CustomTooltip content={feedback} placement="top">
        <Button
          variant="ghost"
          size={null}
          className="tw-size-8"
          onClick={() => void copyAddress()}
          aria-label={label}
        >
          {status === "copied" ? (
            <CheckIcon
              aria-hidden="true"
              className="tw-size-4 tw-text-emerald-300"
            />
          ) : (
            <DocumentDuplicateIcon aria-hidden="true" className="tw-size-4" />
          )}
        </Button>
      </CustomTooltip>
      <output className="tw-sr-only">
        {status === "idle" ? "" : feedback}
      </output>
    </>
  );
}
