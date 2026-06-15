import type { InteractionMode } from "@/src/interaction/useInteractionMode";

export const DEFAULT_INTERACTION_MODE: InteractionMode = {
  canHover: false,
  hasFinePointer: false,
  hasCoarsePointer: false,
  hoverNone: false,
  lastPointerType: null,
  enableHoverUI: false,
  enableLongPress: false,
};

export function createInteractionMode(
  overrides: Partial<InteractionMode> = {}
): InteractionMode {
  return {
    ...DEFAULT_INTERACTION_MODE,
    ...overrides,
  };
}
