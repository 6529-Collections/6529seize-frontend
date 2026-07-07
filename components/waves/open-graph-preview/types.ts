import type { LinkPreviewVariant } from "../LinkPreviewContext";

export interface OpenGraphPreviewData {
  [key: string]: unknown;
}

export interface OpenGraphPreviewProps {
  readonly href: string;
  readonly preview?: OpenGraphPreviewData | null | undefined;
  readonly variant?: LinkPreviewVariant | undefined;
  readonly imageOnly?: boolean | undefined;
  readonly hideActions?: boolean | undefined;
}

export type MaybeRecord = Record<string, unknown>;
export type RoutedPreviewCardProps = {
  readonly href: string;
  readonly effectiveHref: string;
  readonly linkTarget: "_blank" | undefined;
  readonly linkRel: string | undefined;
  readonly variant: LinkPreviewVariant;
  readonly hideActions: boolean;
};

export type FirstPartyOpenGraphPreviewKind = "profile" | "drop" | "wave";
