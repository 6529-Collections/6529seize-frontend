"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/utils/button/Button";
import { getEncryptedConversationRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import type { E2eeConversation, E2eeEngine } from "@/lib/e2ee/types";
import { getE2eeActionErrorKey } from "../e2eeErrors";
import { E2eeBanner } from "../ui/E2eeBanner";

interface E2eeConversationBannersProps {
  readonly conversation: E2eeConversation;
  readonly engine: E2eeEngine;
  readonly onCompareSafetyCodes: () => void;
}

/** Contract 8.6 banners: invalid change, split view, delayed changes. */
export function E2eeConversationBanners({
  conversation,
  engine,
  onCompareSafetyCodes,
}: E2eeConversationBannersProps) {
  const locale = useBrowserLocale();
  const router = useRouter();
  const [restarting, setRestarting] = useState(false);
  const [restartErrorKey, setRestartErrorKey] = useState<MessageKey | null>(
    null
  );

  const restart = async () => {
    setRestarting(true);
    setRestartErrorKey(null);
    try {
      const g = await engine.restart(conversation.g);
      router.push(getEncryptedConversationRoute(g));
    } catch (error) {
      setRestartErrorKey(
        getE2eeActionErrorKey(error, "e2ee.banner.restartFailed")
      );
      setRestarting(false);
    }
  };

  const banners = [];
  if (conversation.status === "invalid") {
    banners.push(
      <E2eeBanner
        key="invalid"
        tone="danger"
        action={
          <Button
            variant="secondary"
            size="xs"
            loading={restarting}
            onClick={() => void restart()}
          >
            {t(locale, "e2ee.banner.restart")}
          </Button>
        }
      >
        <span>{t(locale, "e2ee.banner.invalid")}</span>
        {restartErrorKey ? (
          <span role="alert" className="tw-mt-1 tw-block tw-text-rose-200">
            {t(locale, restartErrorKey)}
          </span>
        ) : null}
      </E2eeBanner>
    );
  }
  if (conversation.splitView) {
    banners.push(
      <E2eeBanner
        key="split-view"
        tone="danger"
        action={
          <Button variant="secondary" size="xs" onClick={onCompareSafetyCodes}>
            {t(locale, "e2ee.banner.splitViewAction")}
          </Button>
        }
      >
        {t(locale, "e2ee.banner.splitView")}
      </E2eeBanner>
    );
  }
  if (conversation.delayed && conversation.status === "active") {
    banners.push(
      <E2eeBanner key="delayed" tone="warning">
        {t(locale, "e2ee.banner.delayed")}
      </E2eeBanner>
    );
  }
  if (conversation.status === "left" || conversation.status === "removed") {
    banners.push(
      <E2eeBanner key="membership" tone="info">
        {t(
          locale,
          conversation.status === "left"
            ? "e2ee.banner.left"
            : "e2ee.banner.removed"
        )}
      </E2eeBanner>
    );
  }

  if (conversation.status === "restored") {
    banners.push(
      <E2eeBanner key="restored" tone="info">
        {t(locale, "e2ee.banner.restored")}
      </E2eeBanner>
    );
  }

  if (banners.length === 0) {
    return null;
  }
  return (
    <div className="tw-flex tw-flex-shrink-0 tw-flex-col tw-gap-2 tw-px-4 tw-py-2">
      {banners}
    </div>
  );
}
