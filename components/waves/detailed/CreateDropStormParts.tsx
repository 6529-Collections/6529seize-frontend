import React from "react";

import DropPartMarkdown from "../../drops/view/part/DropPartMarkdown";
import {
  CreateDropPart,
  MentionedUser,
  ReferencedNft,
} from "../../../entities/IDrop";
import { DropMentionedUser } from "../../../generated/models/DropMentionedUser";

interface CreateDropStormPartsProps {
  readonly parts: CreateDropPart[];
  readonly mentionedUsers: DropMentionedUser[];
  readonly referencedNfts: ReferencedNft[];
}

const CreateDropStormParts: React.FC<CreateDropStormPartsProps> = ({
  parts,
  mentionedUsers,
  referencedNfts,
}) => {
  return (
    <div className="tw-space-y-4">
      {parts.map((part, index) => (
        <DropPartMarkdown
          key={`drop-part-${index}-${
            part.content?.substring(0, 10) || "empty"
          }`}
          mentionedUsers={mentionedUsers}
          referencedNfts={referencedNfts}
          partContent={part.content ?? ""}
          onImageLoaded={() => {}}
        />
      ))}
    </div>
  );
};

export default CreateDropStormParts;
