import type { Page } from "@playwright/test";

/** Long, deterministic grant results for scroll and selection regressions. */
export async function installGroupGrantFixtures(page: Page) {
  const grants = Array.from({ length: 22 }, (_, index) => ({
    id: `scroll-grant-${index + 1}`,
    grantor: {
      id: "scroll-grantor",
      handle: "scroll-grantor",
      pfp: null,
      banner1_color: null,
      banner2_color: null,
      cic: 0,
      rep: 0,
      tdh: 0,
      tdh_rate: 0,
      xtdh: 0,
      xtdh_rate: 0,
      level: 1,
      classification: "PSEUDONYM",
      sub_classification: null,
      primary_address: "0x0000000000000000000000000000000000000001",
      subscribed_actions: [],
      archived: false,
      active_main_stage_submission_ids: [],
      winner_main_stage_drop_ids: [],
      artist_of_prevote_cards: [],
      profile_wave_id: null,
      is_wave_creator: false,
    },
    target_chain: "ETHEREUM_MAINNET",
    target_contract: "0x0000000000000000000000000000000000000002",
    target_token_mode: "ALL",
    target_tokens_count: 1,
    target_collection_name: `Scroll collection ${index + 1}`,
    created_at: 1700000000000,
    updated_at: 1700000000000,
    valid_from: 1700000000000,
    valid_to: null,
    rate: 1,
    error_details: null,
    status: "GRANTED",
    is_irrevocable: false,
    total_granted: 1,
  }));
  const requestedPages: number[] = [];
  await page.route("**/api/xtdh/grants?**", async (route) => {
    const pageNumber = Number(
      new URL(route.request().url()).searchParams.get("page")
    );
    requestedPages.push(pageNumber);
    await route.fulfill({
      json: {
        data: grants.slice((pageNumber - 1) * 20, pageNumber * 20),
        count: grants.length,
        page: pageNumber,
        next: pageNumber === 1,
      },
    });
  });
  await page.route("**/api/xtdh/grants/scroll-grant-*", async (route) => {
    const id = new URL(route.request().url()).pathname.split("/").at(-1);
    const grant = grants.find((candidate) => candidate.id === id);
    if (!grant) {
      await route.fulfill({
        status: 404,
        json: { message: `Unknown fixture grant: ${id}` },
      });
      return;
    }
    await route.fulfill({ json: grant });
  });
  return requestedPages;
}
