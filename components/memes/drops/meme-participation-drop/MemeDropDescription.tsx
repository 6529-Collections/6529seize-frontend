"use client";

import CollapsibleDropBody from "@/components/waves/drops/CollapsibleDropBody";
import { useOptionalDropContext } from "@/components/waves/drops/DropContext";
import { DropLocation } from "@/components/waves/drops/drop.types";

interface MemeDropDescriptionProps {
  readonly description: string;
}

export default function MemeDropDescription({
  description,
}: MemeDropDescriptionProps) {
  const dropContext = useOptionalDropContext();
  const content = (
    <p
      data-drop-body-text="true"
      className="tw-mb-0 tw-whitespace-pre-line tw-text-md tw-text-iron-400"
    >
      {description}
    </p>
  );

  return dropContext?.location === DropLocation.WAVE ? (
    <CollapsibleDropBody key={description}>{content}</CollapsibleDropBody>
  ) : (
    <div>{content}</div>
  );
}
