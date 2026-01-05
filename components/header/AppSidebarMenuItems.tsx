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
      return !!address;
    }
    return true;
  });

  return (
    <>
      <ul className="tw-space-y-2 tw-pl-0 tw-list-none">
        {visibleMenu.map((item) => (
          <li key={item.label}>
            {item.children ? (
              <Disclosure as="div" className="tw-w-full">
                {({ open }) => (
                  <>
                    <DisclosureButton className="tw-bg-transparent tw-border-none tw-w-full tw-flex tw-justify-between tw-items-center tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-50 active:tw-bg-iron-800  tw-rounded-lg tw-transition-colors tw-duration-200">
                      <div className="tw-flex tw-items-center tw-space-x-4 tw-text-base">
                        {item.icon && (
                          <item.icon className="tw-size-6 tw-flex-shrink-0" />
                        )}
                        <span>{item.label}</span>
                      </div>
                      <ChevronDownIcon
                        className={clsx(
                          "tw-size-4 tw-transition-transform tw-duration-200 tw-flex-shrink-0 tw-text-iron-300",
                          open && "tw-rotate-180"
                        )}
                      />
                    </DisclosureButton>
                    <DisclosurePanel className="tw-pt-2 tw-pl-10 tw-space-y-1">
                      {(item.children ?? []).map((child, idx) => {
                        let childElement: React.ReactNode = null;

                        if (child.section) {
                          if (child.label) {
                            childElement = (
                              <span className="tw-block tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500 tw-px-4 tw-py-2">
                                {child.label}
                              </span>
                            );
                          }
                        } else {
                          childElement = (
                            <Link
                              href={
                                child.path === "/profile"
                                  ? profilePath
                                  : child.path ?? "#"
                              }
                              onClick={onNavigate}
                              className="tw-no-underline tw-block tw-text-base tw-px-4 tw-py-2 tw-text-iron-300 tw-font-medium active:tw-bg-iron-800 tw-rounded-lg tw-transition-colors tw-duration-200"
                            >
                              {child.label}
                            </Link>
                          );
                        }
                        return (
                          <Fragment key={child.label ?? `idx-${idx}`}>
                            {(child.section && idx !== 0) ||
                            child.dividerBefore ? (
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
            ) : item.path ? (
              <Link
                href={item.path === "/profile" ? profilePath : item.path}
                onClick={onNavigate}
                className="tw-no-underline tw-flex tw-items-center tw-space-x-4 tw-px-4 tw-py-3.5 tw-text-base tw-font-semibold tw-text-iron-50 active:tw-bg-iron-800  tw-rounded-lg tw-transition-colors tw-duration-200"
              >
                {item.icon && (
                  <item.icon className="tw-w-5 tw-h-5 tw-flex-shrink-0" />
                )}
                <span>{item.label}</span>
              </Link>
            ) : (
              <button
                onClick={onNavigate}
                className="tw-bg-transparent tw-border-none tw-w-full tw-flex tw-items-center tw-space-x-3 tw-px-4 tw-py-3 tw-text-base tw-font-semibold tw-text-iron-50 active:tw-bg-iron-800  tw-rounded-lg tw-transition-colors tw-duration-200"
              >
                {item.icon && (
                  <item.icon className="tw-w-5 tw-h-5 tw-flex-shrink-0" />
                )}
                <span>{item.label}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
