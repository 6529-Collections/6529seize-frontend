import React from "react";
import { ApiDrop } from "../../../../../generated/models/ApiDrop";

interface ParticipationDropPfpProps {
  readonly drop: ApiDrop;
}

const ParticipationDropPfp: React.FC<ParticipationDropPfpProps> = ({
  drop,
}) => {
  return (
    <div className="tw-h-full tw-w-full tw-bg-iron-900 tw-relative tw-flex-shrink-0 tw-rounded-lg">
      {drop.author.pfp ? (
        <div className="tw-rounded-lg tw-h-full tw-w-full">
          <div className="tw-h-full tw-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10">
            <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden">
              <img
                src={drop.author.pfp}
                alt="Profile picture"
                className="tw-bg-transparent tw-h-full tw-w-full tw-object-cover"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="tw-h-full tw-w-full tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-rounded-lg"></div>
      )}
    </div>
  );
};

export default ParticipationDropPfp; 
