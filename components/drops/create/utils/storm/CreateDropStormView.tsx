import { memo } from "react";
import type { CreateDropConfig } from "@/entities/IDrop";
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
  readonly disabled?: boolean | undefined;
  readonly removePart: (index: number) => void;
}

const CreateDropStormView = memo(
  ({
    drop,
    profile,
    wave,
    disabled = false,
    removePart,
  }: CreateDropStormViewProps) => {
    const now = Time.currentMillis();
    return (
      <div className="tw-mb-4 tw-flex tw-flex-col">
        {drop.parts.length > 0 &&
          drop.parts.map((part, index) => (
            <CreateDropStormViewPart
              key={part.clientId ?? part.id}
              profile={profile}
              part={part}
              referencedNfts={drop.referenced_nfts}
              mentionedUsers={drop.mentioned_users}
              mentionedGroups={drop.mentioned_groups ?? []}
              mentionedWaves={drop.mentioned_waves ?? []}
              createdAt={now}
              partIndex={index}
              wave={wave}
              dropTitle={drop.title ?? null}
              disabled={disabled}
              removePart={removePart}
            />
          ))}
      </div>
    );
  }
);

CreateDropStormView.displayName = "CreateDropStormView";
export default CreateDropStormView;
