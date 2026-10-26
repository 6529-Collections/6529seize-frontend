import type { Locator, Page, WebSocketRoute } from "@playwright/test";
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
  const template = (await response.json()).data[0];
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

export async function sidebarScrollMetrics(list: Locator, scrollTop?: number) {
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
      display: getComputedStyle(container, "::-webkit-scrollbar").display,
    };
  }, scrollTop);
}
