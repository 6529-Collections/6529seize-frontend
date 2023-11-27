import { useWeb3Modal } from "@web3modal/react";
import { useContext, useState } from "react";
import { useAccount } from "wagmi";
import { AuthContext } from "../../auth/Auth";
import UserPageIdentityRateModal from "./UserPageIdentityRateModal";

export default function UserPageIdentityRateButton({
  targetHandle,
}: {
  targetHandle: string;
}) {
  const { open } = useWeb3Modal();
  const { address } = useAccount();
  const { requestAuth } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onCICRate = async () => {
    if (!address) {
      await open();
      return;
    }
    const { success } = await requestAuth();
    if (!success) {
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={onCICRate}
        className="tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
      >
        Rate
      </button>
      <UserPageIdentityRateModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        targetHandle={targetHandle}
      />
    </>
  );
}
