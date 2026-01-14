"use client";

import { AuthContext, useAuth } from "@/components/auth/Auth";
import { Spinner } from "@/components/dotLoader/DotLoader";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useCallback, useContext, useMemo, useState } from "react";
import { Tooltip } from "react-tooltip";

function HideLinkPreviewIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="-2 -2 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M4.52393 6.25C4.52393 5.83579 4.85971 5.5 5.27393 5.5H18.7297C19.1439 5.5 19.4797 5.83579 19.4797 6.25V9.75C19.4797 10.1642 19.1439 10.5 18.7297 10.5H5.27393C4.85971 10.5 4.52393 10.1642 4.52393 9.75V6.25ZM6.02393 7V9H17.9797V7H6.02393Z"
        fill="currentColor"
      />
      <path
        d="M14.2297 11.979C13.8155 11.979 13.4797 12.3148 13.4797 12.729V17.229C13.4797 17.6432 13.8155 17.979 14.2297 17.979H18.7297C19.1439 17.979 19.4797 17.6432 19.4797 17.229V12.729C19.4797 12.3148 19.1439 11.979 18.7297 11.979H14.2297ZM14.9797 16.479V13.479H17.9797V16.479H14.9797Z"
        fill="currentColor"
      />
      <path
        d="M4.52393 13.25C4.52393 12.8358 4.85971 12.5 5.27393 12.5H11.25C11.6642 12.5 12 12.8358 12 13.25C12 13.6642 11.6642 14 11.25 14H5.27393C4.85971 14 4.52393 13.6642 4.52393 13.25Z"
        fill="currentColor"
      />
      <path
        d="M5.27393 16C4.85971 16 4.52393 16.3358 4.52393 16.75C4.52393 17.1642 4.85971 17.5 5.27393 17.5H11.25C11.6642 17.5 12 17.1642 12 16.75C12 16.3358 11.6642 16 11.25 16H5.27393Z"
        fill="currentColor"
      />
      <path
        d="M2 5.75C2 4.23122 3.23122 3 4.75 3H19.25C20.7688 3 22 4.23122 22 5.75V18.25C22 19.7688 20.7688 21 19.25 21H4.75C3.23122 21 2 19.7688 2 18.25V5.75ZM4.75 4.5C4.05964 4.5 3.5 5.05964 3.5 5.75V18.25C3.5 18.9404 4.05964 19.5 4.75 19.5H19.25C19.9404 19.5 20.5 18.9404 20.5 18.25V5.75C20.5 5.05964 19.9404 4.5 19.25 4.5H4.75Z"
        fill="currentColor"
      />
      <line
        x1="2"
        y1="2"
        x2="22"
        y2="22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShowLinkPreviewIcon({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="-2 -2 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M4.52393 6.25C4.52393 5.83579 4.85971 5.5 5.27393 5.5H18.7297C19.1439 5.5 19.4797 5.83579 19.4797 6.25V9.75C19.4797 10.1642 19.1439 10.5 18.7297 10.5H5.27393C4.85971 10.5 4.52393 10.1642 4.52393 9.75V6.25ZM6.02393 7V9H17.9797V7H6.02393Z"
        fill="currentColor"
      />
      <path
        d="M14.2297 11.979C13.8155 11.979 13.4797 12.3148 13.4797 12.729V17.229C13.4797 17.6432 13.8155 17.979 14.2297 17.979H18.7297C19.1439 17.979 19.4797 17.6432 19.4797 17.229V12.729C19.4797 12.3148 19.1439 11.979 18.7297 11.979H14.2297ZM14.9797 16.479V13.479H17.9797V16.479H14.9797Z"
        fill="currentColor"
      />
      <path
        d="M4.52393 13.25C4.52393 12.8358 4.85971 12.5 5.27393 12.5H11.25C11.6642 12.5 12 12.8358 12 13.25C12 13.6642 11.6642 14 11.25 14H5.27393C4.85971 14 4.52393 13.6642 4.52393 13.25Z"
        fill="currentColor"
      />
      <path
        d="M5.27393 16C4.85971 16 4.52393 16.3358 4.52393 16.75C4.52393 17.1642 4.85971 17.5 5.27393 17.5H11.25C11.6642 17.5 12 17.1642 12 16.75C12 16.3358 11.6642 16 11.25 16H5.27393Z"
        fill="currentColor"
      />
      <path
        d="M2 5.75C2 4.23122 3.23122 3 4.75 3H19.25C20.7688 3 22 4.23122 22 5.75V18.25C22 19.7688 20.7688 21 19.25 21H4.75C3.23122 21 2 19.7688 2 18.25V5.75ZM4.75 4.5C4.05964 4.5 3.5 5.05964 3.5 5.75V18.25C3.5 18.9404 4.05964 19.5 4.75 19.5H19.25C19.9404 19.5 20.5 18.9404 20.5 18.25V5.75C20.5 5.05964 19.9404 4.5 19.25 4.5H4.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-z0-9@:%._+~#=]{1,256}\.[a-z0-9]{1,6}\b([-a-z0-9@:%_+.~#?&=/]*)/gi;

function dropHasLinks(drop: ExtendedDrop): boolean {
  for (const part of drop.parts) {
    if (part.content && URL_REGEX.test(part.content)) {
      URL_REGEX.lastIndex = 0;
      return true;
    }
    URL_REGEX.lastIndex = 0;
  }
  return false;
}

function ToggleIcon({
  loading,
  previewsHidden,
  isMobile,
}: {
  readonly loading: boolean;
  readonly previewsHidden: boolean;
  readonly isMobile: boolean;
}) {
  if (loading) {
    return <Spinner dimension={20} />;
  }

  const mobileClassName = "tw-size-5 tw-flex-shrink-0 tw-text-iron-300";
  const desktopClassName =
    "tw-flex-shrink-0 tw-w-5 tw-h-5 tw-transition tw-ease-out tw-duration-300";
  const className = isMobile ? mobileClassName : desktopClassName;

  if (previewsHidden) {
    return <ShowLinkPreviewIcon className={className} />;
  }
  return <HideLinkPreviewIcon className={className} />;
}

interface WaveDropActionsToggleLinkPreviewProps {
  readonly drop: ExtendedDrop;
  readonly isMobile?: boolean | undefined;
  readonly onToggle?: (() => void) | undefined;
}

export default function WaveDropActionsToggleLinkPreview({
  drop,
  isMobile = false,
  onToggle,
}: WaveDropActionsToggleLinkPreviewProps) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { setToast } = useAuth();
  const { applyOptimisticDropUpdate } = useMyStream();
  const [loading, setLoading] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const hasLinks = useMemo(() => dropHasLinks(drop), [drop]);

  const isAuthor =
    connectedProfile?.handle === drop.author.handle && !activeProfileProxy;

  const previewsHidden = drop.hide_link_preview;

  const labelText = previewsHidden
    ? "Show Link Previews"
    : "Hide Link Previews";

  const handleToggle = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setTooltipOpen(false);

    const rollbackHandle = applyOptimisticDropUpdate({
      waveId: drop.wave.id,
      dropId: drop.id,
      update: (draft) => {
        if (draft.type !== DropSize.FULL) {
          return draft;
        }
        draft.hide_link_preview = !draft.hide_link_preview;
        return draft;
      },
    });

    try {
      await commonApiPost<Record<string, never>, ApiDrop>({
        endpoint: `drops/${drop.id}/toggle-hide-link-preview`,
        body: {},
      });
      onToggle?.();
    } catch (error) {
      rollbackHandle?.rollback();
      setToast({
        message:
          typeof error === "string" ? error : "Failed to toggle link preview",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    applyOptimisticDropUpdate,
    drop.wave.id,
    drop.id,
    onToggle,
    setToast,
  ]);

  if (!isAuthor || !hasLinks) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    e.stopPropagation();
    handleToggle();
  };

  const buttonClassName = loading
    ? "tw-opacity-50 tw-cursor-default"
    : "active:tw-bg-iron-800";

  if (isMobile) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={`tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 ${buttonClassName} tw-transition-colors tw-duration-200`}
      >
        <ToggleIcon
          loading={loading}
          previewsHidden={previewsHidden}
          isMobile={true}
        />
        <span className="tw-text-base tw-font-semibold tw-text-iron-300">
          {labelText}
        </span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="icon tw-group tw-flex tw-h-full tw-items-center tw-gap-x-2 tw-rounded-full tw-border-0 tw-bg-transparent tw-px-2 tw-text-[0.8125rem] tw-font-medium tw-leading-5 tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-300"
        aria-label={
          previewsHidden ? "Show link previews" : "Hide link previews"
        }
        data-tooltip-id={`toggle-link-preview-${drop.id}`}
      >
        <ToggleIcon
          loading={loading}
          previewsHidden={previewsHidden}
          isMobile={false}
        />
      </button>
      <Tooltip
        id={`toggle-link-preview-${drop.id}`}
        place="top"
        offset={8}
        opacity={1}
        isOpen={tooltipOpen}
        setIsOpen={setTooltipOpen}
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
        <span className="tw-text-xs">{labelText}</span>
      </Tooltip>
    </>
  );
}
