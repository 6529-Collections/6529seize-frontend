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
  }: {
    readonly drop: CreateDropConfig;
    readonly profile: ProfileMin;
  }) => {
    const now = Time.currentMillis();
    return (
      <div className="tw-flex tw-flex-col tw-divide-y tw-divide-solid tw-divide-iron-700 tw-divide-x-0 tw-mb-4">
        {!!drop?.parts.length &&
          drop.parts.map((part) => (
            <CreateDropStormViewPart
              key={getRandomObjectId()}
              profile={profile}
              part={part}
              referencedNfts={drop.referenced_nfts}
              mentionedUsers={drop.mentioned_users}
              createdAt={now}
              showAuthor={true}
            />
          ))}
      </div>
    );
  }
);

CreateDropStormView.displayName = "CreateDropStormView";
export default CreateDropStormView;
