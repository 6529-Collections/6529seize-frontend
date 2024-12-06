import React from "react";
import { ApiDrop } from "../../../../../generated/models/ApiDrop";
import ParticipationDropRatingsContainer from "./ratings/ParticipationDropRatingsContainer";

interface ParticipationDropRatingsProps {
  readonly drop: ApiDrop;
  readonly rank?: number | null;
}

export const ParticipationDropRatings: React.FC<ParticipationDropRatingsProps> = ({
  drop,
  rank = null,
}) => {
  return <ParticipationDropRatingsContainer drop={drop} rank={rank} />;
};
