import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../auth/Auth";
import { useAccount } from "wagmi";
import { useRouter } from "next/router";
import { Inter } from "next/font/google";

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

export default function UserSetUpProfileCta() {
  const { connectedProfile } = useContext(AuthContext);
  const { address } = useAccount();
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
    <div
      className={`tailwind-scope tw-mx-2 ${inter.className} ${
        show ? "" : "tw-hidden"
      }`}
    >
      <button
        onClick={goToSetUpProfile}
        className="tw-inline-flex tw-items-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 hover:tw-ring-primary-600 placeholder:tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-shadow-sm hover:tw-bg-primary-600 tw-transition tw-duration-300 tw-ease-out"
      >
        Create profile
      </button>
    </div>
  );
}
