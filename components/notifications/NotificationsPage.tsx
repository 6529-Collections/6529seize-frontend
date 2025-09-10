"use client";

import React, { useState } from "react";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import HeaderUserConnect from "../header/user/HeaderUserConnect";
import Image from "next/image";
import Notifications from "../brain/notifications/Notifications";
import { ActiveDropState } from "../../types/dropInteractionTypes";

export default function NotificationsPage() {
  const { isAuthenticated } = useSeizeConnectContext();
  const [activeDrop, setActiveDrop] = useState<ActiveDropState | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="tw-flex tw-flex-col md:tw-flex-row tw-items-center tw-justify-center tw-gap-8 tw-min-h-[95vh] tw-p-6">
        <Image
          unoptimized
          priority
          loading="eager"
          src="https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/279.WEBP"
          alt="Brain"
          width={304}
          height={450}
          className="tw-rounded-md tw-shadow-lg tw-max-w-[30vw] md:tw-max-w-[200px] tw-h-auto"
        />
        <div className="tw-flex tw-flex-col tw-items-center md:tw-items-start tw-text-center md:tw-text-left tw-gap-4">
          <h1 className="tw-text-xl tw-font-bold">
            This content is only available to connected wallets.
          </h1>
          <p className="tw-text-base tw-text-gray-400">
            Connect your wallet to continue.
          </p>
          <HeaderUserConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="tw-h-full tw-bg-black">
      <div className="tw-px-6">
        <Notifications activeDrop={activeDrop} setActiveDrop={setActiveDrop} />
      </div>
    </div>
  );
}
