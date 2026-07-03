import { useIdentity } from "@/hooks/useIdentity";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { Fragment } from "react";
import type { ElementType } from "react";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";

type MenuItem = {
  readonly label: string;
  readonly path?: string | undefined;
  readonly icon?: ElementType | undefined;
  readonly children?: MenuItem[] | undefined;
  readonly section?: boolean | undefined;
  readonly dividerBefore?: boolean | undefined;
};

function getItemKey(item: MenuItem): string {
  return item.path ?? item.label;
}

function hasMenuChildren(
  item: MenuItem
): item is MenuItem & { readonly children: MenuItem[] } {
  return (item.children?.length ?? 0) > 0;
}

function getItemHref(item: MenuItem, profilePath: string): string {
  return item.path === "/profile" ? profilePath : (item.path ?? "#");
}

function SidebarChildLink({
  item,
  onNavigate,
  profilePath,
  nested = false,
}: {
  readonly item: MenuItem;
  readonly onNavigate: () => void;
  readonly profilePath: string;
  readonly nested?: boolean | undefined;
}) {
  return (
    <Link
      href={getItemHref(item, profilePath)}
      onClick={onNavigate}
      className={clsx(
        "tw-block tw-rounded-lg tw-px-4 tw-py-2 tw-font-medium tw-text-iron-300 tw-no-underline tw-transition-colors tw-duration-200 active:tw-bg-iron-800",
        nested ? "tw-text-sm" : "tw-text-base"
      )}
    >
      {item.label}
    </Link>
  );
}

function SidebarNestedSection({
  item,
  onNavigate,
  profilePath,
}: {
  readonly item: MenuItem;
  readonly onNavigate: () => void;
  readonly profilePath: string;
}) {
  const childItems = item.children ?? [];

  return (
    <Disclosure as="div" className="tw-w-full">
      {({ open }) => (
        <>
          <DisclosureButton className="tw-flex tw-w-full tw-items-center tw-justify-between tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-2.5 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400 tw-transition-colors tw-duration-200 active:tw-bg-iron-800">
            <span className="tw-min-w-0 tw-flex-1 tw-break-words">
              {item.label}
            </span>
            <ChevronDownIcon
              className={clsx(
                "tw-ml-3 tw-size-4 tw-flex-shrink-0 tw-text-iron-500 tw-transition-transform tw-duration-200",
                open ? "tw-rotate-180" : undefined
              )}
              aria-hidden="true"
            />
          </DisclosureButton>
          <DisclosurePanel className="tw-space-y-1 tw-pb-1 tw-pl-3">
            {childItems.map((child) => (
              <SidebarPanelItem
                key={getItemKey(child)}
                item={child}
                onNavigate={onNavigate}
                profilePath={profilePath}
                nested
              />
            ))}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}

function SidebarPanelItem({
  item,
  onNavigate,
  profilePath,
  nested = false,
}: {
  readonly item: MenuItem;
  readonly onNavigate: () => void;
  readonly profilePath: string;
  readonly nested?: boolean | undefined;
}) {
  if (item.section === true) {
    if (hasMenuChildren(item)) {
      return (
        <SidebarNestedSection
          item={item}
          onNavigate={onNavigate}
          profilePath={profilePath}
        />
      );
    }

    if (item.label) {
      return (
        <span className="tw-block tw-px-4 tw-py-2 tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500">
          {item.label}
        </span>
      );
    }

    return null;
  }

  return (
    <SidebarChildLink
      item={item}
      onNavigate={onNavigate}
      profilePath={profilePath}
      nested={nested}
    />
  );
}

function SidebarItemIcon({
  icon: Icon,
  className,
}: {
  readonly icon: ElementType | undefined;
  readonly className: string;
}) {
  if (Icon === undefined) {
    return null;
  }

  return <Icon className={className} />;
}

function shouldShowChildDivider(items: readonly MenuItem[], index: number) {
  const item = items[index];

  if (item?.dividerBefore === true) {
    return true;
  }

  if (item?.section !== true) {
    return false;
  }

  return items.slice(0, index).some((previous) => previous.section === true);
}

function TopLevelMenuItem({
  item,
  onNavigate,
  profilePath,
}: {
  readonly item: MenuItem;
  readonly onNavigate: () => void;
  readonly profilePath: string;
}) {
  if (hasMenuChildren(item)) {
    return (
      <Disclosure as="div" className="tw-w-full">
        {({ open }) => (
          <>
            <DisclosureButton className="tw-flex tw-w-full tw-items-center tw-justify-between tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-50 tw-transition-colors tw-duration-200 active:tw-bg-iron-800">
              <div className="tw-flex tw-items-center tw-space-x-4 tw-text-base">
                <SidebarItemIcon
                  icon={item.icon}
                  className="tw-size-6 tw-flex-shrink-0"
                />
                <span>{item.label}</span>
              </div>
              <ChevronDownIcon
                className={clsx(
                  "tw-size-4 tw-flex-shrink-0 tw-text-iron-300 tw-transition-transform tw-duration-200",
                  open ? "tw-rotate-180" : undefined
                )}
              />
            </DisclosureButton>
            <DisclosurePanel className="tw-space-y-1 tw-pl-10 tw-pt-2">
              {item.children.map((child, idx) => {
                const showDivider = shouldShowChildDivider(item.children, idx);

                return (
                  <Fragment key={getItemKey(child)}>
                    {showDivider ? (
                      <div className="tw-mx-4 tw-my-3 tw-h-px tw-bg-iron-800" />
                    ) : null}
                    <SidebarPanelItem
                      item={child}
                      onNavigate={onNavigate}
                      profilePath={profilePath}
                    />
                  </Fragment>
                );
              })}
            </DisclosurePanel>
          </>
        )}
      </Disclosure>
    );
  }

  if (item.path !== undefined) {
    return (
      <Link
        href={item.path === "/profile" ? profilePath : item.path}
        onClick={onNavigate}
        className="tw-flex tw-items-center tw-space-x-4 tw-rounded-lg tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
      >
        <SidebarItemIcon
          icon={item.icon}
          className="tw-h-5 tw-w-5 tw-flex-shrink-0"
        />
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <button
      onClick={onNavigate}
      className="tw-flex tw-w-full tw-items-center tw-space-x-3 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3 tw-text-base tw-font-semibold tw-text-iron-50 tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
    >
      <SidebarItemIcon
        icon={item.icon}
        className="tw-h-5 tw-w-5 tw-flex-shrink-0"
      />
      <span>{item.label}</span>
    </button>
  );
}

export default function AppSidebarMenuItems({
  menu,
  onNavigate,
}: {
  readonly menu: MenuItem[];
  readonly onNavigate: () => void;
}) {
  const { address } = useSeizeConnectContext();

  const { profile } = useIdentity({
    handleOrWallet: address ?? null,
    initialProfile: null,
  });

  const profilePath = (() => {
    if (profile?.handle) return `/${profile.handle.toLowerCase()}`;
    if (address) return `/${address.toLowerCase()}`;
    return "/profile";
  })();

  const visibleMenu = menu.filter((item) => {
    if (item.path === "/profile") {
      return !!address;
    }
    return true;
  });

  return (
    <>
      <ul className="tw-list-none tw-space-y-2 tw-pl-0">
        {visibleMenu.map((item) => (
          <li key={item.label}>
            <TopLevelMenuItem
              item={item}
              onNavigate={onNavigate}
              profilePath={profilePath}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
