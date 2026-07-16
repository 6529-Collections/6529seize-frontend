import {
  ChatBubbleLeftIcon,
  CheckIcon,
  LinkIcon,
  ShareIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import type { CompactMenuItem } from "@/components/compact-menu";
import ShareArrowIcon from "@/components/common/icons/ShareArrowIcon";
import type { useWaveShareCopyAction } from "@/hooks/waves/useWaveShareCopyAction";

export type HeaderMoreMenuItem = CompactMenuItem & {
  readonly renderAsDirectButton?: boolean | undefined;
  readonly directIcon?: ReactNode | undefined;
  readonly directActionActive?: boolean | undefined;
};

const getWaveLinkActionIcon = ({
  direct = false,
  isWaveLinkSharing,
  waveLinkActionFeedbackState,
  waveLinkActionMode,
}: {
  readonly direct?: boolean | undefined;
  readonly isWaveLinkSharing: boolean;
  readonly waveLinkActionFeedbackState: ReturnType<
    typeof useWaveShareCopyAction
  >["feedbackState"];
  readonly waveLinkActionMode: ReturnType<
    typeof useWaveShareCopyAction
  >["mode"];
}): ReactNode => {
  let waveLinkActionIconColor = "tw-text-emerald-300";
  if (direct && isWaveLinkSharing) {
    waveLinkActionIconColor = "tw-text-iron-50";
  } else if (waveLinkActionFeedbackState === "idle") {
    waveLinkActionIconColor = "tw-text-iron-300";
  }
  const iconSizeClassName = direct ? "tw-size-5" : "tw-size-4";
  const iconClassName = `${iconSizeClassName} ${waveLinkActionIconColor}`;

  if (waveLinkActionFeedbackState !== "idle") {
    return <CheckIcon className={iconClassName} />;
  }

  if (waveLinkActionMode === "share") {
    return direct ? (
      <ShareArrowIcon className={iconClassName} />
    ) : (
      <ShareIcon className={iconClassName} />
    );
  }

  return <LinkIcon className={iconClassName} />;
};

export const getAppHeaderMoreMenuItems = ({
  handleWaveLinkActionClick,
  isWaveLinkSharing,
  showGalleryToggle,
  showWaveLinkAction,
  toggleViewMode,
  viewMode,
  waveLinkActionFeedbackState,
  waveLinkActionLabel,
  waveLinkActionMode,
}: {
  readonly handleWaveLinkActionClick: () => void;
  readonly isWaveLinkSharing: boolean;
  readonly showGalleryToggle: boolean;
  readonly showWaveLinkAction: boolean;
  readonly toggleViewMode: () => void;
  readonly viewMode: string;
  readonly waveLinkActionFeedbackState: ReturnType<
    typeof useWaveShareCopyAction
  >["feedbackState"];
  readonly waveLinkActionLabel: string;
  readonly waveLinkActionMode: ReturnType<
    typeof useWaveShareCopyAction
  >["mode"];
}): HeaderMoreMenuItem[] => {
  const galleryToggleLabel =
    viewMode === "chat" ? "Switch to gallery view" : "Switch to chat view";
  const appHeaderMoreMenuItems: HeaderMoreMenuItem[] = [];

  if (showGalleryToggle) {
    appHeaderMoreMenuItems.push({
      id: "toggle-view-mode",
      label: galleryToggleLabel,
      icon:
        viewMode === "chat" ? (
          <Squares2X2Icon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
        ) : (
          <ChatBubbleLeftIcon className="tw-h-4 tw-w-4 tw-flex-shrink-0" />
        ),
      onSelect: toggleViewMode,
    });
  }

  if (showWaveLinkAction) {
    appHeaderMoreMenuItems.push({
      id: "wave-link",
      label: waveLinkActionLabel,
      ariaLabel: waveLinkActionLabel,
      icon: getWaveLinkActionIcon({
        isWaveLinkSharing,
        waveLinkActionFeedbackState,
        waveLinkActionMode,
      }),
      directIcon: getWaveLinkActionIcon({
        direct: true,
        isWaveLinkSharing,
        waveLinkActionFeedbackState,
        waveLinkActionMode,
      }),
      onSelect: handleWaveLinkActionClick,
      renderAsDirectButton: true,
      directActionActive: isWaveLinkSharing,
    });
  }

  return appHeaderMoreMenuItems;
};
