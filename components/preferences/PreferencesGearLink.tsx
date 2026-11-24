import {
  getPreferencesHref,
  type PreferencesRouteTab,
} from "@/helpers/preferences-navigation";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";

export default function PreferencesGearLink({
  tab,
  label,
  className,
  onNavigate,
}: {
  readonly tab?: PreferencesRouteTab | undefined;
  readonly label: string;
  readonly className?: string | undefined;
  readonly onNavigate?: (() => void) | undefined;
}) {
  return (
    <Link
      href={getPreferencesHref({ tab })}
      aria-label={label}
      title={label}
      onNavigate={() => onNavigate?.()}
      className={clsx(
        "tw-inline-flex tw-size-8 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100",
        className
      )}
    >
      <Cog6ToothIcon aria-hidden="true" className="tw-size-5" />
    </Link>
  );
}
