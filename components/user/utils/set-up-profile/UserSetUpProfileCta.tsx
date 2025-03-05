import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../../../auth/Auth";
import { useSeizeConnectContext } from "../../../auth/SeizeConnectContext";

export default function UserSetUpProfileCta() {
  const { connectedProfile } = useContext(AuthContext);
  const { address } = useSeizeConnectContext();
  const router = useRouter();

  const getShouldShow = (): boolean =>
    !!(connectedProfile && !connectedProfile.profile && address);

  const [show, setShow] = useState<boolean>(getShouldShow());
  useEffect(() => setShow(getShouldShow()), [connectedProfile]);

  const goToSetUpProfile = () => {
    if (!address) return;
    router.push(`/${address.toLowerCase()}/identity`);
  };

  return (
    <div className={`tailwind-scope tw-mr-3 ${show ? "" : "tw-hidden"}`}>
      <button
        onClick={goToSetUpProfile}
        className="tw-whitespace-nowrap tw-inline-flex tw-items-center tw-cursor-pointer tw-bg-primary-500 tw-rounded-lg tw-px-4 tw-py-2.5 tw-leading-6 tw-text-sm tw-font-semibold tw-text-white tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 hover:tw-ring-primary-600 placeholder:tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-shadow-sm hover:tw-bg-primary-600 tw-transition tw-duration-300 tw-ease-out">
        Create profile
      </button>
    </div>
  );
}
