import { CheckIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function CopyWalletAddressButton({
  address,
}: Readonly<{ address: string }>) {
  const locale = useBrowserLocale();
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
      if (current === request.current) setStatus("error");
    }
  }

  return (
    <div className="tw-mt-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => void copyAddress()}
        aria-label={t(locale, "dropForge.settings.copy")}
      >
        <span
          aria-hidden="true"
          className="tw-inline-grid tw-place-items-center"
        >
          <span
            className={`tw-col-start-1 tw-row-start-1 ${status === "copied" ? "tw-invisible" : ""}`}
          >
            {t(locale, "dropForge.settings.copy")}
          </span>
          <span
            className={`tw-col-start-1 tw-row-start-1 tw-inline-flex tw-items-center tw-gap-1.5 ${status === "copied" ? "" : "tw-invisible"}`}
          >
            <CheckIcon className="tw-size-4" />
            {t(locale, "dropForge.settings.copied")}
          </span>
        </span>
      </Button>
      <span role="status" className="tw-sr-only">
        {status === "copied" ? t(locale, "dropForge.settings.copied") : ""}
      </span>
      <p
        aria-live="polite"
        className="tw-mb-0 tw-mt-1 tw-grid tw-text-xs tw-text-rose-300"
      >
        <span
          aria-hidden="true"
          className="tw-invisible tw-col-start-1 tw-row-start-1"
        >
          {t(locale, "dropForge.settings.copyError")}
        </span>
        {status === "error" && (
          <span className="tw-col-start-1 tw-row-start-1">
            {t(locale, "dropForge.settings.copyError")}
          </span>
        )}
      </p>
    </div>
  );
}
