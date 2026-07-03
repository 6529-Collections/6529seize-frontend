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
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";

type MenuItem = {
  readonly label: string;
  readonly path?: string | undefined;
  readonly icon?: React.ElementType | undefined;
  readonly children?: MenuItem[] | undefined;
  readonly section?: boolean | undefined;
  readonly dividerBefore?: boolean | undefined;
};

interface MenuItemRenderProps {
  readonly item: MenuItem;
  readonly onNavigate: () => void;
  readonly profilePath: string;
}

interface ChildMenuItemProps {
  readonly child: MenuItem;
  readonly index: number;
  readonly onNavigate: () => void;
  readonly profilePath: string;
}

const getMenuItemHref = (path: string, profilePath: string): string =>
  path === "/profile" ? profilePath : path;

const getChildHref = (child: MenuItem, profilePath: string): string =>
  child.path === undefined ? "#" : getMenuItemHref(child.path, profilePath);

function AppSidebarMenuIcon({
  icon: Icon,
  className,
}: {
  readonly icon: React.ElementType | undefined;
  readonly className: string;
}) {
  if (Icon === undefined) {
    return null;
  }

  return <Icon className={className} />;
}

function AppSidebarChildMenuItem({
  child,
  index,
  onNavigate,
  profilePath,
}: ChildMenuItemProps) {
  const showDivider =
    (child.section === true && index !== 0) || child.dividerBefore === true;
  const childHref = getChildHref(child, profilePath);

  let childElement: React.ReactNode = null;

  if (child.section === true) {
    if (Boolean(child.label)) {
      childElement = (
        <span className="tw-block tw-px-4 tw-py-2 tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500">
          {child.label}
        </span>
      );
    }
  } else {
    childElement = (
      <Link
        href={childHref}
        onClick={onNavigate}
        className="tw-block tw-rounded-lg tw-px-4 tw-py-2 tw-text-base tw-font-medium tw-text-iron-300 tw-no-underline tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
      >
        {child.label}
      </Link>
    );
  }

  return (
    <Fragment key={`${child.label}-${index}`}>
      {showDivider ? (
        <div className="tw-mx-4 tw-my-3 tw-h-px tw-bg-iron-800" />
      ) : null}
      {childElement}
    </Fragment>
  );
}

function AppSidebarDisclosureMenuItem({
  item,
  onNavigate,
  profilePath,
}: MenuItemRenderProps) {
  const children = item.children;

  if (children === undefined) {
    return null;
  }

  return (
    <Disclosure as="div" className="tw-w-full">
      {({ open }) => (
        <>
          <DisclosureButton className="tw-flex tw-w-full tw-items-center tw-justify-between tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-50 tw-transition-colors tw-duration-200 active:tw-bg-iron-800">
            <div className="tw-flex tw-items-center tw-space-x-4 tw-text-base">
              <AppSidebarMenuIcon
                icon={item.icon}
                className="tw-size-6 tw-flex-shrink-0"
              />
              <span>{item.label}</span>
            </div>
            <ChevronDownIcon
              className={clsx(
                "tw-size-4 tw-flex-shrink-0 tw-text-iron-300 tw-transition-transform tw-duration-200",
                open && "tw-rotate-180"
              )}
            />
          </DisclosureButton>
          <DisclosurePanel className="tw-space-y-1 tw-pl-10 tw-pt-2">
            {children.map((child, index) => (
              <AppSidebarChildMenuItem
                key={`${child.label}-${index}`}
                child={child}
                index={index}
                onNavigate={onNavigate}
                profilePath={profilePath}
              />
            ))}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
}

function AppSidebarLinkMenuItem({
  item,
  onNavigate,
  profilePath,
}: MenuItemRenderProps) {
  if (item.path === undefined) {
    return null;
  }

  return (
    <Link
      href={getMenuItemHref(item.path, profilePath)}
      onClick={onNavigate}
      className="tw-flex tw-items-center tw-space-x-4 tw-rounded-lg tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
    >
      <AppSidebarMenuIcon
        icon={item.icon}
        className="tw-h-5 tw-w-5 tw-flex-shrink-0"
      />
      <span>{item.label}</span>
    </Link>
  );
}

function AppSidebarButtonMenuItem({
  item,
  onNavigate,
}: Pick<MenuItemRenderProps, "item" | "onNavigate">) {
  return (
    <button
      onClick={onNavigate}
      className="tw-flex tw-w-full tw-items-center tw-space-x-3 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3 tw-text-base tw-font-semibold tw-text-iron-50 tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
    >
      <AppSidebarMenuIcon
        icon={item.icon}
        className="tw-h-5 tw-w-5 tw-flex-shrink-0"
      />
      <span>{item.label}</span>
    </button>
  );
}

function AppSidebarMenuRow(props: MenuItemRenderProps) {
  const { item } = props;

  if (item.children !== undefined) {
    return <AppSidebarDisclosureMenuItem {...props} />;
  }

  if (item.path !== undefined) {
    return <AppSidebarLinkMenuItem {...props} />;
  }

  return <AppSidebarButtonMenuItem item={item} onNavigate={props.onNavigate} />;
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
      return address !== undefined;
    }
    return true;
  });

  return (
    <>
      <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-pl-0">
        {visibleMenu.map((item) => (
          <li key={item.label}>
            <AppSidebarMenuRow
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
