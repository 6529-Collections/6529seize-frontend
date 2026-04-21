import type { ReactNode } from "react";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";

interface ProfileNameWithAiMarkerProps {
  readonly classification: ApiProfileClassification;
  readonly children: ReactNode;
  readonly className?: string | undefined;
  readonly markerClassName?: string | undefined;
}

const DEFAULT_CLASS_NAME = "tw-inline-flex tw-items-center tw-gap-2";
const MARKER_CLASS_NAME =
  "tw-inline-flex tw-items-center tw-justify-center tw-leading-none";

export default function ProfileNameWithAiMarker({
  classification,
  children,
  className = DEFAULT_CLASS_NAME,
  markerClassName,
}: ProfileNameWithAiMarkerProps) {
  const isAiProfile = classification === ApiProfileClassification.Ai;

  return (
    <span className={className}>
      {isAiProfile && (
        <span
          aria-hidden="true"
          className={
            markerClassName
              ? `${MARKER_CLASS_NAME} ${markerClassName}`
              : MARKER_CLASS_NAME
          }
        >
          🤖
        </span>
      )}
      {children}
    </span>
  );
}
