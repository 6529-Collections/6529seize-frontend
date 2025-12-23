"use client";

import { publicEnv } from "@/config/env";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { isWaveDirectMessage } from "@/helpers/waves/wave.helpers";
import React, { useState } from "react";
import { Tooltip } from "react-tooltip";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";

interface WaveDropActionsCopyLinkProps {
  readonly drop: ApiDrop;
}

const WaveDropActionsCopyLink: React.FC<WaveDropActionsCopyLinkProps> = ({
  drop,
}) => {
  const [copied, setCopied] = useState(false);
  const myStream = useMyStreamOptional();
  const directMessageWaves = myStream?.directMessages.list ?? [];

  const isTemporaryDrop = (drop: ApiDrop): boolean => {
    return drop.id.startsWith("temp-");
  };

  const copyToClipboard = () => {
    if (isTemporaryDrop(drop)) return;

    const waveDetails =
      (drop.wave as unknown as {
        chat?: { scope?: { group?: { is_direct_message?: boolean } } };
      }) ?? undefined;
    const isDirectMessage = isWaveDirectMessage(
      drop.wave.id,
      waveDetails,
      directMessageWaves
    );
    const dropLink = `${publicEnv.BASE_ENDPOINT}${getWaveRoute({
      waveId: drop.wave.id,
      serialNo: drop.serial_no,
      isDirectMessage,
      isApp: false,
    })}`;
    navigator.clipboard.writeText(dropLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isDisabled = isTemporaryDrop(drop);

  const getLinkText = () => {
    if (isDisabled) return "Unavailable";
    if (copied) return "Copied!";
    return "Copy link";
  };

  return (
    <>
      <button
        className={`tw-text-iron-500 icon tw-px-2 tw-h-full tw-group tw-bg-transparent tw-rounded-full tw-border-0 tw-flex tw-items-center tw-gap-x-2 tw-text-[0.8125rem] tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300 ${
          isDisabled ? "tw-opacity-50 tw-cursor-default" : "tw-cursor-pointer"
        }`}
        onClick={copyToClipboard}
        disabled={isDisabled}
        aria-label="Copy link"
        data-tooltip-id={!isDisabled ? `copy-link-${drop.id}` : undefined}>
        <svg
          className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
          />
        </svg>
      </button>
      {!isDisabled && (
        <Tooltip
          id={`copy-link-${drop.id}`}
          place="top"
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
          }}>
          <span className="tw-text-xs">{getLinkText()}</span>
        </Tooltip>
      )}
    </>
  );
};

export default WaveDropActionsCopyLink;
