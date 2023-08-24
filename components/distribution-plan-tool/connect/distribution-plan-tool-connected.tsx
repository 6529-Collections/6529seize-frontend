import { useSignMessage } from "wagmi";
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
      "/auth/nonce"
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
      <h1 className="tw-uppercase tw-text-white">Connect wallet</h1>
      <p className="tw-m-0 tw-text-base tw-font-light tw-text-neutral-300">
        Lorem ipsum dolor sit amet.
      </p>
      <div className="tw-mt-8">
        <button
          onClick={trySignIn}
          type="submit"
          className="tw-group tw-flex tw-gap-x-3 tw-items-center tw-justify-center tw-bg-primary-500 tw-px-6 tw-py-3 tw-font-medium tw-text-sm tw-text-white tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          <svg
            className="tw-flex-shrink-0 -tw-ml-2 tw-h-6 tw-w-6 group-hover:tw-scale-105 tw-transition tw-duration-300 tw-ease-out"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            viewBox="0 0 204.8 192.4"
          >
            <g id="bg_x28_do_not_export_x29_" className="tw-hidden"></g>
            <g id="MM_Head_background__x28_Do_not_edit_x29_">
              <g>
                <path
                  fill="#F5841F"
                  d="M167.4,96.1l6.9-8.1l-3-2.2l4.8-4.4l-3.7-2.8l4.8-3.6l-3.1-2.4l5-24.4l-7.6-22.6 M171.5,25.6l-48.8,18.1l0,0
l0,0H82l0,0L33.2,25.6l0.3,0.2l-0.3-0.2l-7.6,22.6l5.1,24.4L27.5,75l4.9,3.6l-3.7,2.8l4.8,4.4l-3,2.2l6.9,8.1l-10.5,32.4h0l0,0
l9.7,33.1l34.1-9.4l0-0.1l0,0.1l0,0l0,0l0,0v0l0,0l0,0l0,0l6.6,5.4l13.5,9.2h23.1l13.5-9.2l6.6-5.4l0,0v0l0,0l0,0l34.2,9.4
l9.8-33.1l0,0h0l-10.6-32.4 M70.7,152.1L70.7,152.1L70.7,152.1"
                />
              </g>
            </g>
            <g id="Logos">
              <g>
                <polygon
                  fill="#E27625"
                  points="171.5,25.6 111.6,69.7 122.7,43.7 		"
                />
                <polygon fill="#E27625" points="33.2,25.6 92.6,70.1 82,43.7 		" />
                <polygon
                  fill="#E27625"
                  points="150,127.9 134,152.1 168.2,161.5 178,128.4 		"
                />
                <polygon
                  fill="#E27625"
                  points="26.9,128.4 36.6,161.5 70.7,152.1 54.8,127.9 		"
                />
                <polygon
                  fill="#E27625"
                  points="68.9,86.9 59.4,101.2 93.2,102.7 92.1,66.5 		"
                />
                <polygon
                  fill="#E27625"
                  points="135.9,86.9 112.3,66.1 111.6,102.7 145.4,101.2 		"
                />
                <polygon
                  fill="#E27625"
                  points="70.7,152.1 91.2,142.3 73.5,128.7 		"
                />
                <polygon
                  fill="#E27625"
                  points="113.6,142.3 134,152.1 131.2,128.7 		"
                />
                <polygon
                  fill="#D7C1B3"
                  points="134,152.1 113.6,142.3 115.3,155.5 115.1,161.1 		"
                />
                <polygon
                  fill="#D7C1B3"
                  points="70.7,152.1 89.7,161.1 89.6,155.5 91.2,142.3 		"
                />
                <polygon
                  fill="#2F343B"
                  points="90,119.9 73.1,115 85.1,109.5 		"
                />
                <polygon
                  fill="#2F343B"
                  points="114.7,119.9 119.7,109.5 131.7,115 		"
                />
                <polygon
                  fill="#CC6228"
                  points="70.7,152.1 73.7,127.9 54.8,128.4 		"
                />
                <polygon
                  fill="#CC6228"
                  points="131.1,127.9 134,152.1 150,128.4 		"
                />
                <polygon
                  fill="#CC6228"
                  points="145.4,101.2 111.6,102.7 114.7,119.9 119.7,109.5 131.7,115 		"
                />
                <polygon
                  fill="#CC6228"
                  points="73.1,115 85.1,109.5 90,119.9 93.2,102.7 59.4,101.2 		"
                />
                <polygon
                  fill="#E27625"
                  points="59.4,101.2 73.5,128.7 73.1,115 		"
                />
                <polygon
                  fill="#E27625"
                  points="131.7,115 131.2,128.7 145.4,101.2 		"
                />
                <polygon
                  fill="#E27625"
                  points="93.2,102.7 90,119.9 94,140.3 94.9,113.5 		"
                />
                <polygon
                  fill="#E27625"
                  points="111.6,102.7 109.9,113.4 110.7,140.3 114.7,119.9 		"
                />
                <polygon
                  fill="#F5841F"
                  points="114.7,119.9 110.7,140.3 113.6,142.3 131.2,128.7 131.7,115 		"
                />
                <polygon
                  fill="#F5841F"
                  points="73.1,115 73.5,128.7 91.2,142.3 94,140.3 90,119.9 		"
                />
                <polygon
                  fill="#C0AD9E"
                  points="115.1,161.1 115.3,155.5 113.7,154.2 91,154.2 89.6,155.5 89.7,161.1 70.7,152.1 77.3,157.5 
90.8,166.8 113.9,166.8 127.4,157.5 134,152.1 		"
                />
                <polygon
                  fill="#2F343B"
                  points="113.6,142.3 110.7,140.3 94,140.3 91.2,142.3 89.6,155.5 91,154.2 113.7,154.2 115.3,155.5 		"
                />
                <polygon
                  fill="#763E1A"
                  points="174.1,72.6 179.1,48.2 171.5,25.6 113.6,68.2 135.9,86.9 167.4,96.1 174.3,88 171.3,85.8 176.1,81.5 
172.4,78.6 177.2,75 		"
                />
                <polygon
                  fill="#763E1A"
                  points="25.6,48.2 30.7,72.6 27.5,75 32.3,78.7 28.6,81.5 33.4,85.8 30.4,88 37.4,96.1 68.9,86.9 91.2,68.2 
33.2,25.6 		"
                />
                <polygon
                  fill="#F5841F"
                  points="167.4,96.1 135.9,86.9 145.4,101.2 131.2,128.7 150,128.4 178,128.4 		"
                />
                <polygon
                  fill="#F5841F"
                  points="68.9,86.9 37.4,96.1 26.9,128.4 54.8,128.4 73.5,128.7 59.4,101.2 		"
                />
                <polygon
                  fill="#F5841F"
                  points="111.6,102.7 113.6,68.2 122.7,43.7 82,43.7 91.2,68.2 93.2,102.7 94,113.5 94,140.3 110.7,140.3 
110.8,113.5 		"
                />
              </g>
            </g>
          </svg>
          Continue with Metamask
        </button>
      </div>

    </div>
  );
}
