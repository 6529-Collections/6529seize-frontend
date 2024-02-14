import { useRouter } from "next/router";
import { useContext } from "react";
import { AuthContext } from "../../auth/Auth";

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
        <span className="font-lightest">Sign</span> in
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
      <div>
        <button
          onClick={trySignIn}
          type="submit"
          className="tw-group tw-flex tw-gap-x-3 tw-items-center tw-justify-center tw-bg-primary-500 tw-px-6 tw-py-3.5 tw-font-medium tw-text-sm tw-text-white tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out">
          Sign In with Web3
        </button>
      </div>
    </div>
  );
}
