interface SidebarSubwaveConnectorProps {
  readonly guideLineOffsetClasses: string;
  readonly isLastSubwave: boolean;
}

interface SidebarParentSubwaveConnectorProps {
  readonly guideLineOffsetClasses: string;
}

const CONNECTOR_COLOR_CLASSES =
  "tw-border-iron-800/80 desktop-hover:group-hover:tw-border-iron-700/80";

export function SidebarParentSubwaveConnector({
  guideLineOffsetClasses,
}: SidebarParentSubwaveConnectorProps) {
  return (
    <span
      aria-hidden="true"
      className={`tw-pointer-events-none tw-absolute tw-bottom-0 tw-top-1/2 ${guideLineOffsetClasses} tw-border-0 tw-border-l tw-border-solid ${CONNECTOR_COLOR_CLASSES} tw-transition-colors tw-duration-200`}
    />
  );
}

export function SidebarSubwaveConnector({
  guideLineOffsetClasses,
  isLastSubwave,
}: SidebarSubwaveConnectorProps) {
  return (
    <>
      {!isLastSubwave && (
        <span
          aria-hidden="true"
          className={`tw-pointer-events-none tw-absolute tw-bottom-0 tw-top-0 ${guideLineOffsetClasses} tw-border-0 tw-border-l tw-border-solid ${CONNECTOR_COLOR_CLASSES} tw-transition-colors tw-duration-200`}
        />
      )}
      <span
        aria-hidden="true"
        className={`tw-pointer-events-none tw-absolute tw-top-0 ${guideLineOffsetClasses} tw-h-1/2 tw-w-7 tw-rounded-bl-xl tw-border-0 tw-border-b tw-border-l tw-border-solid ${CONNECTOR_COLOR_CLASSES} tw-transition-colors tw-duration-200`}
      />
    </>
  );
}
