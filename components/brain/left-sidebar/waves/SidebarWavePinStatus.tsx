import FontAwesomeSvgIcon from "@/components/common/icons/FontAwesomeSvgIcon";
import { faThumbtack } from "@fortawesome/free-solid-svg-icons";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export function SidebarWavePinStatus() {
  const locale = useBrowserLocale();
  return (
    <span
      data-testid="wave-pin-status"
      className="tw-inline-flex tw-shrink-0 tw-items-center tw-px-1 tw-text-iron-500"
    >
      <FontAwesomeSvgIcon
        icon={faThumbtack}
        className="tw-size-3 tw-rotate-[-45deg]"
      />
      <span className="tw-sr-only">{t(locale, "waves.sidebar.pinned")}</span>
    </span>
  );
}
