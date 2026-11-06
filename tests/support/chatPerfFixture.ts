import type { Page, Route, WebSocketRoute } from "@playwright/test";
import type { ApiDrop } from "../../generated/models/ApiDrop";
import type { ApiWave } from "../../generated/models/ApiWave";
import type { ApiWaveDropsFeedV2 } from "../../generated/models/ApiWaveDropsFeedV2";
import type { ApiWaveOverview } from "../../generated/models/ApiWaveOverview";
import type { ApiWaveOverviewPage } from "../../generated/models/ApiWaveOverviewPage";
import { expect } from "../testHelpers";
import { getSandboxApiOrigin } from "./localSandbox";

/**
 * A synthetic wave list and an open chat for the chat render budget
 * (WAVES-PLAN Appendix A.1): 30 followed waves in the sidebar and one open
 * wave with 40 messages. Messages arrive as full `DROP_UPDATE` frames, the
 * way the backend sends ordinary-size drops, on every socket the backend
 * would use: app sockets always, a wave-subscribed socket only for its wave.
 */
const SANDBOX_WAVE_ID = "00000000-0000-4000-8000-000000000529";
export const PERF_WAVE_COUNT = 30;
export const PERF_OPEN_WAVE_INDEX = 0;
export const PERF_OTHER_WAVE_INDEX = 7;
const INITIAL_MESSAGES = 40;
const PERF_READER = {
  id: "00000000-0000-4000-8000-000000009999",
  handle: "perf-reader",
};

export const perfWaveId = (index: number) =>
  `00000000-0000-4000-8000-${String(index + 9500).padStart(12, "0")}`;
export const perfWaveName = (index: number) => `Perf wave ${index}`;
export const perfMessageText = (serialNo: number) => `Perf message ${serialNo}`;

type FeedDrop = ApiWaveDropsFeedV2["drops"][number];

export type ChatPerfFixture = {
  /** Sends `count` new messages to a wave, `intervalMs` apart. */
  readonly send: (
    waveIndex: number,
    count: number,
    intervalMs: number
  ) => Promise<{
    readonly firstSerialNo: number;
    readonly lastSerialNo: number;
  }>;
  readonly waitForSockets: () => Promise<void>;
};

/**
 * Signs in through the ordinary stored-account path, so the same spec runs
 * on a development server (where dev auth resolves to the same wallet) and on
 * a production build (where dev auth is off). The token is unsigned and
 * local-only: the loopback mock API accepts it; no deployed API would.
 */
async function installStoredAccount(page: Page, baseURL: string) {
  const address = "0x0000000000000000000000000000000000000529";
  const profileId = "00000000-0000-4000-8000-000000000531";
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const jwt = [
    encode({ alg: "none", typ: "JWT" }),
    encode({
      id: "local-chat-perf-sandbox",
      sub: address,
      iat: 1760000000,
      exp: 2000000000,
      role: null,
    }),
    "",
  ].join(".");
  await page.addInitScript(
    ({ localOrigin, address, jwt, profileId }) => {
      if (location.origin !== localOrigin) return;
      localStorage.setItem(
        "6529-wallet-accounts",
        JSON.stringify([
          {
            address,
            jwt,
            role: null,
            refreshToken: null,
            profileId,
            profileHandle: "playwright",
            authSessionVersion: "v2",
          },
        ])
      );
      localStorage.setItem("6529-wallet-active-address", address);
    },
    { localOrigin: new URL(baseURL).origin, address, jwt, profileId }
  );
}

export async function installChatPerfFixture(
  page: Page,
  baseURL: string | undefined
): Promise<ChatPerfFixture> {
  const origin = getSandboxApiOrigin(baseURL);
  await installStoredAccount(page, baseURL!);
  const [overviewResponse, detailResponse, feedResponse] = await Promise.all([
    page.request.get(`${origin}/api/v2/waves`),
    page.request.get(`${origin}/api/waves/${SANDBOX_WAVE_ID}`),
    page.request.get(`${origin}/api/v2/waves/${SANDBOX_WAVE_ID}/drops`),
  ]);
  expect(overviewResponse.ok()).toBe(true);
  expect(detailResponse.ok()).toBe(true);
  expect(feedResponse.ok()).toBe(true);
  const overviewTemplate = (
    (await overviewResponse.json()) as ApiWaveOverviewPage
  ).data[0];
  const detailTemplate = (await detailResponse.json()) as ApiWave;
  const feedTemplate = (await feedResponse.json()) as ApiWaveDropsFeedV2;
  const feedDropTemplate = feedTemplate.drops[0];
  const contextTemplate = overviewTemplate?.context_profile_context;
  if (!overviewTemplate || !contextTemplate || !feedDropTemplate)
    throw new Error("Missing sandbox wave fixtures.");
  const wsDropTemplate = detailTemplate.description_drop;
  const now = Date.now();

  const overviews: ApiWaveOverview[] = Array.from(
    { length: PERF_WAVE_COUNT },
    (_, index) => ({
      ...overviewTemplate,
      id: perfWaveId(index),
      name: perfWaveName(index),
      last_drop_time: now - (index + 1) * 60_000,
      context_profile_context: {
        ...contextTemplate,
        pinned: false,
        subscribed: true,
        muted: false,
        unread_drops: 0,
      },
    })
  );
  const waveMin = (index: number) => ({
    ...wsDropTemplate.wave,
    id: perfWaveId(index),
    name: perfWaveName(index),
  });
  type Message = {
    readonly index: number;
    readonly serialNo: number;
    readonly createdAt: number;
    /** Posted by the signed-in viewer rather than another reader. */
    readonly own?: boolean;
    readonly content?: string;
  };
  const feedDrop = ({ index, serialNo, createdAt, own, content }: Message) =>
    ({
      ...feedDropTemplate,
      id: `${perfWaveId(index)}-${serialNo}`,
      serial_no: serialNo,
      created_at: createdAt,
      content: content ?? perfMessageText(serialNo),
      hide_link_preview: true,
      author:
        (own ?? serialNo % 3 === 0)
          ? feedDropTemplate.author
          : { ...feedDropTemplate.author, ...PERF_READER },
    }) satisfies FeedDrop;
  const wsDrop = ({ index, serialNo, createdAt, own, content }: Message) =>
    ({
      ...wsDropTemplate,
      id: `${perfWaveId(index)}-${serialNo}`,
      serial_no: serialNo,
      wave: waveMin(index),
      author: own
        ? wsDropTemplate.author
        : { ...wsDropTemplate.author, ...PERF_READER },
      created_at: createdAt,
      parts: [
        {
          part_id: 1,
          content: content ?? perfMessageText(serialNo),
          media: [],
          attachments: [],
          quoted_drop: null,
        },
      ],
      parts_count: 1,
      hide_link_preview: true,
    }) satisfies ApiDrop;

  // Messages the server knows, per wave, oldest first.
  const messages = new Map<number, FeedDrop[]>();
  messages.set(
    PERF_OPEN_WAVE_INDEX,
    Array.from({ length: INITIAL_MESSAGES }, (_, offset) =>
      feedDrop({
        index: PERF_OPEN_WAVE_INDEX,
        serialNo: offset + 1,
        createdAt: now - (INITIAL_MESSAGES - offset) * 30_000,
      })
    )
  );
  const waveIndexOf = (id: string | undefined) =>
    overviews.findIndex((wave) => wave.id === id);

  const listPage = () => ({ data: overviews, page: 1, next: false });
  await page.route("**/api/v2/waves?**", (route) =>
    route.fulfill({ json: listPage() })
  );
  await page.route("**/api/v2/waves/joined**", (route) =>
    route.fulfill({
      json: {
        data: overviews,
        next_cursor: null,
        snapshot_expires_at: Date.now() + 900_000,
      },
    })
  );
  await page.route(
    /\/api\/waves\/00000000-0000-4000-8000-0000000095\d{2}$/,
    (route) => {
      const id = new URL(route.request().url()).pathname.split("/").at(-1);
      const index = waveIndexOf(id);
      return route.fulfill({
        json: {
          ...detailTemplate,
          id,
          name: perfWaveName(index),
          pinned: false,
          description_drop: {
            ...detailTemplate.description_drop,
            wave: waveMin(index),
          },
        },
      });
    }
  );
  await page.route(
    /\/api\/v2\/waves\/00000000-0000-4000-8000-0000000095\d{2}\/drops(\?.*)?$/,
    (route: Route) => {
      const url = new URL(route.request().url());
      const index = waveIndexOf(url.pathname.split("/").at(-2));
      const all = messages.get(index) ?? [];
      const limit = Number(url.searchParams.get("limit") ?? "50");
      const serialNoLimit = Number(url.searchParams.get("serial_no_limit"));
      const strategy = url.searchParams.get("search_strategy");
      let selected = all;
      if (strategy === "FIND_NEWER")
        selected = all.filter((drop) => drop.serial_no > serialNoLimit);
      else if (strategy === "FIND_OLDER")
        selected = all.filter((drop) => drop.serial_no < serialNoLimit);
      const newestFirst = [...selected].reverse();
      const drops =
        strategy === "FIND_NEWER"
          ? newestFirst.slice(-limit)
          : newestFirst.slice(0, limit);
      return route.fulfill({
        json: { wave: overviews[index], drops },
      });
    }
  );
  // Read markers for the synthetic waves stay in the browser; they are still
  // counted as requests.
  await page.route(
    /\/api\/notifications\/wave\/00000000-0000-4000-8000-0000000095\d{2}\/read$/,
    (route) => route.fulfill({ json: { dm_unread_state: null } })
  );
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: {} })
  );

  const sockets = new Map<WebSocketRoute, string | null>();
  const apiPort = new URL(origin).port;
  await page.routeWebSocket(
    (url) => url.port === apiPort,
    (socket) => {
      sockets.set(socket, null);
      socket.onMessage((message) => {
        const frame = JSON.parse(String(message)) as {
          type?: string;
          wave_id?: string;
        };
        if (frame.type === "AUTHENTICATE")
          socket.send(JSON.stringify({ type: "AUTHENTICATED", data: {} }));
        if (frame.type === "SUBSCRIBE_TO_WAVE")
          sockets.set(socket, frame.wave_id ?? null);
      });
      socket.onClose(() => sockets.delete(socket));
    }
  );

  let nextCreatedAt = now;
  const nextSerialNo = (index: number) =>
    (messages.get(index)?.at(-1)?.serial_no ?? INITIAL_MESSAGES) + 1;
  const deliver = (
    index: number,
    post: { readonly own?: boolean; readonly content?: string } = {}
  ) => {
    nextCreatedAt = Math.max(nextCreatedAt + 1, Date.now());
    const message: Message = {
      index,
      serialNo: nextSerialNo(index),
      createdAt: nextCreatedAt,
      ...post,
    };
    const list = messages.get(index) ?? [];
    list.push(feedDrop(message));
    messages.set(index, list);
    const drop = wsDrop(message);
    const frame = JSON.stringify({ type: "DROP_UPDATE", data: drop });
    const waveId = perfWaveId(index);
    for (const [socket, subscribedWaveId] of sockets) {
      if (subscribedWaveId === null || subscribedWaveId === waveId)
        socket.send(frame);
    }
    return drop;
  };

  // The viewer's own posts to the synthetic waves are answered in the
  // browser, never by the sandbox API, and fan out like any other message.
  await page.route("**/api/drops", async (route) => {
    const request = route.request();
    const body = request.postDataJSON() as {
      readonly wave_id?: string;
      readonly parts?: readonly { readonly content?: string | null }[];
    } | null;
    const index = waveIndexOf(body?.wave_id);
    if (request.method() !== "POST" || index < 0) return route.fallback();
    const drop = deliver(index, {
      own: true,
      content: body?.parts?.[0]?.content ?? "",
    });
    return route.fulfill({ json: drop });
  });

  return {
    async waitForSockets() {
      await expect.poll(() => sockets.size).toBeGreaterThan(0);
    },
    async send(waveIndex, count, intervalMs) {
      const firstSerialNo = nextSerialNo(waveIndex);
      let lastSerialNo = firstSerialNo;
      for (let sent = 0; sent < count; sent += 1) {
        if (sent > 0 && intervalMs > 0)
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
        lastSerialNo = deliver(waveIndex).serial_no;
      }
      return { firstSerialNo, lastSerialNo };
    },
  };
}
