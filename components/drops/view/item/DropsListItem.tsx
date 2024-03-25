import { ReactNode } from "react";
import { DropFull } from "../../../../entities/IDrop";
import Markdown from "react-markdown";
import DropListItemContentMention from "./DropListItemContentMention";

function CustomP({
  children,
  drop,
}: {
  readonly children?: ReactNode | undefined;
  readonly drop: DropFull;
}) {
  const mentionStrings = drop.mentioned_users.map(
    (user) => `@${user.handle_in_content}`
  );
  const nftStrings = drop.referenced_nfts.map((nft) => `#${nft.name}`);
  let parts: any[] = [children as string];

  // Replace mentions with a React element
  mentionStrings.forEach((mention) => {
    const regex = new RegExp(`(^|\\s)${mention}(?=[\\s.,:;!?]|$)`, "g");
    parts.forEach((part) =>
      typeof part === "string" ? console.log(part.split(regex)) : [part]
    );
  });

  // Replace NFTs with a React element
  nftStrings.forEach((nft) => {
    const regex = new RegExp(`(^|\\s)${nft}(?=[\\s.,:;!?]|$)`, "g");
    parts = parts.flatMap((part) =>
      typeof part === "string"
        ? part.split(regex).reduce((acc, subpart, i, arr) => {
            if (i < arr.length - 1) {
              acc.push(
                subpart,
                <DropListItemContentMention key={nft} mention={nft} />
              );
            } else {
              acc.push(subpart);
            }
            return acc;
          }, [] as any)
        : [part]
    );
  });

  return <p>{parts}</p>;
}

export default function DropsListItem({ drop }: { readonly drop: DropFull }) {
  return (
    <div className="tw-border-solid tw-p-4">
      <Markdown
        components={{
          p: (params) => CustomP({ children: params.children, drop }),
        }}
      >
        {drop.content}
      </Markdown>
    </div>
  );
}
