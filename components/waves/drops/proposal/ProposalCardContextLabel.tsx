"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { createContext, useContext, type ReactNode } from "react";

const ProposalCardContextLabelVisibilityContext = createContext(true);

export function ProposalCardContextLabelVisibilityProvider({
  children,
  visible,
}: {
  readonly children: ReactNode;
  readonly visible: boolean;
}) {
  return (
    <ProposalCardContextLabelVisibilityContext.Provider value={visible}>
      {children}
    </ProposalCardContextLabelVisibilityContext.Provider>
  );
}

export default function ProposalCardContextLabel() {
  const locale = useBrowserLocale();
  const isVisible = useContext(ProposalCardContextLabelVisibilityContext);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      data-testid="proposal-card-context-label"
      className="tw-mb-2 tw-inline-flex tw-w-fit tw-items-center tw-gap-2"
    >
      <span
        aria-hidden="true"
        className="tw-flex tw-size-5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-primary-400/20 tw-bg-primary-400/10"
      >
        <span className="tw-size-1.5 tw-rounded-full tw-bg-primary-300 tw-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
      </span>
      <span className="tw-text-[10px] tw-font-bold tw-uppercase tw-leading-none tw-tracking-[0.14em] tw-text-primary-300">
        {t(locale, "waves.proposalCard.contextLabel")}
      </span>
    </div>
  );
}
