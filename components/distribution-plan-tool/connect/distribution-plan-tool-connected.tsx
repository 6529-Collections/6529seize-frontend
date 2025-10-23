"use client";

import { useRouter } from "next/navigation";
import { useContext } from "react";
import { AuthContext } from "@/components/auth/Auth";
import PrimaryButton from "@/components/utils/button/PrimaryButton";

export default function DistributionPlanToolConnected() {
  const { requestAuth } = useContext(AuthContext);
  const router = useRouter();

  const trySignIn = async () => {
    const { success } = await requestAuth();
    if (!success) return;
    router.push("/emma/plans");
  };

  return (
    <div className="tw-flex tw-flex-col">
      <h1 className="tw-text-white">
        Sign in
      </h1>
      <div className="tw-mb-6 tw-max-w-2xl">
        <ul className="tw-text-justify tw-space-y-1 tw-mb-0 tw-mt-2 tw-text-base tw-leading-[1.6] tw-font-normal tw-text-neutral-300">
          <li>
            Sign in with an address that&apos;s a part of your consolidated
            account to proceed, so that we can verify your TDH to grant you
            access.
          </li>
          <li>No special delegation is required.</li>
          <li>Review the message carefully.</li>
          <li>Please don&apos;t connect your vault.</li>
          <li>
            No gas is needed to sign in, and there is currently no cost or fee
            to use the tool.
          </li>
        </ul>
      </div>
      <div className="tw-flex">
        <PrimaryButton onClicked={trySignIn} disabled={false} loading={false}>
          Sign In with Web3
        </PrimaryButton>
      </div>
    </div>
  );
}
