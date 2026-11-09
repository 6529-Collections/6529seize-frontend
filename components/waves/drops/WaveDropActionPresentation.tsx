import type { WaveDropProps } from "./WaveDrop.types";
import { shouldShowTouchActionsButton } from "./WaveDrop.helpers";
import WaveDropActionsMore from "./WaveDropActionsMore";

export const getWaveDropActionPresentation = ({
  drop,
  showStandaloneActionsButton,
  standaloneQuickRemoveCuration,
  showInteractions,
  showReplyAndQuote,
  isMobileLayoutViewport,
  canUseTouchActionSheet,
  isEditing,
  identityMode,
}: {
  readonly drop: WaveDropProps["drop"];
  readonly showStandaloneActionsButton: boolean;
  readonly standaloneQuickRemoveCuration: WaveDropProps["standaloneQuickRemoveCuration"];
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

  const hasStandaloneAction =
    Boolean(standaloneQuickRemoveCuration) && !drop.id.startsWith("temp-");

  return {
    canUseMobileActionsSheet: canUseMobileActionsSheet && hasStandaloneAction,
    showActionsButton:
      hasStandaloneAction &&
      showInteractions &&
      isMobileLayoutViewport &&
      !isEditing &&
      identityMode === "default",
    showActionsButtonOnMobile: isMobileLayoutViewport,
    desktopActions:
      isMobileLayoutViewport || !hasStandaloneAction ? undefined : (
        <WaveDropActionsMore
          drop={drop}
          showOnlyQuickRemove
          standaloneQuickRemoveCuration={standaloneQuickRemoveCuration}
        />
      ),
  };
};
