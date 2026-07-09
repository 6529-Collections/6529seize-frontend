import { formatNumberWithCommas } from "@/helpers/Helpers";

interface VoteRationaleReplyMarkdownParams {
  readonly voteTotal: number;
  readonly voteChange: number;
}

const formatSignedVote = (value: number): string => {
  if (value === 0) {
    return "0";
  }

  const formattedValue = formatNumberWithCommas(Math.abs(value));
  return value > 0 ? `+${formattedValue}` : `-${formattedValue}`;
};

export const getVoteRationaleReplyMarkdown = ({
  voteTotal,
  voteChange,
}: VoteRationaleReplyMarkdownParams): string => {
  const formattedTotal = formatSignedVote(voteTotal);

  if (voteTotal === voteChange) {
    return `Vote rationale (${formattedTotal} at time of posting):\n\n`;
  }

  return (
    `Vote rationale (${formattedTotal} total, ` +
    `${formatSignedVote(voteChange)} change at time of posting):\n\n`
  );
};
