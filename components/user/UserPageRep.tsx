import { useEffect, useState } from "react";
import RepGiveBtn from "../rep/common/give-rep/RepGiveBtn";
import { Poppins } from "next/font/google";
import { commonApiFetch } from "../../services/api/common-api";
import { WalletStateOnMattersVoting } from "../../services/api/common-api.types";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export default function UserPageRep({
  userWallet,
  connectedWallet,
}: {
  userWallet: string;
  connectedWallet: string | null;
}) {
  const [votesLeft, setVotesLeft] = useState<number | null>(null);
  const [categories, setCategories] = useState<
    {
      tag: string;
      tally: number;
      displayname: string;
      media: {
        type: string;
        url: string;
      } | null;
      connectedWalletVotes: number;
    }[]
  >([]);

  const dataInit = async () => {
    const endpoint = `votes/targets/WALLET/${userWallet}/matters/REPUTATION`;
    const data = await commonApiFetch<WalletStateOnMattersVoting>({
      endpoint,
      headers: connectedWallet ? { "x-auth-wallet": connectedWallet } : {},
    });
    setVotesLeft(data?.votes_left ?? null);
    setCategories(
      data?.categories
        .filter((c) => c.tally > 0)
        .map((c) => ({
          tag: c.category_tag,
          tally: c.tally,
          displayname: c.category_display_name,
          media: c.category_media
            ? {
                type: c.category_media.media_type,
                url: c.category_media.media_url,
              }
            : null,
          connectedWalletVotes: c.authenticated_wallet_votes,
        })) ?? []
    );
  };

  useEffect(() => {
    dataInit();
  }, [userWallet, connectedWallet]);

  return (
    <div className={`tailwind-scope ${poppins.className}`}>
      <div>Votes left: {votesLeft}</div>
      {categories.map((c) => (
        <div key={c.tag}>
          <div className="tw-inline-flex tw-space-x-2">
            <img
              className="tw-rounded-xl tw-h-20 tw-w-20 tw-object-cover"
              style={{ objectPosition: "center calc(45% - 1px)" }}
              src="data:image/png;base64,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"
              alt=""
            />
            <div>
              <div className="text-xl">Total: {c.tally}</div>
              {c.connectedWalletVotes > 0 && (
                <div>Your: {c.connectedWalletVotes}</div>
              )}

              {connectedWallet && votesLeft && (
                <RepGiveBtn
                  giverAddress={connectedWallet}
                  receiverAddress={userWallet}
                  maxVotes={votesLeft}
                  onNewVote={dataInit}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
