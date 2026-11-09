import type { WebSocketRoute } from "@playwright/test";
import type { ApiDrop } from "../../generated/models/ApiDrop";
import type { ApiWave } from "../../generated/models/ApiWave";
import type { ApiWaveDropsFeedV2 } from "../../generated/models/ApiWaveDropsFeedV2";
import { ApiDropMediaStatus } from "../../generated/models/ApiDropMediaStatus";
import { expect, test, waitForRouteReady } from "../testHelpers";
import {
  dismissNextDevTools,
  getSandboxApiOrigin,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const WAVE_ID = "00000000-0000-4000-8000-000000000529";
const IMAGE_URL =
  "https://d3lqz0a4bldqgf.cloudfront.net/drops/processing-regression/image.png";

test.describe("Wave media lifecycle @auth @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_COMPOSER_SANDBOX",
    "Media lifecycle tests require the isolated mock API."
  );

  test("retains image and text after ready followed by a delayed processing frame", async ({
    page,
    baseURL,
  }) => {
    const api = getSandboxApiOrigin(baseURL);
    const feed = (await page.request
      .get(`${api}/api/v2/waves/${WAVE_ID}/drops`)
      .then((response) => response.json())) as ApiWaveDropsFeedV2;
    const wave = (await page.request
      .get(`${api}/api/waves/${WAVE_ID}`)
      .then((response) => response.json())) as ApiWave;
    const source = feed.drops[0]!;
    const serial = source.serial_no + 100;
    const content = "Image lifecycle regression caption";
    const processing: ApiDrop = {
      ...wave.description_drop,
      id: "00000000-0000-4000-8000-000000009529",
      serial_no: serial,
      created_at: Date.now(),
      updated_at: null,
      hide_link_preview: true,
      parts: [
        {
          part_id: 1,
          content,
          quoted_drop: null,
          attachments: [],
          media: [
            {
              url: IMAGE_URL,
              mime_type: "image/png",
              media_upload_id: "00000000-0000-4000-8000-000000009530",
              media_status: ApiDropMediaStatus.Processing,
            },
          ],
        },
      ],
    };
    const ready: ApiDrop = {
      ...processing,
      parts: processing.parts.map((part) => ({
        ...part,
        media: part.media.map((media) => ({
          ...media,
          media_status: ApiDropMediaStatus.Ready,
          width: 927,
          height: 447,
        })),
      })),
    };
    const sockets = new Set<WebSocketRoute>();
    const subscribed = new Set<WebSocketRoute>();
    await page.routeWebSocket(
      (url) => url.port === new URL(api).port,
      (socket) => {
        sockets.add(socket);
        socket.onMessage((payload) => {
          const message = JSON.parse(String(payload)) as {
            type: string;
            wave_id?: string;
          };
          if (message.type === "AUTHENTICATE")
            socket.send(JSON.stringify({ type: "AUTHENTICATED", data: {} }));
          if (
            message.type === "SUBSCRIBE_TO_WAVE" &&
            message.wave_id === WAVE_ID
          )
            subscribed.add(socket);
        });
        socket.onClose(() => {
          sockets.delete(socket);
          subscribed.delete(socket);
        });
      }
    );
    const send = (drop: ApiDrop) => {
      for (const socket of sockets)
        socket.send(JSON.stringify({ type: "DROP_UPDATE", data: drop }));
    };
    let published = false;
    let current = processing;
    const headers = { "access-control-allow-origin": "*" };
    await page.route("**/api/open-graph**", (route) =>
      route.fulfill({ headers, json: { results: {} } })
    );
    await page.route(`${api}/api/v2/waves/${WAVE_ID}/drops*`, (route) => {
      const params = new URL(route.request().url()).searchParams;
      const saved = {
        ...source,
        id: processing.id,
        serial_no: serial,
        created_at: processing.created_at,
        updated_at: null,
        content: current.parts[0]!.content,
        media: current.parts[0]!.media,
      };
      const drops = published ? [saved, ...feed.drops] : feed.drops;
      const anchor = Number(params.get("serial_no_limit"));
      return route.fulfill({
        headers,
        json: {
          ...feed,
          drops:
            params.get("search_strategy") === "FIND_NEWER"
              ? drops.filter((drop) => drop.serial_no > anchor)
              : drops,
        },
      });
    });
    const image = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64"
    );
    let imageRequests = 0;
    await page.route("**/drops/processing-regression/**", (route) => {
      imageRequests += 1;
      return route.fulfill({ contentType: "image/png", body: image });
    });
    await page.goto(`/waves/${WAVE_ID}`, { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await dismissNextDevTools(page);
    await expect(
      page.getByRole("textbox", { name: "Write a message" }).last()
    ).toBeVisible();
    await expect.poll(() => subscribed.size).toBeGreaterThan(0);
    published = true;
    send(processing);
    const row = page.locator(`#drop-${serial}`);
    await expect(row).toBeVisible();
    await expect(row).toContainText(content);
    await expect(row).toContainText("Processing image");
    expect(imageRequests).toBe(0);
    current = ready;
    send(ready);
    const preview = row.getByRole("img", { name: "Drop media", exact: true });
    await expect(preview).toBeVisible();
    await expect
      .poll(() =>
        preview.evaluate(
          (element) =>
            element instanceof HTMLImageElement &&
            element.complete &&
            element.naturalWidth > 0
        )
      )
      .toBe(true);
    const delayedCaption = `${content}: delayed snapshot`;
    current = {
      ...processing,
      parts: processing.parts.map((part) => ({
        ...part,
        content: delayedCaption,
      })),
    };
    send(current);
    // Allow both the frame and its production-mode newest-feed read to settle.
    await expect(row).toContainText(delayedCaption);
    await expect(row.getByText("Processing image")).toHaveCount(0);
    await expect(preview).toBeVisible();
    expect(imageRequests).toBeGreaterThan(0);
  });
});
