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

  return <SingleWaveDropAuthor drop={drop} />;
};
