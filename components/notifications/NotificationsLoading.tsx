"use client";

import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import SpinnerLoader from "@/components/common/SpinnerLoader";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function NotificationsLoading() {
  const locale = useBrowserLocale();
  const { notificationsViewStyle } = useLayout();

  return (
    <div
      className="tailwind-scope tw-flex tw-h-full tw-min-h-80 tw-flex-1 tw-items-center tw-justify-center tw-bg-black"
      data-testid="notifications-loading"
      style={notificationsViewStyle}
    >
      <SpinnerLoader
        text={t(locale, "navigation.primary.loading.notifications")}
      />
    </div>
  );
}
