import { memo } from "react";
import { CreateDropConfig } from "../../../../../entities/IDrop";
import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";
import CreateDropStormViewPart from "./CreateDropStormViewPart";
import { ProfileMin } from "../../../../../generated/models/ProfileMin";
import { Time } from "../../../../../helpers/time";

const CreateDropStormView = memo(
  ({
    drop,
    profile,
    isDescriptionDrop,
    waveName,
    waveImage,
    waveId,
  }: {
    readonly drop: CreateDropConfig;
    readonly profile: ProfileMin;
    readonly isDescriptionDrop: boolean;
    readonly waveName: string;
    readonly waveImage: string | null;
    readonly waveId: string | null;
  }) => {
    const now = Time.currentMillis();
    return (
      <div className="tw-flex tw-flex-col tw-mb-4">
        {!!drop?.parts.length &&
          drop.parts.map((part, index) => (
            <CreateDropStormViewPart
              key={getRandomObjectId()}
              profile={profile}
              part={part}
              referencedNfts={drop.referenced_nfts}
              mentionedUsers={drop.mentioned_users}
              createdAt={now}
              isFirstPart={index === 0}
              isDescriptionDrop={isDescriptionDrop}
              waveName={waveName}
              dropTitle={drop.title ?? null}
              waveImage={waveImage}
              waveId={waveId}
            />
          ))}
      </div>
    );
  }
);

CreateDropStormView.displayName = "CreateDropStormView";
export default CreateDropStormView;
