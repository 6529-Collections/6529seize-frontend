"use client";

import { AuthContext } from "@/components/auth/Auth";
import BoostIcon from "@/components/common/icons/BoostIcon";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropBoostMutation } from "@/hooks/drops/useDropBoostMutation";
import { AnimatePresence, motion } from "framer-motion";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Tooltip } from "react-tooltip";

interface WaveDropActionsBoostProps {
  readonly drop: ExtendedDrop;
  readonly showCount?: boolean;
}

const WaveDropActionsBoost: React.FC<WaveDropActionsBoostProps> = ({
  drop,
  showCount = true,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  const { toggleBoost, isPending } = useDropBoostMutation();
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isTemporaryDrop = drop.id.startsWith("temp-");
  const canBoost = !isTemporaryDrop && !!connectedProfile;
  const isBoosted = drop.context_profile_context?.boosted ?? false;
  const boostCount = drop.boosts;

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = useCallback(() => {
    if (!canBoost || isPending) return;

    // Clear any existing timeout before setting a new one
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    setIsAnimating(true);
    toggleBoost(drop);

    // Reset animation state
    animationTimeoutRef.current = setTimeout(() => setIsAnimating(false), 300);
  }, [canBoost, isPending, toggleBoost, drop]);

  const tooltipId = `boost-drop-${drop.id}`;

  return (
    <>
      <button
        className={`tw-group/boost tw-flex tw-h-full tw-items-center tw-gap-x-1 tw-rounded-full tw-border-0 tw-bg-transparent tw-px-2 tw-text-xs tw-font-medium tw-leading-5 tw-transition tw-duration-300 tw-ease-out ${
          canBoost ? "tw-cursor-pointer" : "tw-cursor-default tw-opacity-50"
        } ${
          isBoosted
            ? "tw-text-orange-400 hover:tw-text-orange-300"
            : "tw-text-iron-500 hover:tw-text-orange-400"
        }`}
        onClick={handleClick}
        disabled={!canBoost || isPending}
        aria-label={isBoosted ? "Remove boost from drop" : "Boost drop"}
        {...(canBoost ? { "data-tooltip-id": tooltipId } : {})}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isBoosted ? "boosted" : "not-boosted"}
            initial={isAnimating ? { scale: 0.5, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="tw-flex tw-items-center"
          >
            <BoostIcon
              className={`tw-size-5 tw-flex-shrink-0 tw-transition tw-duration-300 tw-ease-out ${
                isBoosted ? "tw-drop-shadow-[0_0_4px_rgba(251,146,60,0.5)]" : ""
              }`}
              variant={isBoosted ? "filled" : "outlined"}
            />
          </motion.div>
        </AnimatePresence>
        {showCount && boostCount > 0 && (
          <motion.span
            key={boostCount}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="tw-text-xs tw-font-medium"
          >
            {boostCount}
          </motion.span>
        )}
      </button>
      {canBoost && (
        <Tooltip
          id={tooltipId}
          place="top"
          positionStrategy="fixed"
          offset={8}
          opacity={1}
          style={{
            padding: "4px 8px",
            background: "#37373E",
            color: "white",
            fontSize: "13px",
            fontWeight: 500,
            borderRadius: "6px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            zIndex: 99999,
            pointerEvents: "none",
          }}
        >
          <span className="tw-text-xs">
            {isBoosted ? "Remove Boost" : "Boost"}
          </span>
        </Tooltip>
      )}
    </>
  );
};

export default WaveDropActionsBoost;
