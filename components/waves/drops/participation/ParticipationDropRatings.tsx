import React from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import ParticipationDropRatingsContainer from "./ratings/ParticipationDropRatingsContainer";

interface ParticipationDropRatingsProps {
  readonly drop: ApiDrop;
  readonly rank?: number | null | undefined;
}

export const ParticipationDropRatings: React.FC<ParticipationDropRatingsProps> = ({
  drop,
  rank = null,
}) => {
  return <ParticipationDropRatingsContainer drop={drop} rank={rank} />;
};
