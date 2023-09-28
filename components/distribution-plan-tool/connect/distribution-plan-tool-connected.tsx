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
      `/auth/nonce/${address}`
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
    <div className="tw-text-center tw-flex tw-flex-col tw-items-center">
      <h1 className="tw-uppercase tw-text-white">Sign in</h1>
      <p className="tw-m-0 tw-text-base tw-font-light tw-text-neutral-300">
        To verify your identity, please sign the message using your wallet.
        Always ensure you review what you&apos;re signing.
      </p>
      <div className="tw-mt-8">
        <button
          onClick={trySignIn}
          type="submit"
          className="tw-group tw-flex tw-gap-x-3 tw-items-center tw-justify-center tw-bg-primary-500 tw-px-6 tw-py-3 tw-font-medium tw-text-sm tw-text-white tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
