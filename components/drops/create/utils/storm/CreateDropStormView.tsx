import { memo } from "react";
import { CreateDropConfig } from "../../../../../entities/IDrop";
import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";
import CreateDropStormViewPart from "./CreateDropStormViewPart";

const CreateDropStormView = memo(
  ({ drop }: { readonly drop: CreateDropConfig }) => {
    return (
      <div>
        {!!drop?.parts.length &&
          drop.parts.map((part) => (
            <CreateDropStormViewPart
              key={getRandomObjectId()}
              part={part}
              referencedNfts={drop.referenced_nfts}
              mentionedUsers={drop.mentioned_users}
            />
          ))}
      </div>
    );
  }
);

CreateDropStormView.displayName = "CreateDropStormView";
export default CreateDropStormView;