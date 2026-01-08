"use client";

import { AuthContext } from "@/components/auth/Auth";
import BoostIcon from "@/components/common/icons/BoostIcon";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropBoostMutation } from "@/hooks/drops/useDropBoostMutation";
import type { FC } from "react";
import { useContext, useState } from "react";

interface WaveDropMobileMenuBoostProps {
  readonly drop: ExtendedDrop;
  readonly onBoostChange: () => void;
  readonly onBoostAnimation?: (() => void) | undefined;
}

const WaveDropMobileMenuBoost: FC<WaveDropMobileMenuBoostProps> = ({
  drop,
  onBoostChange,
  onBoostAnimation,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  const { toggleBoost, isPending } = useDropBoostMutation();
  const [isLocalPending, setIsLocalPending] = useState(false);

  const isTemporaryDrop = drop.id.startsWith("temp-");
  const canBoost = !isTemporaryDrop && !!connectedProfile;
  const isBoosted = drop.context_profile_context?.boosted ?? false;
  const isLoading = isPending || isLocalPending;

  const handleClick = () => {
    if (!canBoost || isLoading) return;

    setIsLocalPending(true);
    try {
      onBoostAnimation?.();
      toggleBoost(drop);
      onBoostChange();
    } catch (error) {
      console.error("Failed to toggle boost:", error);
    } finally {
      setIsLocalPending(false);
    }
  };

  if (!canBoost) {
    return null;
  }

  return (
    <button
      className={`tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 ${
        isLoading ? "tw-cursor-default tw-opacity-50" : "active:tw-bg-iron-800"
      } tw-transition-colors tw-duration-200`}
      onClick={handleClick}
      disabled={isLoading}
    >
      <BoostIcon
        className={`tw-size-5 tw-flex-shrink-0 ${
          isBoosted ? "tw-text-orange-400" : "tw-text-iron-300"
        }`}
        variant={isBoosted ? "filled" : "outlined"}
      />
      <span
        className={`tw-text-base tw-font-semibold ${
          isBoosted ? "tw-text-orange-400" : "tw-text-iron-300"
        }`}
      >
        {isBoosted ? "Remove Boost" : "Boost"}
      </span>
    </button>
  );
};

export default WaveDropMobileMenuBoost;
