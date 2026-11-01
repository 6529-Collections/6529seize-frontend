import type { ReactNode } from "react";

import { STREAM_CARD } from "@/components/stream/ui/styles";

/**
 * Every diagram is a `<figure>` with a caption. The drawing is decorative
 * where a list or table beside it carries the same content; diagrams keep
 * their accessible version as real text, not as an image.
 */
export default function DiagramFigure({
  caption,
  children,
  className = "",
}: {
  readonly caption: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <figure
      className={`${STREAM_CARD} tw-m-0 tw-p-4 tw-@container sm:tw-p-5 ${className}`}
    >
      {children}
      <figcaption className="tw-mt-4 tw-text-xs tw-leading-5 tw-text-iron-400">
        {caption}
      </figcaption>
    </figure>
  );
}
