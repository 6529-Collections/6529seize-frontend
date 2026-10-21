import type { Page, Response } from "@playwright/test";
import type { ApiCompetition } from "../../generated/models/ApiCompetition";
import type { ApiCompetitionLeaderboardPage } from "../../generated/models/ApiCompetitionLeaderboardPage";
import type { ApiDropAndWave } from "../../generated/models/ApiDropAndWave";
import type { ApiWaveV3 } from "../../generated/models/ApiWaveV3";
import { EN_US_MESSAGES } from "../../i18n/messages/en-US";
import { expect } from "../testHelpers";
import { RESPONSE_TIMEOUT_MS } from "./routeReadiness";

const EMPTY_LEADERBOARD = EN_US_MESSAGES["competitions.emptyResource"];
const leaderboardRegion = (page: Page) =>
  page.getByRole("region", { name: "Leaderboard", exact: true });

export async function expectNativeLeaderboardReady(
  page: Page,
  expectedEmpty?: boolean
) {
  const region = leaderboardRegion(page);
  const list = region.getByRole("list", {
    name: "Leaderboard drops",
    exact: true,
  });
  const empty = region.getByRole("status").filter({
    hasText: EMPTY_LEADERBOARD,
  });
  if (expectedEmpty === undefined) {
    await expect
      .poll(
        async () =>
          (await empty.isVisible()) ||
          ((await list.isVisible()) &&
            (await list.getByRole("listitem").count()) > 0),
        { timeout: 30000 }
      )
      .toBe(true);
    expectedEmpty = await empty.isVisible();
  }
  if (expectedEmpty) {
    await expect(empty).toHaveText(EMPTY_LEADERBOARD);
    await expect(empty).toBeVisible({ timeout: 30000 });
    await expect(list).toHaveCount(1);
    await expect(list).toBeHidden();
    await expect(list.getByRole("listitem")).toHaveCount(0);
  } else {
    await expect(empty).toHaveCount(0);
    await expect(list).toBeVisible({ timeout: 30000 });
    await expect(list.getByRole("listitem").first()).toBeVisible();
  }
}

/** Observe the UI's own reads; never issue extra API requests or retain auth data. */
export function observeNativeLeaderboard(page: Page, waveId: string) {
  const reads: Response[] = [];
  const wavePath = `/api/v3/waves/${waveId}`;
  const observe = (response: Response) => {
    const path = new URL(response.url()).pathname;
    if (
      response.request().method() === "GET" &&
      (path === wavePath ||
        path.startsWith(`${wavePath}/competitions/`) ||
        /^\/api\/v2\/drops\/[^/]+$/.test(path))
    )
      reads.push(response);
  };
  page.on("response", observe);
  return {
    reads,
    dispose: () => page.off("response", observe),
    async originalLeaderboard() {
      const read = async (matches: (url: URL) => boolean) => {
        let response: Response | undefined;
        await expect
          .poll(
            () => {
              response = reads.find((item) => matches(new URL(item.url())));
              return Boolean(response);
            },
            { timeout: RESPONSE_TIMEOUT_MS }
          )
          .toBe(true);
        if (!response) throw new Error("Expected native competition read");
        expect(response.ok(), "Native competition read must succeed").toBe(
          true
        );
        return response;
      };
      const hub: ApiWaveV3 = await (
        await read((url) => url.pathname === wavePath)
      ).json();
      expect(hub.id).toBe(waveId);
      expect(hub.legacy_primary_competition_id).toBeTruthy();
      const competitionPath = `${wavePath}/competitions/${hub.legacy_primary_competition_id}`;
      const competition: ApiCompetition = await (
        await read((url) => url.pathname === competitionPath)
      ).json();
      expect(competition.id).toBe(hub.legacy_primary_competition_id);
      expect(competition.wave_id).toBe(waveId);
      expect(competition.capabilities).toContain("MAIN_STAGE");
      await expect(page).toHaveURL(
        (url) =>
          url.pathname === `/waves/${waveId}/competitions/${competition.id}`,
        { timeout: RESPONSE_TIMEOUT_MS }
      );
      // Initial Main Stage RANK maps to native rating with no cursor. A later
      // page or another sort would not verify the initial leaderboard view.
      const response = await read(
        (url) =>
          url.pathname === `${competitionPath}/leaderboard` &&
          url.searchParams.get("sort") === "rating" &&
          !url.searchParams.has("cursor")
      );
      const data: ApiCompetitionLeaderboardPage = await response.json();
      expect(Array.isArray(data.data)).toBe(true);
      for (const entry of data.data) {
        expect(entry.competition_id).toBe(competition.id);
        expect(entry.entry_id).toBeTruthy();
        expect(entry.drop_id).toBeTruthy();
      }
      return { competition, data };
    },
  };
}

export async function expectNativeLeaderboardArtwork(
  page: Page,
  competition: ApiCompetition,
  data: ApiCompetitionLeaderboardPage,
  reads: readonly Response[]
) {
  await page.getByRole("tab", { name: "Grid view", exact: true }).click();
  await expectNativeLeaderboardReady(page, data.data.length === 0);
  if (data.data.length === 0) return;

  const entriesByDrop = new Map(
    data.data.map((entry) => [entry.drop_id, entry])
  );
  let hydrated: { entryId: string; drop: ApiDropAndWave }[] = [];
  await expect
    .poll(
      async () => {
        // Only mounted rows hydrate; offscreen API rows need no extra reads.
        const mountedDropIds = await leaderboardRegion(page)
          .getByRole("list", { name: "Leaderboard drops", exact: true })
          .getByRole("listitem")
          .evaluateAll((items) =>
            items
              .map((item) => item.getAttribute("data-leaderboard-drop-id"))
              .filter((id): id is string => id !== null)
          );
        if (mountedDropIds.length === 0) return false;
        const completed: typeof hydrated = [];
        for (const dropId of mountedDropIds) {
          const entry = entriesByDrop.get(dropId);
          expect(
            entry,
            "Rendered drop must belong to the native page"
          ).toBeDefined();
          if (!entry) throw new Error("Rendered native entry missing");
          const response = reads.find(
            (item) => new URL(item.url()).pathname === `/api/v2/drops/${dropId}`
          );
          if (!response) return false;
          expect(response.ok(), "Rendered rich drop read must succeed").toBe(
            true
          );
          const drop: ApiDropAndWave = await response.json();
          expect(drop.wave.id).toBe(competition.wave_id);
          expect(drop.drop.id).toBe(entry.drop_id);
          // This marker appears only after context validation AND rich content
          // hydration. A loading/error wrapper cannot count as a text-only card.
          const card = leaderboardRegion(page)
            .getByRole("list", { name: "Leaderboard drops", exact: true })
            .locator(`[data-leaderboard-drop-id="${dropId}"]`)
            .locator(`[data-competition-entry="${entry.entry_id}"]`);
          if (!(await card.isVisible())) return false;
          completed.push({ entryId: entry.entry_id, drop });
        }
        hydrated = completed;
        return true;
      },
      {
        timeout: RESPONSE_TIMEOUT_MS,
        message: "Expected rendered native entries to finish scoped hydration",
      }
    )
    .toBe(true);
  const artwork = hydrated.find((item) => item.drop.drop.media?.length);
  if (!artwork) return;
  const card = leaderboardRegion(page)
    .getByRole("list", { name: "Leaderboard drops", exact: true })
    .locator(`[data-leaderboard-drop-id="${artwork.drop.drop.id}"]`)
    .locator(`[data-competition-entry="${artwork.entryId}"]`);
  await expect(card).toBeVisible();
  await card.scrollIntoViewIfNeeded();
  // Restrict images to the media primitive so an author avatar cannot satisfy
  // this check; retain video/audio/interactive/3D artwork support.
  await expect(
    leaderboardRegion(page)
      .getByRole("list", { name: "Leaderboard drops", exact: true })
      .locator(`[data-leaderboard-drop-id="${artwork.drop.drop.id}"]`)
      .locator(`[data-competition-entry="${artwork.entryId}"]`)
      .locator(
        'img[alt="Media content"], video, audio, iframe, model-viewer, canvas'
      )
      .first()
  ).toBeVisible();
}
