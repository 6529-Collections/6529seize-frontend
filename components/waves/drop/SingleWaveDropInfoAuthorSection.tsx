import { MemeCollaboratorCredits } from "@/components/waves/memes/collaborations/MemeCollaboratorCredits";
import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { SingleWaveDropAuthor } from "./SingleWaveDropAuthor";

interface SingleWaveDropInfoAuthorSectionProps {
  readonly drop: ExtendedDrop | undefined;
}

export const SingleWaveDropInfoAuthorSection: React.FC<
  SingleWaveDropInfoAuthorSectionProps
> = ({ drop }) => {
  if (!drop) return null;

  return (
    <div className="tw-space-y-2">
      <SingleWaveDropAuthor drop={drop} />
      <MemeCollaboratorCredits collaborators={drop.collaborators} />
    </div>
  );
};
