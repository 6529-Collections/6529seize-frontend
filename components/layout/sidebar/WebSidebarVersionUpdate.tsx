"use client";

import { useWebVersionUpdate } from "@/components/version-update/useWebVersionUpdate";
import { VERSION_RELOAD_IMAGE_SRC } from "@/components/version-update/versionReloadImage";
import { refreshAppVersion } from "@/helpers/version-refresh.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import WebSidebarNavItem from "./nav/WebSidebarNavItem";

function UpdateRocketIcon({
  className,
}: {
  readonly className?: string | undefined;
}) {
  return (
    // react-doctor-disable-next-line react-doctor/nextjs-no-img-element the small hash-named WebP the reload cover already caches, served as-is.
    <img
      src={VERSION_RELOAD_IMAGE_SRC}
      alt=""
      width={24}
      height={24}
      className={className}
    />
  );
}

export default function WebSidebarVersionUpdate({
  collapsed,
}: {
  readonly collapsed: boolean;
}) {
  const surface = useWebVersionUpdate();
  const locale = useBrowserLocale();
  if (surface !== "sidebar") return null;

  return (
    <WebSidebarNavItem
      onClick={refreshAppVersion}
      icon={UpdateRocketIcon}
      active={false}
      collapsed={collapsed}
      label={t(locale, "newVersionToast.update")}
    />
  );
}
