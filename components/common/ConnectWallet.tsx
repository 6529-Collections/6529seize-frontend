"use client";

import Image from "next/image";
import React, { type ReactNode } from "react";
import HeaderUserConnect from "../header/user/HeaderUserConnect";

interface ConnectWalletProps {
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly action?: ReactNode | undefined;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({
  title = "This content is only available to connected wallets.",
  description = "Connect your wallet to continue.",
  action,
}) => {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-8 tw-px-6 tw-py-16 md:tw-h-[100dvh] md:tw-flex-row">
      <Image
        unoptimized
        priority
        loading="eager"
        src="https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/279.WEBP"
        alt="Brain"
        width={304}
        height={450}
        className="tw-h-auto tw-max-w-[30vw] tw-rounded-md tw-shadow-lg md:tw-max-w-[200px]"
      />
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-4 tw-text-center md:tw-items-start md:tw-text-left">
        <h1 className="tw-text-xl tw-font-bold">{title}</h1>
        <p className="tw-text-base tw-text-gray-400">{description}</p>
        {action ?? <HeaderUserConnect />}
      </div>
    </div>
  );
};

export default ConnectWallet;
