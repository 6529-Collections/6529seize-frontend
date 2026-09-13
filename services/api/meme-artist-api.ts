import type { ApiDropV2PageWithoutCount } from "@/generated/models/ApiDropV2PageWithoutCount";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiSubmissionDropStatus } from "@/generated/models/ApiSubmissionDropStatus";
import { commonApiFetch } from "@/services/api/common-api";

export async function fetchArtistMemeCardIds(
  profile: Pick<
    ApiIdentity,
    "artist_of_prevote_cards" | "winner_main_stage_drop_ids"
  >,
  signal: AbortSignal
): Promise<number[]> {
  const dropIds = [...new Set(profile.winner_main_stage_drop_ids)];
  const requests: Promise<ApiDropV2PageWithoutCount>[] = [];
  for (let index = 0; index < dropIds.length; index += 100) {
    const ids = dropIds.slice(index, index + 100);
    requests.push(
      commonApiFetch<ApiDropV2PageWithoutCount>({
        endpoint: "v2/drops",
        params: { ids: ids.join(","), page_size: String(ids.length) },
        signal,
      })
    );
  }
  const pages = await Promise.all(requests);
  const mintedIds = pages.flatMap((page) =>
    page.data.flatMap((drop) => {
      const submission = drop.submission_context;
      if (
        submission?.status !== ApiSubmissionDropStatus.Winner ||
        submission.meme_card_id === undefined
      ) {
        return [];
      }
      return [submission.meme_card_id];
    })
  );
  return [...new Set([...profile.artist_of_prevote_cards, ...mintedIds])]
    .filter((id) => Number.isSafeInteger(id) && id > 0)
    .sort((a, b) => b - a);
}
