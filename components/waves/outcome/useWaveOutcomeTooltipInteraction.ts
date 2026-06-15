"use client";

import useInteractionMode from "@/src/interaction/useInteractionMode";

const CLICK_OPEN_EVENTS = { click: true, focus: true };
const CLICK_CLOSE_EVENTS = { click: true, blur: true };
const CLICK_GLOBAL_CLOSE_EVENTS = { clickOutsideAnchor: true };
const HOVER_OPEN_EVENTS = { mouseenter: true, focus: true };
const HOVER_CLOSE_EVENTS = { mouseleave: true, blur: true };
const HOVER_GLOBAL_CLOSE_EVENTS = {};

export default function useWaveOutcomeTooltipInteraction() {
  const { enableLongPress } = useInteractionMode();

  return {
    useClickActivation: enableLongPress,
    tooltipOpenEvents: enableLongPress ? CLICK_OPEN_EVENTS : HOVER_OPEN_EVENTS,
    tooltipCloseEvents: enableLongPress
      ? CLICK_CLOSE_EVENTS
      : HOVER_CLOSE_EVENTS,
    tooltipGlobalCloseEvents: enableLongPress
      ? CLICK_GLOBAL_CLOSE_EVENTS
      : HOVER_GLOBAL_CLOSE_EVENTS,
  };
}
