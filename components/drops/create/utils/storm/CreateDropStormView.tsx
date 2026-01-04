import { memo } from "react";
import type { CreateDropConfig } from "@/entities/IDrop";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import CreateDropStormViewPart from "./CreateDropStormViewPart";
import { Time } from "@/helpers/time";
import type { ProfileMinWithoutSubs } from "@/helpers/ProfileTypes";

interface CreateDropStormViewWaveProps {
  readonly name: string;
  readonly image: string | null;
  readonly id: string | null;
}

interface CreateDropStormViewProps {
  readonly drop: CreateDropConfig;
  readonly profile: ProfileMinWithoutSubs;
  readonly wave: CreateDropStormViewWaveProps | null;
  readonly removePart: (index: number) => void;
}

const CreateDropStormView = memo(
  ({ drop, profile, wave, removePart }: CreateDropStormViewProps) => {
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
              partIndex={index}
              wave={wave}
              dropTitle={drop.title ?? null}
              removePart={removePart}
            />
          ))}
      </div>
    );
  }
);

CreateDropStormView.displayName = "CreateDropStormView";
export default CreateDropStormView;
