"use client";

import { type ComponentProps, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";

type BodyPortalTooltipProps = ComponentProps<typeof Tooltip>;

const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

/**
 * Renders a react-tooltip into `document.body`.
 *
 * Tooltips rendered inline inherit their ancestors' stacking contexts, so a
 * sticky header or any `z-index` / `transform` ancestor (for example a
 * scrolling sidebar list) can paint over or clip them. Portalling the tooltip
 * to the body and positioning it against the viewport keeps it above that
 * chrome; react-tooltip's default flip/shift middleware then keeps it inside
 * the viewport for every anchor position.
 */
export default function BodyPortalTooltip({
  positionStrategy = "fixed",
  ...tooltipProps
}: BodyPortalTooltipProps) {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot
  );

  if (!hydrated) {
    return null;
  }

  return createPortal(
    <Tooltip {...tooltipProps} positionStrategy={positionStrategy} />,
    document.body
  );
}
