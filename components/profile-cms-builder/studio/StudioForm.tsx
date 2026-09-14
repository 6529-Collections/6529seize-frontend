import { useRef, type ReactNode } from "react";

import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { StudioButton } from "./StudioControls";

export interface StudioFormState {
  readonly pending: boolean;
  readonly onPendingChange: (pending: boolean) => void;
  readonly onDiscard: () => void;
}

/** Keep incomplete local inputs until their one atomic Apply succeeds or is discarded. */
export default function StudioForm({
  locale,
  state,
  onSubmit,
  children,
}: {
  readonly locale: SupportedLocale;
  readonly state: StudioFormState;
  readonly onSubmit: () => boolean;
  readonly children: ReactNode;
}) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={form}
      data-studio-pending={state.pending}
      className="tw-space-y-5"
      onChangeCapture={() => state.onPendingChange(true)}
      onSubmit={(event) => {
        event.preventDefault();
        if (onSubmit()) state.onPendingChange(false);
        else
          globalThis.queueMicrotask(() => {
            const invalid = form.current?.querySelector<HTMLElement>(
              '[aria-invalid="true"]'
            );
            (
              invalid ??
              form.current?.querySelector<HTMLElement>("input,textarea,select")
            )?.focus();
          });
      }}
    >
      {children}
      {state.pending ? (
        <div className="tw-space-y-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-p-3">
          <p
            role="status"
            className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-200"
          >
            {t(locale, "profileCms.studio.pendingForm")}
          </p>
          <StudioButton onClick={state.onDiscard}>
            {t(locale, "profileCms.studio.discardForm")}
          </StudioButton>
        </div>
      ) : null}
    </form>
  );
}
