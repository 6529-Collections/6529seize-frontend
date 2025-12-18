import React from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { SingleWaveDropAuthor } from "./SingleWaveDropAuthor";

interface SingleWaveDropInfoAuthorSectionProps {
  readonly drop: ExtendedDrop | undefined;
}

export const SingleWaveDropInfoAuthorSection: React.FC<
  SingleWaveDropInfoAuthorSectionProps
> = ({ drop }) => {
  return <>{drop && <SingleWaveDropAuthor drop={drop} />}</>;
};
