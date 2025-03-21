import React, { useState } from "react";

import {
  CommunityMemberMinimal,
  IProfileAndConsolidations,
} from "../../../entities/IProfile";
import useIsMobileScreen from "../../../hooks/isMobileScreen";
import GroupCreateIdentitiesSelect from "../../groups/page/create/config/identities/select/GroupCreateIdentitiesSelect";
import { areEqualAddresses } from "../../../helpers/Helpers";
import { useAuth } from "../../auth/Auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { createDirectMessageWave } from "../../../helpers/waves/waves.helpers";
import { useRouter } from "next/router";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";

export default function CreateDirectMessage({
  profile,
  onBack,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly onBack: () => void;
}) {
  const isMobile = useIsMobileScreen();
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const { setToast } = useAuth();

  const [selectedIdentities, setSelectedIdentities] = useState<
    CommunityMemberMinimal[]
  >([]);

  const onIdentitySelect = (identity: CommunityMemberMinimal) => {
    if (areEqualAddresses(identity.wallet, profile.profile?.primary_wallet!)) {
      setToast({
        message: "You are included by default in a Direct Message!",
        type: "info",
      });
      return;
    }
    setSelectedIdentities([...selectedIdentities, identity]);
  };

  const onRemove = (id: string) => {
    if (areEqualAddresses(id, profile.profile?.primary_wallet!)) {
      setToast({
        message: "You cannot remove yourself from the DM",
        type: "error",
      });
      return;
    }

    setSelectedIdentities(
      selectedIdentities.filter((i) => !areEqualAddresses(i.wallet, id))
    );
  };

  const onCreateDirectMessage = async () => {
    setIsCreating(true);
    try {
      const wave = await createDirectMessageWave({
        addresses: selectedIdentities.map((i) => i.wallet),
      });
      router.push(`/waves/${wave.id}`);
    } catch (error) {
      console.error(error);
      setToast({
        message: "Failed to create Direct Message",
        type: "error",
      });
      setIsCreating(false);
    }
  };

  return (
    <div className="tailwind-scope tw-bg-iron-950 tw-mt-6 lg:tw-mt-8 tw-pb-16 lg:tw-pb-28 tw-px-4 xl:tw-px-0 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto tw-min-h-screen">
      <div className="tw-h-full tw-w-full">
        <div className="xl:tw-max-w-[60rem] tw-mx-auto">
          <button
            onClick={onBack}
            type="button"
            className="tw-py-2 tw-px-2 -tw-ml-2 tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50">
            <svg
              className="tw-flex-shrink-0 tw-w-5 tw-h-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 12H4M4 12L10 18M4 12L10 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"></path>
            </svg>
            <span>Back</span>
          </button>
          <div
            className={`tw-mb-0 tw-font-bold ${
              isMobile ? "tw-text-3xl" : "tw-text-5xl"
            }`}>
            Create Direct Message
          </div>
          <div className="tw-mt-4 tw-text-sm tw-text-iron-400">
            <GroupCreateIdentitiesSelect
              onIdentitySelect={onIdentitySelect}
              selectedIdentities={selectedIdentities}
              selectedWallets={[]}
              onRemove={onRemove}
            />
          </div>
          <div className="tw-mt-4 tw-flex tw-justify-end">
            <button
              disabled={selectedIdentities.length === 0 || isCreating}
              onClick={onCreateDirectMessage}
              type="button"
              className="tw-flex tw-gap-x-2 tw-items-center tw-whitespace-nowrap tw-rounded-lg tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-shadow-sm tw-transition tw-duration-300 tw-ease-out
    tw-border tw-border-solid 
    tw-bg-primary-500 tw-text-white tw-border-primary-500 
    hover:tw-bg-primary-600 hover:tw-border-primary-600
    focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600
    disabled:tw-bg-gray-300 disabled:tw-text-gray-500 disabled:tw-border-gray-300 disabled:hover:tw-bg-gray-300 disabled:tw-cursor-not-allowed">
              {isCreating ? (
                <CircleLoader size={CircleLoaderSize.MEDIUM} />
              ) : (
                <FontAwesomeIcon
                  icon={faPaperPlane}
                  className="tw-h-5 tw-w-5"
                />
              )}
              <span className="tw-text-lg">
                {isCreating ? "Creating..." : "Create"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
