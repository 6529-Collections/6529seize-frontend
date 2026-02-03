import { TweetBody, TweetHeader } from "react-tweet";

import type { EnrichedTweet } from "./ExpandableTweetPreview.types";

export default function CompactTweetContent({
  tweet,
}: Readonly<{ tweet: EnrichedTweet }>) {
  return (
    <>
      <TweetHeader tweet={tweet} />
      <TweetBody tweet={tweet} />
    </>
  );
}
