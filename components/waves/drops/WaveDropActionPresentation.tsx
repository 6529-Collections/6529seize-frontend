import type { WaveDropProps } from "./WaveDrop.types";
import { shouldShowTouchActionsButton } from "./WaveDrop.helpers";
import WaveDropActionsMore from "./WaveDropActionsMore";

export const getWaveDropActionPresentation = ({
  drop,
  showStandaloneActionsButton,
  showInteractions,
  showReplyAndQuote,
  isMobileLayoutViewport,
  canUseTouchActionSheet,
  isEditing,
  identityMode,
}: {
  readonly drop: WaveDropProps["drop"];
  readonly showStandaloneActionsButton: boolean;
  readonly showInteractions: boolean;
  readonly showReplyAndQuote: boolean;
  readonly isMobileLayoutViewport: boolean;
  readonly canUseTouchActionSheet: boolean;
  readonly isEditing: boolean;
  readonly identityMode: NonNullable<WaveDropProps["identityMode"]>;
}) => {
  const canUseMobileActionsSheet =
    canUseTouchActionSheet ||
    (showStandaloneActionsButton && isMobileLayoutViewport);

  if (!showStandaloneActionsButton) {
    return {
      canUseMobileActionsSheet,
      showActionsButton: shouldShowTouchActionsButton({
        showInteractions,
        hasTouch: canUseTouchActionSheet,
        showReplyAndQuote,
        isEditing,
        identityMode,
      }),
      showActionsButtonOnMobile: false,
      desktopActions: undefined,
    };
  }

  return {
    canUseMobileActionsSheet,
    showActionsButton:
      showInteractions &&
      isMobileLayoutViewport &&
      !isEditing &&
      identityMode === "default",
    showActionsButtonOnMobile: isMobileLayoutViewport,
    desktopActions: isMobileLayoutViewport ? undefined : (
      <WaveDropActionsMore drop={drop} showOnlyQuickRemove />
    ),
  };
};
