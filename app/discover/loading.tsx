import PrimaryRouteLoadingShell from "@/components/navigation/PrimaryRouteLoadingShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export default function Loading() {
  return (
    <PrimaryRouteLoadingShell
      ariaLabel={t(DEFAULT_LOCALE, "navigation.primary.loading.discovery")}
      variant="cards"
    />
  );
}
