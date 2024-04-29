import {
  CreateDropPart,
  MentionedUser,
  ReferencedNft,
} from "../../../../../entities/IDrop";
import DropPart from "../../../view/part/DropPart";

export default function CreateDropStormViewPart({
  part,
  mentionedUsers,
  referencedNfts,
}: {
  readonly part: CreateDropPart;
  readonly mentionedUsers: Array<Omit<MentionedUser, "current_handle">>;
  readonly referencedNfts: Array<ReferencedNft>;
}) {
  const partMedia = part.media.length
    ? {
        mimeType: part.media[0].type,
        mediaSrc: URL.createObjectURL(part.media[0]),
      }
    : null;

  return (
    <DropPart
      mentionedUsers={mentionedUsers}
      referencedNfts={referencedNfts}
      partContent={part.content}
      partMedia={partMedia}
    />
  );
}
