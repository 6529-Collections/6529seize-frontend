import type { Locator, Page, WebSocketRoute } from "@playwright/test";
import type { ApiWave } from "../../generated/models/ApiWave";
import type { ApiWaveOverviewPage } from "../../generated/models/ApiWaveOverviewPage";
import { expect } from "../testHelpers";
import { getSandboxApiOrigin } from "./localSandbox";

export const scrollWaveId = (index: number) =>
  `00000000-0000-4000-8000-${String(index + 7000).padStart(12, "0")}`;

export async function installWaveListScrollFixture(
  page: Page,
  baseURL?: string
) {
  const origin = getSandboxApiOrigin(baseURL);
  const response = await page.request.get(`${origin}/api/v2/waves`);
  expect(response.ok()).toBe(true);
  const template = ((await response.json()) as ApiWaveOverviewPage).data[0];
  if (!template) throw new Error("Missing sandbox wave fixture");
  const waves = Array.from({ length: 60 }, (_, index) => ({
    ...template,
    id: scrollWaveId(index),
    name: `Scroll wave ${index}`,
    last_drop_time: Date.now() - (index + 1) * 60000,
    context_profile_context: {
      ...template.context_profile_context,
      pinned: true,
      subscribed: true,
    },
  }));
  await page.route("**/api/v2/waves?**", (route) =>
    route.fulfill({ json: { data: waves, page: 1, next: false } })
  );
  await page.route("**/api/v2/waves/joined**", (route) =>
    route.fulfill({
      json: {
        data: waves,
        next_cursor: null,
        snapshot_expires_at: Date.now() + 900000,
      },
    })
  );
  const detailResponse = await page.request.get(
    `${origin}/api/waves/${template.id}`
  );
  expect(detailResponse.ok()).toBe(true);
  const detail = (await detailResponse.json()) as ApiWave;
  await page.route(
    /\/api\/waves\/00000000-0000-4000-8000-000000007\d{3}$/,
    (route) => {
      const id = new URL(route.request().url()).pathname.split("/").at(-1);
      const wave = waves.find((item) => item.id === id);
      return route.fulfill({
        json: { ...detail, id, name: wave?.name, pinned: true },
      });
    }
  );
  await page.route("**/api/open-graph", (route) => route.fulfill({ json: {} }));
  const sockets: WebSocketRoute[] = [];
  await page.routeWebSocket(
    (url) => url.port === new URL(origin).port,
    (socket) => {
      sockets.push(socket);
      socket.onMessage((message) => {
        const frame = JSON.parse(String(message)) as { type?: string };
        if (frame.type === "AUTHENTICATE")
          socket.send(JSON.stringify({ type: "AUTHENTICATED", data: {} }));
      });
    }
  );
  return {
    async incoming(index: number) {
      await expect.poll(() => sockets.length).toBeGreaterThan(0);
      for (const socket of sockets)
        socket.send(
          JSON.stringify({
            type: "DROP_UPDATE_REF",
            data: {
              update_type: "DROP_UPDATE",
              wave_id: scrollWaveId(index),
              drop_id: scrollWaveId(index + 100),
              serial_no: index + 100,
              author_id: "another-reader",
            },
          })
        );
    },
  };
}

export function sidebarScrollMetrics(list: Locator, scrollTop?: number) {
  return list.evaluate((element, top) => {
    let container = element.parentElement;
    while (
      container &&
      !["auto", "scroll"].includes(getComputedStyle(container).overflowY)
    )
      container = container.parentElement;
    if (!container) throw new Error("Missing wave list scroll container");
    if (top !== undefined) container.scrollTop = top;
    return {
      top: container.scrollTop,
      width: getComputedStyle(container).scrollbarWidth,
      x: container.getBoundingClientRect().x + container.clientWidth / 2,
      y: container.getBoundingClientRect().y + container.clientHeight / 2,
      right: container.getBoundingClientRect().right,
      viewportTop: container.getBoundingClientRect().top,
      height: container.clientHeight,
      scrollHeight: container.scrollHeight,
    };
  }, scrollTop);
}
