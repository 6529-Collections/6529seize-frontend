"use client";

import useInteractionMode from "@/src/interaction/useInteractionMode";

const CLICK_OPEN_EVENTS = { click: true, focus: true };
const CLICK_CLOSE_EVENTS = { click: true, blur: true };
const CLICK_GLOBAL_CLOSE_EVENTS = { clickOutsideAnchor: true };
const HOVER_OPEN_EVENTS = { mouseenter: true, focus: true };
const HOVER_CLOSE_EVENTS = { mouseleave: true, blur: true };
const HOVER_GLOBAL_CLOSE_EVENTS = {};
const HYBRID_OPEN_EVENTS = { ...HOVER_OPEN_EVENTS, ...CLICK_OPEN_EVENTS };
const HYBRID_CLOSE_EVENTS = { ...HOVER_CLOSE_EVENTS, ...CLICK_CLOSE_EVENTS };

export default function useWaveOutcomeTooltipInteraction() {
  const { enableHoverUI, enableLongPress } = useInteractionMode();
  const enableHybridActivation = enableHoverUI && enableLongPress;
  let tooltipOpenEvents = HOVER_OPEN_EVENTS;
  let tooltipCloseEvents = HOVER_CLOSE_EVENTS;

  if (enableHybridActivation) {
    tooltipOpenEvents = HYBRID_OPEN_EVENTS;
    tooltipCloseEvents = HYBRID_CLOSE_EVENTS;
  } else if (enableLongPress) {
    tooltipOpenEvents = CLICK_OPEN_EVENTS;
    tooltipCloseEvents = CLICK_CLOSE_EVENTS;
  }

  return {
    useClickActivation: enableLongPress,
    tooltipOpenEvents,
    tooltipCloseEvents,
    tooltipGlobalCloseEvents: enableLongPress
      ? CLICK_GLOBAL_CLOSE_EVENTS
      : HOVER_GLOBAL_CLOSE_EVENTS,
  };
}
