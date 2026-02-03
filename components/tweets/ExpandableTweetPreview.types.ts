import type { enrichTweet } from "react-tweet";

export type EnrichedTweet = NonNullable<ReturnType<typeof enrichTweet>>;
