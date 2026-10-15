"use client";

import { useContext, useEffect, useState, type JSX } from "react";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import ProxyActions from "../proxy/list/ProxyActions";
import { AuthContext } from "@/components/auth/Auth";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import ProxyCreateAction from "../proxy/create-action/ProxyCreateAction";
import CommonChangeAnimation from "@/components/utils/animation/CommonChangeAnimation";
import { PROFILE_PROXY_AVAILABLE_ACTIONS } from "@/entities/IProxy";
import Link from "next/link";
import Button from "@/components/utils/button/Button";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";

enum VIEW_TYPE {
  LIST = "LIST",
  CREATE_NEW = "CREATE_NEW",
}

export default function ProxyListItem({
  isSelf,
  profileProxy,
  profile,
}: {
  readonly isSelf: boolean;
  readonly profileProxy: ApiProfileProxy;
  readonly profile: ApiIdentity;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const getIsGrantor = () =>
    connectedProfile?.id === profileProxy?.created_by?.id;

  const [isGrantor, setIsGrantor] = useState(getIsGrantor());

  const [viewType, setViewType] = useState(VIEW_TYPE.LIST);
  const getCanAddNewAction = () => {
    const haveActionsLeftToAdd =
      PROFILE_PROXY_AVAILABLE_ACTIONS.filter(
        (action) =>
          profileProxy.actions.filter((a) => a.action_type === action)
            .length === 0
      ).length > 0;

    return (
      haveActionsLeftToAdd && isGrantor && isSelf && viewType === VIEW_TYPE.LIST
    );
  };

  const [canAddNewAction, setCanAddNewAction] = useState(getCanAddNewAction());

  useEffect(() => {
    setIsGrantor(getIsGrantor());
  }, [profileProxy, connectedProfile]);

  useEffect(() => {
    setCanAddNewAction(getCanAddNewAction());
  }, [isGrantor, isSelf, viewType, profileProxy]);

  const components: Record<VIEW_TYPE, JSX.Element> = {
    [VIEW_TYPE.LIST]: (
      <ProxyActions
        profileProxy={profileProxy}
        profile={profile}
        isSelf={isSelf}
      />
    ),
    [VIEW_TYPE.CREATE_NEW]: (
      <div className="tw-mt-4">
        <ProxyCreateAction
          profileProxy={profileProxy}
          onActionCreated={() => setViewType(VIEW_TYPE.LIST)}
          onCancel={() => setViewType(VIEW_TYPE.LIST)}
        />
      </div>
    ),
  };
  return (
    <div>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2.5 tw-gap-y-2">
        <Link
          href={`/${profileProxy.created_by.handle ?? profileProxy.created_by.primary_address}/proxy`}
          className="tw-min-w-0 tw-no-underline">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-2">
            {profileProxy.created_by.pfp ? (
              <img
                src={getScaledImageUri(
                  profileProxy.created_by.pfp,
                  ImageScale.W_AUTO_H_50
                )}
                alt="Profile picture"
                className="tw-h-[22px] tw-w-[22px] tw-flex-none tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/[0.08]"
              />
            ) : (
              <div className="tw-h-[22px] tw-w-[22px] tw-flex-none tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/[0.08]"></div>
            )}
            <p className="tw-m-0 tw-min-w-0 tw-break-all tw-flex-auto tw-font-semibold tw-text-iron-50 hover:tw-text-iron-400 tw-text-sm tw-leading-5 tw-transition tw-duration-300 tw-ease-out">
              {profileProxy.created_by.handle ??
                profileProxy.created_by.primary_address}
            </p>
          </div>
        </Link>
        <svg
          className="tw-h-3.5 tw-w-3.5 tw-flex-none tw-text-iron-600"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 12H20M20 12L14 6M20 12L14 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-gap-x-4">
          <Link
            href={`/${profileProxy.granted_to.handle ?? profileProxy.granted_to.primary_address}/proxy`}
            className="tw-group tw-min-w-0 tw-no-underline">
            <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-2">
              {profileProxy.granted_to.pfp ? (
                <img
                  src={getScaledImageUri(
                    profileProxy.granted_to.pfp,
                    ImageScale.W_AUTO_H_50
                  )}
                  alt="Profile picture"
                  className="tw-h-[22px] tw-w-[22px] tw-flex-none tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/[0.08]"
                />
              ) : (
                <div className="tw-h-[22px] tw-w-[22px] tw-flex-none tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-white/[0.08]"></div>
              )}
              <p className="tw-m-0 tw-min-w-0 tw-break-all tw-flex-auto tw-font-semibold tw-text-iron-50 tw-text-sm tw-leading-5 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out">
                {profileProxy.granted_to.handle ??
                  profileProxy.granted_to.primary_address}
              </p>
            </div>
          </Link>
        </div>
        <div>
          {canAddNewAction && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setViewType(VIEW_TYPE.CREATE_NEW)}
            >
              <svg
                className="tw-w-5 tw-h-5 tw-mr-1.5 -tw-ml-1"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 5V19M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Add A Proxy</span>
            </Button>
          )}
        </div>
      </div>
      <div>
        <CommonChangeAnimation>{components[viewType]}</CommonChangeAnimation>
      </div>
    </div>
  );
}
