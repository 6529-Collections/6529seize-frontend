import { useAccount, useSignMessage } from "wagmi";
import {
  distributionPlanApiFetch,
  distributionPlanApiPost,
  removeDistributionPlanCookie,
  setDistributionPlanCookie,
} from "../../../services/distribution-plan-api";

import { makeErrorToast } from "../../../services/distribution-plan.utils";
import { useEffect } from "react";
import { useRouter } from "next/router";
interface DistributionPlanNonce {
  readonly nonce: string;
  readonly serverSignature: string;
}

export default function DistributionPlanToolConnected() {
  const signMessage = useSignMessage();
  const { address } = useAccount();
  const router = useRouter();

  const getSignature = async ({
    message,
  }: {
    message: string;
  }): Promise<string | null> => {
    try {
      const signedMessage = await signMessage.signMessageAsync({
        message,
      });
      return signedMessage;
    } catch (error: any) {
      makeErrorToast(error.toString());
      return null;
    }
  };

  const trySignIn = async () => {
    removeDistributionPlanCookie();
    const nonceResponse = await distributionPlanApiFetch<DistributionPlanNonce>(
      `/auth/nonce`
    );
    if (!nonceResponse) return;
    const { data: nonceData } = nonceResponse;
    if (!nonceData) return;
    const { nonce, serverSignature } = nonceData;
    const clientSignature = await getSignature({ message: nonce });
    if (!clientSignature) return;
    const tokenResponse = await distributionPlanApiPost<{ token: string }>({
      endpoint: "/auth/login",
      body: {
        serverSignature,
        clientSignature,
      },
    });

    if (!tokenResponse) return;
    const { data: tokenData } = tokenResponse;
    if (!tokenData) return;
    const { token } = tokenData;
    if (!token) return;
    setDistributionPlanCookie(token);
    router.push("/distribution-plan-tool/plans");
  };

  useEffect(() => {
    removeDistributionPlanCookie();
  }, []);

  return (
    <div className="tw-flex tw-flex-col">
      <h1 className="tw-uppercase tw-text-white">Sign in</h1>
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
      <div>
        <button
          onClick={trySignIn}
          type="submit"
          className="tw-group tw-flex tw-gap-x-3 tw-items-center tw-justify-center tw-bg-primary-500 tw-px-6 tw-py-3.5 tw-font-medium tw-text-sm tw-text-white tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          Sign In with Web3
        </button>
      </div>
    </div>
  );
}
