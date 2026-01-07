"use client";

import React, { useContext, useCallback, useState } from "react";
import { Tooltip } from "react-tooltip";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropBoostMutation } from "@/hooks/drops/useDropBoostMutation";
import { AuthContext } from "@/components/auth/Auth";
import { motion, AnimatePresence } from "framer-motion";

interface WaveDropActionsBoostProps {
  readonly drop: ExtendedDrop;
}

const WaveDropActionsBoost: React.FC<WaveDropActionsBoostProps> = ({
  drop,
}) => {
  const { connectedProfile, setToast } = useContext(AuthContext);
  const { toggleBoost, isPending } = useDropBoostMutation();
  const [isAnimating, setIsAnimating] = useState(false);

  const isTemporaryDrop = drop.id.startsWith("temp-");
  const canBoost = !isTemporaryDrop && !!connectedProfile;
  const isPinned = drop.context_profile_context?.pinned ?? false;
  const boostCount = drop.pins;

  const handleClick = useCallback(() => {
    if (!canBoost || isPending) return;

    setIsAnimating(true);
    toggleBoost(drop);

    const action = isPinned ? "Boost removed" : "Boosted!";
    setToast({
      message: action,
      type: "success",
    });

    // Reset animation state
    setTimeout(() => setIsAnimating(false), 300);
  }, [canBoost, isPending, toggleBoost, drop, isPinned, setToast]);

  const tooltipId = `boost-drop-${drop.id}`;

  return (
    <>
      <button
        className={`tw-group/boost tw-flex tw-h-full tw-items-center tw-gap-x-1 tw-rounded-full tw-border-0 tw-bg-transparent tw-px-2 tw-text-xs tw-font-medium tw-leading-5 tw-transition tw-duration-300 tw-ease-out ${
          canBoost ? "tw-cursor-pointer" : "tw-cursor-default tw-opacity-50"
        } ${
          isPinned
            ? "tw-text-orange-400 hover:tw-text-orange-300"
            : "tw-text-iron-500 hover:tw-text-orange-400"
        }`}
        onClick={handleClick}
        disabled={!canBoost || isPending}
        aria-label={isPinned ? "Remove boost from drop" : "Boost drop"}
        {...(canBoost ? { "data-tooltip-id": tooltipId } : {})}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isPinned ? "boosted" : "not-boosted"}
            initial={isAnimating ? { scale: 0.5, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <svg
              className={`tw-size-5 tw-flex-shrink-0 tw-transition tw-duration-300 tw-ease-out ${
                isPinned ? "tw-drop-shadow-[0_0_4px_rgba(251,146,60,0.5)]" : ""
              }`}
              viewBox="0 0 24 24"
              fill={isPinned ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={isPinned ? 0 : 1.5}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 23C16.1421 23 19.5 19.6421 19.5 15.5C19.5 14.1685 19.1755 12.9177 18.6062 11.8214C17.7863 13.0488 16.5 13.5 15.5 13C15.5 11 14.5 8 12 5.5C11 8 10.5 9.5 9 11C8.11281 11.8872 7.5 13.1287 7.5 14.5C7.5 15.5 8 17 9 18C8 17.5 7 16.5 6.5 15C5.83333 16 5 17.5 5 19C5 20.5 5.5 21.5 6.5 22.5C8 21 8.5 20 8.5 19C8.5 20.5 9.5 22 11 23H12Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </AnimatePresence>
        {boostCount > 0 && (
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
            {isPinned ? "Remove Boost" : "Boost"}
          </span>
        </Tooltip>
      )}
    </>
  );
};

export default WaveDropActionsBoost;
