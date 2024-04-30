import { memo } from "react";
import {
  CreateDropPart,
  MentionedUser,
  ReferencedNft,
} from "../../../../../entities/IDrop";
import DropPart from "../../../view/part/DropPart";
import CreateDropStormViewPartQuote from "./CreateDropStormViewPartQuote";

const CreateDropStormViewPart = memo(
  ({
    part,
    mentionedUsers,
    referencedNfts,
  }: {
    readonly part: CreateDropPart;
    readonly mentionedUsers: Array<Omit<MentionedUser, "current_handle">>;
    readonly referencedNfts: Array<ReferencedNft>;
  }) => {
    const partMedia = part.media.length
      ? {
          mimeType: part.media[0].type,
          mediaSrc: URL.createObjectURL(part.media[0]),
        }
      : null;

    const quotedDrop = part.quoted_drop;

    return (
      <>
        <DropPart
          mentionedUsers={mentionedUsers}
          referencedNfts={referencedNfts}
          partContent={part.content}
          partMedia={partMedia}
        />
        {quotedDrop && <CreateDropStormViewPartQuote quotedDrop={quotedDrop} />}
      </>
    );
  }
);

CreateDropStormViewPart.displayName = "CreateDropStormViewPart";
export default CreateDropStormViewPart;
