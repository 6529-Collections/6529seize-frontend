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

  const getMenuItemHref = (path: string): string =>
    path === "/profile" ? profilePath : path;

  return (
    <>
      <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-pl-0">
        {visibleMenu.map((item) => (
          <li key={item.label}>
            {(() => {
              const children = item.children;

              if (children !== undefined) {
                return (
                  <Disclosure as="div" className="tw-w-full">
                    {({ open }) => (
                      <>
                        <DisclosureButton className="tw-flex tw-w-full tw-items-center tw-justify-between tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-50 tw-transition-colors tw-duration-200 active:tw-bg-iron-800">
                          <div className="tw-flex tw-items-center tw-space-x-4 tw-text-base">
                            {item.icon !== undefined && (
                              <item.icon className="tw-size-6 tw-flex-shrink-0" />
                            )}
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
                          {children.map((child, idx) => {
                            let childElement: React.ReactNode = null;

                            if (child.section === true) {
                              if (child.label !== "") {
                                childElement = (
                                  <span className="tw-block tw-px-4 tw-py-2 tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500">
                                    {child.label}
                                  </span>
                                );
                              }
                            } else {
                              const childHref =
                                child.path !== undefined
                                  ? getMenuItemHref(child.path)
                                  : "#";

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
                              <Fragment key={`${child.label}-${idx}`}>
                                {(child.section === true && idx !== 0) ||
                                child.dividerBefore === true ? (
                                  <div className="tw-mx-4 tw-my-3 tw-h-px tw-bg-iron-800" />
                                ) : null}
                                {childElement}
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
                    href={getMenuItemHref(item.path)}
                    onClick={onNavigate}
                    className="tw-flex tw-items-center tw-space-x-4 tw-rounded-lg tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-50 tw-no-underline tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
                  >
                    {item.icon !== undefined && (
                      <item.icon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
                    )}
                    <span>{item.label}</span>
                  </Link>
                );
              }

              return (
                <button
                  onClick={onNavigate}
                  className="tw-flex tw-w-full tw-items-center tw-space-x-3 tw-rounded-lg tw-border-none tw-bg-transparent tw-px-4 tw-py-3 tw-text-base tw-font-semibold tw-text-iron-50 tw-transition-colors tw-duration-200 active:tw-bg-iron-800"
                >
                  {item.icon !== undefined && (
                    <item.icon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
                  )}
                  <span>{item.label}</span>
                </button>
              );
            })()}
          </li>
        ))}
      </ul>
    </>
  );
}
