import {
  QuotedTweet,
  TweetActions,
  TweetBody,
  TweetHeader,
  TweetInfo,
  TweetInReplyTo,
  TweetMedia,
  TweetReplies,
} from "react-tweet";

import type { EnrichedTweet } from "./ExpandableTweetPreview.types";

export default function ExpandedTweetContent({
  tweet,
}: Readonly<{ tweet: EnrichedTweet }>) {
  return (
    <>
      <TweetHeader tweet={tweet} />
      {tweet.in_reply_to_status_id_str ? (
        <TweetInReplyTo tweet={tweet} />
      ) : null}
      <TweetBody tweet={tweet} />
      {typeof tweet.mediaDetails?.length === "number" &&
      tweet.mediaDetails.length > 0 ? (
        <TweetMedia tweet={tweet} />
      ) : null}
      {tweet.quoted_tweet ? <QuotedTweet tweet={tweet.quoted_tweet} /> : null}
      <TweetInfo tweet={tweet} />
      <TweetActions tweet={tweet} />
      <TweetReplies tweet={tweet} />
    </>
  );
}
