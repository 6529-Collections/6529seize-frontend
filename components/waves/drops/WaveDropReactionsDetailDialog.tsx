"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { useEmoji } from "@/contexts/EmojiContext";
import type { ApiDropReaction } from "@/generated/models/ApiDropReaction";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface WaveDropReactionsDetailDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly reactions: ApiDropReaction[];
  readonly initialReaction?: string | undefined;
}

export default function WaveDropReactionsDetailDialog({
  isOpen,
  onClose,
  reactions,
  initialReaction,
}: WaveDropReactionsDetailDialogProps) {
  const [selectedReaction, setSelectedReaction] = useState<string>(
    initialReaction ?? reactions[0]?.reaction ?? ""
  );

  useEffect(() => {
    if (isOpen && initialReaction) {
      setSelectedReaction(initialReaction);
    }
  }, [isOpen, initialReaction]);

  const selectedReactionData = useMemo(
    () => reactions.find((r) => r.reaction === selectedReaction),
    [reactions, selectedReaction]
  );

  return (
    <MobileWrapperDialog title="Reactions" isOpen={isOpen} onClose={onClose}>
      <div className="tw-flex tw-h-[50vh] tw-max-h-[400px]">
        <ReactionsSidebar
          reactions={reactions}
          selectedReaction={selectedReaction}
          onSelectReaction={setSelectedReaction}
        />
        <ProfilesList profiles={selectedReactionData?.profiles ?? []} />
      </div>
    </MobileWrapperDialog>
  );
}

function ReactionsSidebar({
  reactions,
  selectedReaction,
  onSelectReaction,
}: {
  readonly reactions: ApiDropReaction[];
  readonly selectedReaction: string;
  readonly onSelectReaction: (reaction: string) => void;
}) {
  return (
    <div className="tw-w-32 tw-flex-shrink-0 tw-border-r tw-border-solid tw-border-iron-700 tw-border-t-0 tw-border-b-0 tw-border-l-0 tw-overflow-y-auto tw-px-2 tw-py-2">
      <div className="tw-flex tw-flex-col tw-gap-y-1">
        {reactions.map((reaction) => (
          <ReactionButton
            key={reaction.reaction}
            reaction={reaction}
            isSelected={reaction.reaction === selectedReaction}
            onClick={() => onSelectReaction(reaction.reaction)}
          />
        ))}
      </div>
    </div>
  );
}

function ReactionButton({
  reaction,
  isSelected,
  onClick,
}: {
  readonly reaction: ApiDropReaction;
  readonly isSelected: boolean;
  readonly onClick: () => void;
}) {
  const { emojiMap, findNativeEmoji } = useEmoji();

  const emojiId = reaction.reaction.replaceAll(":", "");

  const emojiNode = useMemo(() => {
    const custom = emojiMap
      .flatMap((cat) => cat.emojis)
      .find((e) => e.id === emojiId);

    const customSrc = custom?.skins[0]?.src;
    if (customSrc) {
      return (
        <div className="tw-relative tw-size-5">
          <Image
            src={customSrc}
            alt={emojiId}
            fill
            className="tw-object-contain"
          />
        </div>
      );
    }

    const native = findNativeEmoji(emojiId);
    if (native) {
      return (
        <span className="tw-flex tw-items-center tw-justify-center tw-text-lg">
          {native.skins[0]?.native}
        </span>
      );
    }

    return null;
  }, [emojiId, emojiMap, findNativeEmoji]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "tw-flex tw-items-center tw-justify-between tw-gap-x-2 tw-rounded-lg tw-border-0 tw-px-2 tw-py-1.5 tw-transition-colors tw-cursor-pointer",
        isSelected
          ? "tw-bg-primary-500/20 tw-text-iron-50"
          : "tw-bg-transparent tw-text-iron-300 hover:tw-bg-iron-800"
      )}
    >
      <div className="tw-flex tw-items-center tw-justify-center tw-size-6">
        {emojiNode}
      </div>
      <span className="tw-text-sm tw-font-medium">
        {reaction.profiles.length}
      </span>
    </button>
  );
}

function ProfilesList({
  profiles,
}: {
  readonly profiles: ApiDropReaction["profiles"];
}) {
  return (
    <div className="tw-flex-1 tw-overflow-y-auto tw-px-4 tw-py-2">
      <div className="tw-flex tw-flex-col tw-gap-y-2">
        {profiles.map((profile) => (
          <ProfileItem key={profile.id} profile={profile} />
        ))}
      </div>
    </div>
  );
}

function ProfileItem({
  profile,
}: {
  readonly profile: ApiDropReaction["profiles"][number];
}) {
  const displayName = profile.handle ?? profile.id;
  const profileLink = profile.handle ? `/${profile.handle}` : null;

  const content = (
    <div className="tw-flex tw-items-center tw-gap-x-3 tw-py-1">
      <div className="tw-size-8 tw-flex-shrink-0 tw-rounded-full tw-overflow-hidden tw-bg-iron-800">
        {profile.pfp ? (
          <img
            src={getScaledImageUri(profile.pfp, ImageScale.W_AUTO_H_50)}
            alt={displayName}
            className="tw-h-full tw-w-full tw-object-cover"
          />
        ) : (
          <div className="tw-h-full tw-w-full tw-bg-iron-700" />
        )}
      </div>
      <div className="tw-flex tw-flex-col tw-min-w-0">
        <span className="tw-text-sm tw-font-medium tw-text-iron-50 tw-truncate">
          {displayName}
        </span>
        {profile.handle && (
          <span className="tw-text-xs tw-text-iron-400 tw-truncate">
            {profile.handle}
          </span>
        )}
      </div>
    </div>
  );

  if (profileLink) {
    return (
      <Link
        href={profileLink}
        className="tw-no-underline hover:tw-bg-iron-800 tw-rounded-lg tw-px-2 tw--mx-2 tw-transition-colors"
      >
        {content}
      </Link>
    );
  }

  return <div className="tw-px-2 tw--mx-2">{content}</div>;
}
